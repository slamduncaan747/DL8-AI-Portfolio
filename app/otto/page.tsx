import type { Metadata } from "next";
import Link from "next/link";
import { OTTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Otto",
  description: "Play heads-up poker against Otto, an AI that learns how you play and exploits your habits.",
};

const VIEWS: Record<string, { hash: string; label: string }> = {
  play: { hash: "play", label: "Play" },
  you: { hash: "you", label: "Your style" },
  arena: { hash: "arena", label: "Arena" },
  how: { hash: "how", label: "Write-up" },
};

/**
 * Otto is its own app (deployed from the Poker-rl repo) and lives here in a
 * full-height frame. `?view=` picks which part opens first.
 */
export default async function OttoPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const v = VIEWS[view ?? ""] ?? VIEWS.play;
  return (
    <div className="bg-[var(--otto-ink)]">
      <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-[#e6e3dc]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--orange)]">02 · Game AI</span>
          <span className="text-[14px] text-[#9a9ea5]">A poker AI that learns how you play.</span>
        </div>
        <div className="flex items-center gap-5 text-[13.5px]">
          <Link href="/research#otto" className="text-[#9a9ea5] hover:text-white">
            Results
          </Link>
          <a href={OTTO.code} target="_blank" rel="noopener noreferrer" className="text-[#9a9ea5] hover:text-white">
            Code ↗
          </a>
          <a href={`${OTTO.app}#${v.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#9a9ea5] hover:text-white">
            Full screen ↗
          </a>
        </div>
      </div>
      <iframe
        key={v.hash}
        src={`${OTTO.app}?embed#${v.hash}`}
        title={`Otto — ${v.label}`}
        className="block w-full border-0 border-t border-[var(--otto-line)]"
        style={{ height: "calc(100dvh - 64px - 45px)", minHeight: 620 }}
        allow="fullscreen"
      />
    </div>
  );
}
