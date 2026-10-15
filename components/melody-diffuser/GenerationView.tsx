"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationResult } from "@/lib/types";
import { Contour } from "./Contour";

interface GenerationViewProps {
  /** the 64 gesture tokens sent to the model */
  tokens: number[];
  onComplete: (result: GenerationResult) => void;
  onRetake: () => void;
  onBack: () => void;
}

type Status = "sending" | "starting" | "processing" | "failed";

const POLL_MS = 1500;
/** give up after this long (a cold start is usually a few minutes) */
const TIMEOUT_MS = 6 * 60 * 1000;

export function GenerationView({ tokens, onComplete, onRetake, onBack }: GenerationViewProps) {
  const [status, setStatus] = useState<Status>("sending");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const run = useRef(0);

  const generate = useCallback(async () => {
    const id = ++run.current;
    const alive = () => id === run.current;
    const started = Date.now();
    setStatus("sending");
    setError(null);
    setElapsed(0);
    const timer = setInterval(() => alive() && setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    const fail = (msg: string) => {
      if (!alive()) return;
      setError(msg);
      setStatus("failed");
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gestures: tokens, cfgScale: 2, temperature: 1, topP: 0.95, useCfg: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) return fail(data.error || "The model service could not be reached.");
      if (!alive()) return;
      setStatus(data.status === "processing" ? "processing" : "starting");

      let misses = 0;
      while (alive()) {
        if (Date.now() - started > TIMEOUT_MS) return fail("The model took too long to respond. It may still be starting up, so try again in a minute.");
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!alive()) return;
        let poll: { status?: string; melody?: number[]; error?: string };
        try {
          const r = await fetch(`/api/generate?id=${encodeURIComponent(data.id)}`, { cache: "no-store" });
          poll = await r.json();
          if (!r.ok) throw new Error(poll.error);
          misses = 0;
        } catch (e) {
          // ride out brief network blips
          if (++misses >= 4) return fail(e instanceof Error && e.message ? e.message : "Lost contact with the server.");
          continue;
        }
        if (!alive()) return;
        if (poll.status === "succeeded" && poll.melody?.length) return onComplete({ melody: poll.melody });
        if (poll.status === "failed") return fail(poll.error || "The model couldn't finish this melody.");
        setStatus(poll.status === "processing" ? "processing" : "starting");
      }
    } catch {
      fail("Couldn't reach the server. Check your connection and try again.");
    } finally {
      clearInterval(timer);
    }
  }, [tokens, onComplete]);

  useEffect(() => {
    generate();
    const r = run;
    return () => {
      r.current++; // stop polling when leaving this view
    };
  }, [generate]);

  const steps: Array<{ label: string; state: "done" | "active" | "todo" }> = [
    { label: "Send your gestures", state: status === "sending" ? "active" : "done" },
    { label: "Start the model", state: status === "sending" ? "todo" : status === "starting" ? "active" : "done" },
    { label: "Write the melody", state: status === "processing" ? "active" : "todo" },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-1 text-center text-xl font-semibold">{status === "failed" ? "Something went wrong" : "Writing your melody"}</h2>
      <p className="mb-8 text-center text-sm text-[var(--text-secondary)]">
        {status === "failed" ? error : "The model is writing a melody that follows the shape you drew."}
      </p>

      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="label mb-2">The shape you drew</div>
        <Contour tokens={tokens} />
      </div>

      {status !== "failed" ? (
        <>
          <ol className="mb-6 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                    s.state === "done" ? "border-[var(--blue)] bg-[var(--blue)] text-white" : s.state === "active" ? "border-[var(--blue)]" : "border-[var(--border)]"
                  }`}
                >
                  {s.state === "done" ? "✓" : s.state === "active" ? <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--blue)]" /> : null}
                </span>
                <span className={s.state === "todo" ? "text-[var(--gray-light)]" : ""}>{s.label}</span>
              </li>
            ))}
          </ol>
          {status === "starting" && elapsed >= 8 && (
            <p className="mb-6 rounded-md border border-[var(--border)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              The model runs on a GPU that sleeps when nobody is using it. Waking it can take a few minutes; after that, a melody takes
              seconds.
            </p>
          )}
          <div className="flex items-center justify-between font-mono text-xs text-[var(--gray-light)]">
            <span>{elapsed}s</span>
            <button onClick={onBack} className="hover:text-[var(--text-primary)]">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={generate} className="btn btn-melody">
            Try again
          </button>
          <button onClick={onRetake} className="btn btn-ghost">
            Record new gestures
          </button>
        </div>
      )}
    </div>
  );
}
