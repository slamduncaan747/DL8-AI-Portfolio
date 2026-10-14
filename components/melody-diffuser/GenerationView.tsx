"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModeConfig, GenerationResult } from "@/lib/types";
import { GESTURE_COLORS } from "@/lib/types";

interface GenerationViewProps {
  mode: ModeConfig;
  gestures: number[];
  onComplete: (result: GenerationResult) => void;
  onError: () => void;
}

export function GenerationView({ mode, gestures, onComplete, onError }: GenerationViewProps) {
  const [status, setStatus] = useState("Preparing input...");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [showColdStartNotice, setShowColdStartNotice] = useState(false);
  const hasStarted = useRef(false);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startTime.current = Date.now();

    const generate = async () => {
      // Expand gestures to 64 tokens
      let exp: number[];
      if (!mode.expandGestures) {
        exp = gestures.slice(0, 64);
      } else {
        const per = Math.floor(64 / gestures.length);
        exp = [];
        for (const g of gestures) {
          exp.push(g);
          for (let i = 0; i < per - 1; i++) exp.push(0);
        }
      }
      while (exp.length < 64) exp.push(0);
      exp = exp.slice(0, 64);
      setExpanded(exp);

      await new Promise(r => setTimeout(r, 600));
      setStatus("Calling AI model...");

      // Show cold start notice after 20 seconds
      const coldStartTimer = setTimeout(() => {
        setShowColdStartNotice(true);
      }, 20000);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gestures: exp,
            cfgScale: 2,
            temperature: 1,
            topP: 0.95,
            useCfg: true,
          }),
        });

        clearTimeout(coldStartTimer);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Generation failed");
        }

        const data = await res.json();
        const elapsed = Math.round((Date.now() - startTime.current) / 1000);
        console.log(`Generation completed in ${elapsed}s`);
        
        setStatus("Complete!");
        await new Promise(r => setTimeout(r, 400));
        onComplete({ melody: data.melody });
      } catch (e) {
        clearTimeout(coldStartTimer);
        setError(e instanceof Error ? e.message : "Failed to generate melody");
      }
    };

    generate();
  }, [gestures, mode, onComplete]);

  if (error) {
    const isConfig = error.includes("API token") || error.includes("REPLICATE");
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <h2 className="text-xl font-semibold mb-3">
          {isConfig ? "Configuration required" : "Generation failed"}
        </h2>
        <p className="text-[var(--text-secondary)] mb-6 text-sm">{error}</p>
        {isConfig && (
          <div className="bg-[var(--bg-canvas)] rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-[var(--text-secondary)] mb-2">To use this demo:</p>
            <ol className="text-xs text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
              <li>Get your API token from replicate.com/account/api-tokens</li>
              <li>Create <code className="bg-[var(--bg-surface)] px-1 rounded">.env.local</code></li>
              <li>Add <code className="bg-[var(--bg-surface)] px-1 rounded">REPLICATE_API_TOKEN=your_token</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}
        <button onClick={onError} className="btn btn-primary">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <h2 className="text-xl font-semibold mb-2">{status}</h2>
      <p className="text-[var(--text-secondary)] mb-8 text-sm">
        The AI is processing your gestures into music
      </p>

      {/* Cold start notice */}
      <AnimatePresence>
        {showColdStartNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⏱️</span>
              <div>
                <div className="font-semibold text-sm text-blue-900 mb-1">
                  Waking up the GPU
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  This first generation may take up to 5 minutes while the system initializes. 
                  After this, subsequent generations will complete in 10–20 seconds.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading animation */}
      <div className="flex justify-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]"
            animate={{ 
              y: [0, -12, 0],
              opacity: [0.3, 1, 0.3] 
            }}
            transition={{ 
              duration: 0.9, 
              repeat: Infinity, 
              delay: i * 0.15 
            }}
          />
        ))}
      </div>

      {/* Input preview */}
      {expanded.length > 0 && (
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-2 font-mono">
            Your gestures ({expanded.length} tokens)
          </div>
          <div className="flex justify-center gap-px flex-wrap max-w-sm mx-auto">
            {expanded.map((g, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: GESTURE_COLORS[g] }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
