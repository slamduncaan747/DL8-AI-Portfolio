"use client";

import { useState } from "react";
import { ModeSelection } from "@/components/melody-diffuser/ModeSelection";
import { Tutorial } from "@/components/melody-diffuser/Tutorial";
import { GestureCapture } from "@/components/melody-diffuser/GestureCapture";
import { GenerationView } from "@/components/melody-diffuser/GenerationView";
import { ResultView } from "@/components/melody-diffuser/ResultView";
import { MODE_CONFIGS } from "@/lib/types";
import { ProjectBar } from "@/components/ProjectBar";
import { project } from "@/lib/projects";
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
      <ProjectBar project={project("melody-diffuser")} active="demo" />
      {showBackButton && (
        <div className="container flex justify-end pt-4">
          <button onClick={handleReset} className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--gray-light)] hover:text-[var(--black)]">
            Start over
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 items-center py-12">
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
      </div>
    </div>
  );
}
