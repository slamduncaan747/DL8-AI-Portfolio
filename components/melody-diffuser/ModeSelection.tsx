"use client";

import { MODE_CONFIGS, type ModeConfig } from "@/lib/types";
import type { InputSource } from "./GestureCapture";

interface ModeSelectionProps {
  input: InputSource;
  onInputChange: (input: InputSource) => void;
  onSelect: (mode: ModeConfig) => void;
  onTutorial: () => void;
}

const HOW = [
  ["Move with the beat", "Raise or lower one finger in front of your camera, or move your mouse, while a metronome ticks."],
  ["Each beat becomes a gesture", "How far you moved since the last beat is recorded: up, down or hold, in three sizes."],
  ["The model writes a melody", "A diffusion model writes a four-bar melody whose pitch follows the shape you drew."],
];

export function ModeSelection({ input, onInputChange, onSelect, onTutorial }: ModeSelectionProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-semibold">Compose a melody with your hand</h2>
      <p className="mb-8 text-[var(--text-secondary)]">You draw the shape; the model fills in the notes.</p>

      <ol className="mb-10 grid gap-4 sm:grid-cols-3">
        {HOW.map(([title, body], i) => (
          <li key={title} className="border-t border-[var(--black)] pt-3">
            <div className="label mb-1">0{i + 1}</div>
            <div className="mb-1 text-sm font-semibold">{title}</div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
          </li>
        ))}
      </ol>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="label">Choose a mode</div>
        <div role="radiogroup" aria-label="Input" className="flex rounded-md border border-[var(--border)] p-0.5 text-sm">
          {(
            [
              ["camera", "Camera"],
              ["pointer", "Mouse / touch"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="radio"
              aria-checked={input === value}
              onClick={() => onInputChange(value)}
              className={`rounded px-3 py-1.5 transition-colors ${input === value ? "bg-[var(--black)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--black)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Choice
          title="Tutorial"
          tag="Start here"
          body={input === "camera" ? "Learn hold, up and down with the camera, one at a time. About a minute." : "The tutorial uses the camera. Switch to Camera to try it."}
          onClick={onTutorial}
          disabled={input !== "camera"}
        />
        <Choice title="Beginner" body="8 beats, one every 1.4 seconds. Each beat becomes a half note." onClick={() => onSelect(MODE_CONFIGS.beginner)} />
        <Choice title="Expert" body="64 beats at sixteenth-note speed, plus sideways movement to repeat a note. Full control over the rhythm." onClick={() => onSelect(MODE_CONFIGS.expert)} />
      </div>

      <p className="mt-6 text-xs text-[var(--gray-light)]">
        {input === "camera"
          ? "Uses your camera for hand tracking, which runs in your browser; video never leaves your device. Works best in good light."
          : "Move your mouse, or drag a finger, up and down over the capture area."}{" "}
        Turn your sound on for the metronome and playback.
      </p>
    </div>
  );
}

function Choice({ title, tag, body, onClick, disabled }: { title: string; tag?: string; body: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group w-full rounded-lg border border-[var(--border)] p-5 text-left transition-colors hover:border-[var(--black)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--border)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <span className="font-semibold">{title}</span>
            {tag && <span className="tag">{tag}</span>}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{body}</p>
        </div>
        <span className="text-[var(--text-secondary)] transition-colors group-hover:text-[var(--black)]">→</span>
      </div>
    </button>
  );
}
