"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationResult } from "@/lib/types";
import { GESTURE_COLORS } from "@/lib/types";
import { contour, GESTURE_LABEL, GESTURE_SYMBOL } from "@/lib/gestures";
import { analyzeMelody, MelodyPlayer, melodyToMidi, midiToNoteName, parseMelodyTokens, STEP_SECONDS } from "@/lib/midi";

interface ResultViewProps {
  result: GenerationResult;
  /** the 64 gesture tokens the melody was written from */
  tokens: number[];
  onReset: () => void;
  onTryAgain: () => void;
}

const KEYS_W = 44;

export function ResultView({ result, tokens, onReset, onTryAgain }: ResultViewProps) {
  const melody = result.melody;
  const steps = melody.length;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<MelodyPlayer | null>(null);
  const runRef = useRef(0);

  const notes = parseMelodyTokens(melody, 1); // start / duration in steps
  const analysis = analyzeMelody(melody);
  const pitches = notes.map((n) => n.pitch);
  let lo = pitches.length ? Math.min(...pitches) : 60;
  let hi = pitches.length ? Math.max(...pitches) : 72;
  if (hi - lo < 12) {
    const mid = Math.round((lo + hi) / 2);
    lo = mid - 6;
    hi = mid + 6;
  }
  lo -= 1;
  hi += 1;
  const rows = hi - lo + 1;
  const step = playing ? Math.min(steps - 1, Math.floor(progress * steps)) : null;

  useEffect(() => () => playerRef.current?.dispose(), []);

  const toggle = async () => {
    if (playing) {
      runRef.current++;
      playerRef.current?.stop();
      setPlaying(false);
      setProgress(0);
      return;
    }
    const run = ++runRef.current;
    if (!playerRef.current) {
      playerRef.current = new MelodyPlayer();
      playerRef.current.setOnProgress(setProgress);
    }
    setPlaying(true);
    await playerRef.current.play(melody, STEP_SECONDS);
    if (run === runRef.current) {
      setPlaying(false);
      setProgress(0);
    }
  };

  const download = () => {
    const bytes = melodyToMidi(melody);
    const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "melody-diffuser.mid";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // the gesture contour, scaled to the roll, to compare against the notes
  const shape = [0, ...contour(tokens)];
  const sMin = Math.min(...shape);
  const sSpan = Math.max(4, Math.max(...shape) - sMin);
  const shapePts = shape.map((v, i) => `${(i / steps) * 100},${8 + (1 - (v - sMin) / sSpan) * 84}`).join(" ");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-semibold">Your melody</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {analysis.noteCount} notes · {midiToNoteName(analysis.pitchRange.min)}–{midiToNoteName(analysis.pitchRange.max)} · 4 bars at 75 BPM
        </p>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] p-4">
          <button
            onClick={toggle}
            aria-label={playing ? "Stop" : "Play"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-white transition-transform hover:scale-105"
          >
            {playing ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" /></svg>
            ) : (
              <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <div className="min-w-[140px] flex-1">
            <div className="mb-1.5 font-mono text-xs text-[var(--text-secondary)]">
              {playing && step !== null ? `Bar ${Math.floor(step / 16) + 1} · beat ${Math.floor((step % 16) / 4) + 1}` : "Press play · sound on"}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
              <div className="h-full bg-[var(--blue)]" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <button onClick={download} className="btn btn-ghost text-sm">
            Download MIDI
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <div className="min-w-[560px]">
            {/* Piano roll */}
            <div className="relative h-60 overflow-hidden rounded border border-[var(--border)] bg-[var(--bg)]">
              <div className="absolute inset-y-0 left-0 z-10 border-r border-[var(--border)] bg-[var(--surface)]" style={{ width: KEYS_W }}>
                {Array.from({ length: rows }, (_, i) => {
                  const pitch = hi - i;
                  const name = midiToNoteName(pitch);
                  return (
                    <div key={pitch} className="flex items-center justify-end pr-1.5 font-mono text-[9px] text-[var(--gray-light)]" style={{ height: `${100 / rows}%` }}>
                      {name.startsWith("C") && !name.includes("#") ? name : ""}
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-y-0 right-0" style={{ left: KEYS_W }}>
                {/* rows for black keys, beat and bar lines */}
                {Array.from({ length: rows }, (_, i) =>
                  midiToNoteName(hi - i).includes("#") ? (
                    <div key={i} className="absolute inset-x-0 bg-black/[0.035]" style={{ top: `${(i / rows) * 100}%`, height: `${100 / rows}%` }} />
                  ) : null,
                )}
                {Array.from({ length: steps / 4 }, (_, b) => (
                  <div key={b} className="absolute inset-y-0 w-px" style={{ left: `${((b * 4) / steps) * 100}%`, background: b % 4 === 0 ? "var(--border)" : "rgba(0,0,0,0.04)" }} />
                ))}
                {/* the shape you drew */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                  <polyline points={shapePts} fill="none" stroke="var(--orange)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                </svg>
                {/* notes */}
                {notes.map((n, i) => {
                  const active = step !== null && step >= n.startTime && step < n.startTime + n.duration;
                  return (
                    <div
                      key={i}
                      title={midiToNoteName(n.pitch)}
                      className="absolute rounded-sm transition-colors"
                      style={{
                        left: `calc(${(n.startTime / steps) * 100}% + 1px)`,
                        width: `calc(${(n.duration / steps) * 100}% - 2px)`,
                        top: `${((hi - n.pitch) / rows) * 100}%`,
                        height: `${100 / rows}%`,
                        minHeight: 6,
                        background: active ? "var(--navy)" : "var(--blue)",
                      }}
                    />
                  );
                })}
                {step !== null && <div className="absolute inset-y-0 w-0.5 bg-[var(--navy)]" style={{ left: `${progress * 100}%` }} />}
              </div>
            </div>

            {/* Gestures, aligned with the roll */}
            <div className="mt-2 flex" style={{ paddingLeft: KEYS_W }}>
              {tokens.map((g, i) => (
                <div
                  key={i}
                  title={`Step ${i + 1}: ${GESTURE_LABEL[g]}`}
                  className="flex h-6 flex-1 items-center justify-center font-mono text-[11px] font-bold"
                  style={{ color: g === 0 ? "var(--border)" : GESTURE_COLORS[g], background: step === i ? "var(--bg-card)" : undefined }}
                >
                  {g === 0 ? "·" : GESTURE_SYMBOL[g]}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          <span>
            <span className="mr-1.5 inline-block h-2 w-4 rounded-sm bg-[var(--blue)] align-middle" />
            Notes the model wrote
          </span>
          <span>
            <span className="mr-1.5 inline-block w-4 border-t-2 border-dashed border-[var(--orange)] align-middle" />
            The shape you drew
          </span>
          <span>↑ ↓ Your gestures (⇡ ⇣ bigger steps, · hold)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button onClick={onTryAgain} className="btn btn-melody">
          Record another
        </button>
        <button onClick={onReset} className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Change mode
        </button>
      </div>
    </div>
  );
}
