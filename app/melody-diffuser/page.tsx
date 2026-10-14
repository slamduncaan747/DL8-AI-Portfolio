"use client";

import { useState } from "react";
import Link from "next/link";
import { ModeSelection } from "@/components/melody-diffuser/ModeSelection";
import { Tutorial } from "@/components/melody-diffuser/Tutorial";
import { GestureCapture } from "@/components/melody-diffuser/GestureCapture";
import { GenerationView } from "@/components/melody-diffuser/GenerationView";
import { ResultView } from "@/components/melody-diffuser/ResultView";
import { MODE_CONFIGS } from "@/lib/types";
import { MELODY } from "@/lib/site";
import type { ModeConfig, AppState, GenerationResult } from "@/lib/types";

export default function MelodyDiffuserPage() {
  const [appState, setAppState] = useState<AppState>("mode-selection");
  const [selectedMode, setSelectedMode] = useState<ModeConfig | null>(null);
  const [capturedGestures, setCapturedGestures] = useState<number[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handleModeSelect = (mode: ModeConfig) => {
    setSelectedMode(mode);
    setAppState("capturing");
  };

  const handleTutorialStart = () => {
    setAppState("tutorial");
  };

  const handleTutorialComplete = () => {
    setSelectedMode(MODE_CONFIGS.beginner);
    setAppState("capturing");
  };

  const handleTutorialSkip = () => {
    setAppState("mode-selection");
  };

  const handleGesturesCaptured = (gestures: number[]) => {
    setCapturedGestures(gestures);
    setAppState("generating");
  };

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationResult(result);
    setAppState("result");
  };

  const handleReset = () => {
    setAppState("mode-selection");
    setSelectedMode(null);
    setCapturedGestures([]);
    setGenerationResult(null);
  };

  const handleTryAgain = () => {
    setCapturedGestures([]);
    setGenerationResult(null);
    setAppState("capturing");
  };

  const showBackButton = appState !== "mode-selection" && appState !== "tutorial";

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col">
      {/* Project strip */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]/80">
        <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--blue)]">01 · Generative music</span>
            <span className="text-[14px] text-[var(--gray)]">Compose a melody with your finger.</span>
          </div>
          <div className="flex items-center gap-5 text-[13.5px] text-[var(--gray)]">
            <Link href="/research#melody-diffuser" className="hover:text-[var(--black)]">
              How it works
            </Link>
            <a href={MELODY.code} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">
              Code ↗
            </a>
            {showBackButton && (
              <button onClick={handleReset} className="font-semibold text-[var(--black)] hover:text-[var(--blue)]">
                Start over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center py-12">
        <div className="container">
          {appState === "mode-selection" && (
            <ModeSelection 
              onSelect={handleModeSelect} 
              onTutorial={handleTutorialStart}
            />
          )}

          {appState === "tutorial" && (
            <Tutorial
              onComplete={handleTutorialComplete}
              onSkip={handleTutorialSkip}
            />
          )}

          {appState === "capturing" && selectedMode && (
            <GestureCapture
              mode={selectedMode}
              onComplete={handleGesturesCaptured}
              onCancel={handleReset}
            />
          )}

          {appState === "generating" && selectedMode && (
            <GenerationView
              mode={selectedMode}
              gestures={capturedGestures}
              onComplete={handleGenerationComplete}
              onError={handleReset}
            />
          )}

          {appState === "result" && generationResult && selectedMode && (
            <ResultView
              result={generationResult}
              mode={selectedMode}
              gestures={capturedGestures}
              onReset={handleReset}
              onTryAgain={handleTryAgain}
            />
          )}
        </div>
      </main>
    </div>
  );
}
