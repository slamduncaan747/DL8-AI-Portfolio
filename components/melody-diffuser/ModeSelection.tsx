"use client";

import { MODE_CONFIGS, type ModeConfig } from "@/lib/types";

interface ModeSelectionProps {
  onSelect: (mode: ModeConfig) => void;
  onTutorial: () => void;
}

export function ModeSelection({ onSelect, onTutorial }: ModeSelectionProps) {
  return (
    <div className="max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-3">Choose your approach</h2>
      <p className="text-[var(--text-secondary)] mb-10">
        Control AI-generated melodies through hand gestures.
      </p>

      <div className="space-y-3">
        {/* Tutorial */}
        <button
          onClick={onTutorial}
          className="w-full text-left p-5 rounded-lg border border-[var(--border)] hover:border-[var(--text-primary)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold">Tutorial</span>
                <span className="tag">Start here</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Learn the three core gestures—takes 60 seconds
              </p>
            </div>
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              →
            </span>
          </div>
        </button>

        {/* Beginner */}
        <button
          onClick={() => onSelect(MODE_CONFIGS.beginner)}
          className="w-full text-left p-5 rounded-lg border border-[var(--border)] hover:border-[var(--text-primary)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold mb-1">Beginner</div>
              <p className="text-sm text-[var(--text-secondary)]">
                8 gestures, forgiving timing—ideal for your first melody
              </p>
            </div>
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              →
            </span>
          </div>
        </button>

        {/* Expert */}
        <button
          onClick={() => onSelect(MODE_CONFIGS.expert)}
          className="w-full text-left p-5 rounded-lg border border-[var(--border)] hover:border-[var(--text-primary)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold mb-1">Expert</div>
              <p className="text-sm text-[var(--text-secondary)]">
                64 gestures at 16th note tempo—precise control
              </p>
            </div>
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              →
            </span>
          </div>
        </button>
      </div>

      <p className="mt-8 text-xs text-[var(--text-secondary)]">
        Requires camera access · Works best in good lighting
      </p>
    </div>
  );
}
