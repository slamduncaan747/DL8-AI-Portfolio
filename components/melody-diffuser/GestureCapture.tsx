"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ModeConfig, GESTURE_COLORS, GESTURE_NAMES_SIMPLE } from "@/lib/types";

interface GestureCaptureProps {
  mode: ModeConfig;
  onComplete: (gestures: number[]) => void;
  onCancel: () => void;
}

type Phase = "permission" | "countdown" | "capturing" | "done";

export function GestureCapture({ mode, onComplete, onCancel }: GestureCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const lastBeatRef = useRef<number>(0);
  const isInitRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("permission");
  const [countdown, setCountdown] = useState(mode.countdownDuration);
  const [gestures, setGestures] = useState<number[]>([]);
  const [currentGesture, setCurrentGesture] = useState(0);
  const [gestureStrength, setGestureStrength] = useState(0);
  const [handY, setHandY] = useState<number | null>(null);
  const [handX, setHandX] = useState<number | null>(null);
  const [prevY, setPrevY] = useState<number | null>(null);
  const [prevX, setPrevX] = useState<number | null>(null);
  const [centerY, setCenterY] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [beatProgress, setBeatProgress] = useState(0);

  // More responsive gesture detection with horizontal REPEAT support
  const detectGesture = useCallback((y: number, prevY: number, x: number | null, prevX: number | null): { gesture: number; strength: number } => {
    const dy = y - prevY;
    const { verticalHoldThresh, horizontalRepeatThresh, smallJumpPx, mediumJumpPx, largeJumpPx, name } = mode;
    
    // Check for horizontal movement (REPEAT) only in Expert mode
    if (name === "Expert" && x !== null && prevX !== null) {
      const dx = Math.abs(x - prevX);
      const dyAbs = Math.abs(dy);
      
      // If horizontal movement is significant and vertical is small, it's a REPEAT
      if (dx >= horizontalRepeatThresh && dyAbs < smallJumpPx) {
        return { gesture: 1, strength: 0.7 }; // REPEAT
      }
    }
    
    // Check for hold (minimal vertical movement)
    if (Math.abs(dy) < verticalHoldThresh) {
      return { gesture: 0, strength: 0.5 }; // HOLD
    }
    
    // Vertical movements
    if (dy < 0) { // Moving up
      const abs = Math.abs(dy);
      if (abs >= largeJumpPx) return { gesture: 4, strength: 1 };
      if (abs >= mediumJumpPx) return { gesture: 3, strength: 0.8 };
      if (abs >= smallJumpPx) return { gesture: 2, strength: 0.6 };
      return { gesture: 2, strength: abs / smallJumpPx };
    } else { // Moving down
      if (dy >= largeJumpPx) return { gesture: 7, strength: 1 };
      if (dy >= mediumJumpPx) return { gesture: 6, strength: 0.8 };
      if (dy >= smallJumpPx) return { gesture: 5, strength: 0.6 };
      return { gesture: 5, strength: dy / smallJumpPx };
    }
  }, [mode]);

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      try {
        const { Hands } = await import("@mediapipe/hands");
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        hands.onResults((results: any) => {
          if (results.multiHandLandmarks?.[0]) {
            const lm = results.multiHandLandmarks[0][8];
            const video = videoRef.current;
            if (video && video.videoHeight > 0) {
              setHandY(lm.y * video.videoHeight);
              setHandX(lm.x * video.videoWidth);
            }
          }
        });
        handsRef.current = hands;
      } catch (e) {
        setError("Failed to initialize hand tracking");
      }
    };
    init();
    return () => { handsRef.current?.close(); };
  }, []);

  // Start webcam
  useEffect(() => {
    if (isInitRef.current) return;
    isInitRef.current = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            setCenterY(video.videoHeight / 2);
            video.play();
            setPhase("countdown");
          };
        }
      } catch (e) {
        setError("Camera access denied");
      }
    };
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          setPhase("capturing");
          lastBeatRef.current = performance.now();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Main capture loop
  useEffect(() => {
    if (phase !== "capturing" || !handsRef.current) return;

    const process = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(process);
        return;
      }

      try { await handsRef.current.send({ image: video }); } catch {}

      const now = performance.now();
      const elapsed = (now - lastBeatRef.current) / 1000;
      const progress = Math.min(elapsed / mode.beatInterval, 1);
      setBeatProgress(progress);

      // Gesture detection
      if (handY !== null && prevY !== null) {
        const { gesture, strength } = detectGesture(handY, prevY, handX, prevX);
        setCurrentGesture(gesture);
        setGestureStrength(strength);
      }

      // Capture on beat
      if (elapsed >= mode.beatInterval) {
        setGestures(prev => {
          const next = [...prev, currentGesture];
          if (next.length >= mode.seqLen) {
            setPhase("done");
            setTimeout(() => onComplete(next), 1000);
          }
          return next;
        });
        lastBeatRef.current += mode.beatInterval * 1000;
        setPrevY(handY);
        setPrevX(handX);
      }

      // Draw
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0);
        ctx.restore();

        // Darken slightly
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Zone guides
        drawZones(ctx, canvas.width, canvas.height);

        // Hand indicator
        if (handY !== null) {
          drawHand(ctx, canvas.width / 2, handY);
        }

        // Beat pulse indicator
        drawBeatPulse(ctx, canvas.width, canvas.height, progress);
      }

      animationRef.current = requestAnimationFrame(process);
    };

    animationRef.current = requestAnimationFrame(process);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [phase, handY, handX, prevY, prevX, currentGesture, mode, detectGesture, onComplete]);

  const drawZones = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.globalAlpha = 0.4;
    
    // Center zone
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w * 0.15, centerY);
    ctx.lineTo(w * 0.85, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText("↑ UP", w - 20, 30);
    ctx.fillText("— HOLD", w - 20, centerY + 5);
    ctx.fillText("↓ DOWN", w - 20, h - 20);
    
    // REPEAT hint in expert mode
    if (mode.name === "Expert") {
      ctx.textAlign = "left";
      ctx.fillText("↔ REPEAT", 20, centerY + 5);
    }

    ctx.globalAlpha = 1;
  };

  const drawHand = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const color = GESTURE_COLORS[currentGesture] || "#fff";
    const radius = 12 + gestureStrength * 10;

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 + gestureStrength * 20;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Label
    ctx.font = "bold 12px system-ui";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(GESTURE_NAMES_SIMPLE[currentGesture], x, y - radius - 8);
  };

  const drawBeatPulse = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
    // Bottom beat bar
    const barHeight = 4;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, h - barHeight, w, barHeight);
    
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(0, h - barHeight, w * progress, barHeight);

    // Pulse on beat approach
    if (progress > 0.8) {
      const pulseAlpha = (progress - 0.8) * 2;
      ctx.strokeStyle = `rgba(255,255,255,${pulseAlpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <p className="text-[var(--text-secondary)] mb-6">{error}</p>
        <button onClick={onCancel} className="btn btn-primary">Go back</button>
      </div>
    );
  }

  const progress = (gestures.length / mode.seqLen) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-semibold">{mode.name}</span>
          <span className="text-[var(--text-secondary)] ml-2">·</span>
          <span className="text-[var(--text-secondary)] ml-2 font-mono">{gestures.length}/{mode.seqLen}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--border)] rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-[var(--text-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Video */}
      <div className="aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden relative shadow-lg">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {/* Countdown overlay */}
        <AnimatePresence>
          {phase === "countdown" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
            >
              <motion.span
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="text-7xl font-bold text-white font-mono"
              >
                {countdown}
              </motion.span>
              <p className="text-white/60 font-mono mt-4">Get ready to gesture</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done overlay */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="text-5xl mb-4"
              >
                ✨
              </motion.div>
              <span className="text-2xl font-bold text-white">Captured!</span>
              <p className="text-white/60 font-mono mt-2">Processing your gestures...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permission overlay */}
        {phase === "permission" && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-mono">
            <div className="text-center">
              <div className="animate-pulse text-3xl mb-4">📷</div>
              <div>Waiting for camera...</div>
            </div>
          </div>
        )}

        {/* Current gesture indicator */}
        {phase === "capturing" && (
          <div className="absolute top-4 left-4">
            <div 
              className="px-3 py-1.5 rounded-full text-white text-sm font-mono flex items-center gap-2"
              style={{ backgroundColor: GESTURE_COLORS[currentGesture] }}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {GESTURE_NAMES_SIMPLE[currentGesture]}
            </div>
          </div>
        )}
      </div>

      {/* Recent gestures */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)] mr-2">Recent:</span>
        <div className="flex gap-1 flex-wrap">
          {gestures.slice(-12).map((g, i) => (
            <motion.div
              key={gestures.length - 12 + i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-6 h-6 rounded"
              style={{ backgroundColor: GESTURE_COLORS[g] }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
