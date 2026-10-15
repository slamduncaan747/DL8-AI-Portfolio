"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hands, Results } from "@mediapipe/hands";
import { GESTURE_COLORS, type ModeConfig } from "@/lib/types";
import { classifyMovement, GESTURE_LABEL, GESTURE_SYMBOL } from "@/lib/gestures";

export type InputSource = "camera" | "pointer";

interface GestureCaptureProps {
  mode: ModeConfig;
  input: InputSource;
  onComplete: (gestures: number[]) => void;
  onCancel: () => void;
  onUsePointer: () => void;
}

type Phase = "loading" | "ready" | "countdown" | "capturing" | "done";

/** Drawing frame; positions are measured in these units so thresholds don't depend on the camera. */
const W = 1280;
const H = 720;
/** pinned to the installed @mediapipe/hands so the script and its assets always match */
const MEDIAPIPE = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240";
/** after this long without seeing a hand, warn and record holds */
const LOST_MS = 500;

export function GestureCapture({ mode, input, onComplete, onCancel, onUsePointer }: GestureCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Live values read by the animation loop (kept out of React state so the loop never restarts).
  const pos = useRef<{ x: number; y: number; seen: number } | null>(null);
  const ref = useRef<{ x: number; y: number } | null>(null);
  const gesturesRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("loading");
  const t0 = useRef(0);
  const finished = useRef(false);

  const [phase, setPhaseState] = useState<Phase>("loading");
  const [loadingText, setLoadingText] = useState(input === "camera" ? "Starting camera…" : "");
  const [error, setError] = useState<string | null>(null);
  const [gestures, setGestures] = useState<number[]>([]);
  const [live, setLive] = useState(0);
  const [handVisible, setHandVisible] = useState(input === "pointer");
  const [count, setCount] = useState(0);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  // Count-in: three beats in slow modes, one bar of quarter notes when each step is a sixteenth.
  const countBeats = mode.beatInterval >= 1 ? 3 : 4;
  const countInterval = mode.beatInterval >= 1 ? mode.beatInterval : mode.beatInterval * 4;
  const tickEvery = mode.beatInterval >= 1 ? 1 : 4;

  const tick = useCallback((accent: boolean) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 1320 : 880;
    g.gain.setValueAtTime(accent ? 0.18 : 0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.07);
  }, []);

  // ---- camera + hand tracking
  useEffect(() => {
    if (input !== "camera") {
      setPhase("ready");
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: "NotSupported" });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        setLoadingText("Loading hand tracking…");
        const { Hands } = await import("@mediapipe/hands");
        const hands = new Hands({ locateFile: (file: string) => `${MEDIAPIPE}/${file}` });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
        hands.onResults((results: Results) => {
          const lm = results.multiHandLandmarks?.[0]?.[8]; // index fingertip
          const v = videoRef.current;
          if (!lm || !v || !v.videoWidth) return;
          // map into the cover-fitted, mirrored drawing frame
          const s = Math.max(W / v.videoWidth, H / v.videoHeight);
          const ox = (W - v.videoWidth * s) / 2;
          const oy = (H - v.videoHeight * s) / 2;
          pos.current = { x: W - (ox + lm.x * v.videoWidth * s), y: oy + lm.y * v.videoHeight * s, seen: performance.now() };
        });
        await hands.initialize();
        if (cancelled) {
          hands.close();
          return;
        }
        handsRef.current = hands;
        setPhase("ready");
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string } | null)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow it in your browser's site settings, or draw with your mouse or finger instead."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "No camera was found on this device."
              : name === "NotSupported"
                ? "This browser can't use the camera here."
                : "Hand tracking couldn't start. Check your connection, or draw with your mouse or finger instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      handsRef.current?.close();
      handsRef.current = null;
    };
  }, [input]);

  // ---- one animation loop for the whole session
  useEffect(() => {
    let raf = 0;
    let busy = false;
    let lastLive = -1;
    let lastVisible = input === "pointer";
    let lastCount = -1;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const video = videoRef.current;
      const hands = handsRef.current;
      if (input === "camera" && hands && video && video.readyState >= 2 && !busy) {
        busy = true;
        hands.send({ image: video }).catch(() => {}).finally(() => (busy = false));
      }

      const p = pos.current;
      const visible = !!p && (input === "pointer" || now - p.seen < LOST_MS);
      if (visible !== lastVisible) setHandVisible((lastVisible = visible));

      const ph = phaseRef.current;
      let beatProgress = 0;
      if (ph === "countdown") {
        const elapsed = (now - t0.current) / 1000;
        const n = Math.floor(elapsed / countInterval);
        if (n !== lastCount) {
          lastCount = n;
          if (n < countBeats) {
            setCount(countBeats - n);
            tick(true);
          }
        }
        if (n >= countBeats) {
          // capture starts with the reference at wherever the hand is now
          ref.current = visible && p ? { x: p.x, y: p.y } : { x: W / 2, y: H / 2 };
          t0.current += countBeats * countInterval * 1000;
          tick(true);
          setPhase("capturing");
        }
      } else if (ph === "capturing") {
        const elapsed = (now - t0.current) / 1000;
        const recorded = gesturesRef.current.length;
        beatProgress = Math.min(1, elapsed / mode.beatInterval - recorded);
        const r = ref.current!;
        const g = visible && p ? classifyMovement(p.y - r.y, p.x - r.x, mode) : 0;
        if (g !== lastLive) setLive((lastLive = g));
        if (elapsed >= (recorded + 1) * mode.beatInterval) {
          const next = [...gesturesRef.current, g];
          gesturesRef.current = next;
          setGestures(next);
          if (visible && p) ref.current = { x: p.x, y: p.y };
          if (next.length % tickEvery === 0 && next.length < mode.seqLen) tick(next.length % (tickEvery * 4) === 0);
          if (next.length >= mode.seqLen && !finished.current) {
            finished.current = true;
            setPhase("done");
            setTimeout(() => onComplete(next), 700);
          }
        }
      }

      draw(visible, beatProgress);
    };

    const draw = (visible: boolean, beatProgress: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const video = videoRef.current;
      if (input === "camera" && video && video.videoWidth) {
        const s = Math.max(W / video.videoWidth, H / video.videoHeight);
        const dw = video.videoWidth * s;
        const dh = video.videoHeight * s;
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.restore();
        ctx.fillStyle = "rgba(10,12,16,0.35)";
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#15171b";
        ctx.fillRect(0, 0, W, H);
      }

      const ph = phaseRef.current;
      const p = pos.current;
      const r = ph === "capturing" ? ref.current : visible && p ? { x: p.x, y: p.y } : null;

      // Zones around the reference: where you were on the last beat.
      if (r) {
        const bands: Array<[number, number, string]> = [
          [-mode.largeJumpPx, -H, "Up a lot"],
          [-mode.mediumJumpPx, -mode.largeJumpPx, "Up more"],
          [-mode.verticalHoldThresh, -mode.mediumJumpPx, "Up"],
          [mode.verticalHoldThresh, mode.mediumJumpPx, "Down"],
          [mode.mediumJumpPx, mode.largeJumpPx, "Down more"],
          [mode.largeJumpPx, H, "Down a lot"],
        ];
        ctx.font = "500 22px ui-monospace, monospace";
        ctx.textAlign = "right";
        for (const [a, b, label] of bands) {
          const y1 = Math.max(0, Math.min(H, r.y + a));
          const y2 = Math.max(0, Math.min(H, r.y + b));
          if (Math.abs(y2 - y1) < 2) continue;
          ctx.strokeStyle = "rgba(255,255,255,0.18)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y1);
          ctx.lineTo(W, y1);
          ctx.stroke();
          if (Math.abs(y2 - y1) > 30) {
            ctx.fillStyle = "rgba(255,255,255,0.45)";
            ctx.fillText(label.toUpperCase(), W - 24, (y1 + y2) / 2 + 8);
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, r.y - mode.verticalHoldThresh, W, mode.verticalHoldThresh * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, r.y);
        ctx.lineTo(W, r.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "left";
        ctx.fillText(ph === "capturing" ? "LAST BEAT · HOLD" : "HOLD", 24, r.y - 12);
      }

      // Fingertip
      if (visible && p) {
        const g = ph === "capturing" && r ? classifyMovement(p.y - r.y, p.x - r.x, mode) : 0;
        ctx.fillStyle = ph === "capturing" ? GESTURE_COLORS[g] : "#ffffff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Beat progress
      if (ph === "capturing") {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(0, H - 8, W, 8);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, H - 8, W * beatProgress, 8);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [input, mode, countBeats, countInterval, tickEvery, tick, onComplete]);

  useEffect(() => () => void audioRef.current?.close(), []);

  const start = () => {
    try {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume();
    } catch {
      /* no metronome */
    }
    gesturesRef.current = [];
    setGestures([]);
    finished.current = false;
    t0.current = performance.now();
    setCount(countBeats);
    setPhase("countdown");
  };

  // Pointer input: drag (or just move) over the stage.
  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (input !== "pointer") return;
    const rect = e.currentTarget.getBoundingClientRect();
    pos.current = { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H, seen: performance.now() };
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="label mb-3">Camera unavailable</div>
        <p className="mb-6 text-[var(--text-secondary)]">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={onUsePointer} className="btn btn-melody">Use mouse or touch</button>
          <button onClick={onCancel} className="btn btn-ghost">Back</button>
        </div>
      </div>
    );
  }

  const big = mode.seqLen <= 16;
  const howTo =
    input === "camera"
      ? "Hold up one finger. On every beat, the change in its height since the last beat is recorded."
      : "Move your mouse, or drag your finger, over the box. On every beat, the change in height since the last beat is recorded.";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-semibold">{mode.name}</span>
          <span className="ml-2 font-mono text-sm text-[var(--text-secondary)]">
            {gestures.length}/{mode.seqLen} beats
          </span>
        </div>
        <span className="label">{input === "camera" ? "Hand tracking" : "Mouse / touch"}</span>
      </div>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">{howTo}</p>

      <div className="relative aspect-video overflow-hidden rounded-lg bg-[#15171b]">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          className="h-full w-full"
          style={{ touchAction: input === "pointer" ? "none" : "auto", cursor: input === "pointer" ? "crosshair" : "default" }}
        />

        {phase === "loading" && (
          <Overlay>
            <div className="font-mono text-sm text-white/80">{loadingText}</div>
          </Overlay>
        )}

        {phase === "ready" && (
          <Overlay dim={false}>
            <div className="rounded-md bg-black/70 px-5 py-4 text-center">
              <p className="mb-3 max-w-xs text-sm text-white/85">
                {input === "camera"
                  ? handVisible
                    ? "Found your finger. Start when you're ready."
                    : "Raise one hand so the camera can see your index finger."
                  : "Start, then move up and down with the beat."}
              </p>
              <button onClick={start} disabled={input === "camera" && !handVisible} className="btn btn-melody disabled:opacity-40">
                Start · {mode.seqLen} beats
              </button>
            </div>
          </Overlay>
        )}

        {phase === "countdown" && (
          <Overlay>
            <div className="text-center">
              <div className="font-mono text-7xl font-bold text-white">{count}</div>
              <div className="mt-2 font-mono text-sm text-white/70">Feel the beat…</div>
            </div>
          </Overlay>
        )}

        {phase === "capturing" && (
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded px-3 py-1.5 font-mono text-sm font-semibold text-white" style={{ background: GESTURE_COLORS[live] }}>
            <span>{GESTURE_SYMBOL[live]}</span>
            {GESTURE_LABEL[live]}
          </div>
        )}

        {input === "camera" && !handVisible && (phase === "capturing" || phase === "countdown") && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <span className="rounded bg-black/75 px-3 py-2 font-mono text-sm text-white">Can&apos;t see your hand: recording holds</span>
          </div>
        )}

        {phase === "done" && (
          <Overlay>
            <div className="text-center font-semibold text-white">Got it. Sending to the model…</div>
          </Overlay>
        )}
      </div>

      {/* One slot per beat */}
      <div className={`mt-4 grid gap-1 ${big ? "grid-cols-8" : "grid-cols-16"}`}>
        {Array.from({ length: mode.seqLen }, (_, i) => {
          const g = gestures[i];
          const filled = g !== undefined;
          const current = phase === "capturing" && i === gestures.length;
          return (
            <div
              key={i}
              title={filled ? GESTURE_LABEL[g] : undefined}
              className={`flex items-center justify-center rounded font-mono font-bold text-white ${big ? "h-11 text-lg" : "h-5 text-[10px]"}`}
              style={{
                background: filled ? GESTURE_COLORS[g] : "transparent",
                border: filled ? "none" : `1px ${current ? "solid var(--black)" : "dashed var(--border)"}`,
              }}
            >
              {filled ? GESTURE_SYMBOL[g] : ""}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {input === "camera" && phase !== "done" && (
          <button onClick={onUsePointer} className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Use mouse or touch instead
          </button>
        )}
        <button onClick={onCancel} className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Overlay({ children, dim = true }: { children: React.ReactNode; dim?: boolean }) {
  return <div className={`absolute inset-0 flex items-center justify-center ${dim ? "bg-black/60" : ""}`}>{children}</div>;
}
