"use client";

import { useCallback, useState } from "react";
import { ModeSelection } from "@/components/melody-diffuser/ModeSelection";
import { Tutorial } from "@/components/melody-diffuser/Tutorial";
import { GestureCapture, type InputSource } from "@/components/melody-diffuser/GestureCapture";
import { GenerationView } from "@/components/melody-diffuser/GenerationView";
import { ResultView } from "@/components/melody-diffuser/ResultView";
import { MODE_CONFIGS } from "@/lib/types";
import { expandGestures } from "@/lib/gestures";
import { ProjectBar } from "@/components/ProjectBar";
import { project } from "@/lib/projects";
import type { ModeConfig, AppState, GenerationResult } from "@/lib/types";

export default function MelodyDiffuserPage() {
  const [appState, setAppState] = useState<AppState>("mode-selection");
  const [selectedMode, setSelectedMode] = useState<ModeConfig | null>(null);
  const [input, setInput] = useState<InputSource>("camera");
  const [tokens, setTokens] = useState<number[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handleModeSelect = (mode: ModeConfig) => {
    setSelectedMode(mode);
    setAppState("capturing");
  };

  const handleTutorialComplete = () => {
    setSelectedMode(MODE_CONFIGS.beginner);
    setAppState("capturing");
  };

  const handleGesturesCaptured = useCallback(
    (gestures: number[]) => {
      if (!selectedMode) return;
      setTokens(expandGestures(gestures, selectedMode));
      setAppState("generating");
    },
    [selectedMode],
  );

  const handleGenerationComplete = useCallback((result: GenerationResult) => {
    setGenerationResult(result);
    setAppState("result");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("mode-selection");
    setSelectedMode(null);
    setTokens([]);
    setGenerationResult(null);
  }, []);

  const handleRetake = useCallback(() => {
    setTokens([]);
    setGenerationResult(null);
    setAppState("capturing");
  }, []);

  const switchToPointer = useCallback(() => setInput("pointer"), []);

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

      <div className="flex flex-1 items-center py-10 sm:py-12">
        <div className="container">
          {appState === "mode-selection" && (
            <ModeSelection input={input} onInputChange={setInput} onSelect={handleModeSelect} onTutorial={() => setAppState("tutorial")} />
          )}

          {appState === "tutorial" && <Tutorial onComplete={handleTutorialComplete} onSkip={handleReset} />}

          {appState === "capturing" && selectedMode && (
            <GestureCapture
              key={`${selectedMode.name}-${input}`}
              mode={selectedMode}
              input={input}
              onComplete={handleGesturesCaptured}
              onCancel={handleReset}
              onUsePointer={switchToPointer}
            />
          )}

          {appState === "generating" && tokens.length > 0 && (
            <GenerationView tokens={tokens} onComplete={handleGenerationComplete} onRetake={handleRetake} onBack={handleReset} />
          )}

          {appState === "result" && generationResult && (
            <ResultView result={generationResult} tokens={tokens} onReset={handleReset} onTryAgain={handleRetake} />
          )}
        </div>
      </div>
    </div>
  );
}
