import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PROJECTS, type Project } from "@/lib/projects";
import { SITE } from "@/lib/site";

/** What each project shows on the index, and a line saying what it is. */
const MEDIA: Record<string, { node: ReactNode; caption: string }> = {
  "melody-diffuser": {
    caption: "A melody generated from 64 gestures, playing back. Gestures run along the bottom.",
    node: (
      <video
        src="/melody-roll.mp4"
        poster="/melody-roll.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover object-left-top"
        aria-label="Melody Diffuser: a melody generated from hand gestures, shown as a piano roll"
      />
    ),
  },
  otto: {
    caption: "A hand against Otto, with each of the player's decisions rated against the solver.",
    node: (
      <Image
        src="/otto-table.webp"
        alt="Otto after a hand: the poker table and each of the player's decisions rated from Best to Blunder"
        fill
        sizes="(min-width: 1024px) 620px, 100vw"
        className="object-cover object-left-top"
      />
    ),
  },
};

export default function Home() {
  return (
    <div className="container pb-20">
      <header className="grid gap-10 pb-12 pt-14 sm:pb-16 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <div>
          <p className="label">{SITE.name}</p>
          <h1 className="mt-4">Projects</h1>
          <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed">
            Machine learning work by {SITE.author}. Each project has a live demo, its source code and a technical write-up.
          </p>
        </div>
        <nav aria-label="Project index" className="hidden lg:block">
          <ol className="border-t border-[var(--black)]">
            {PROJECTS.map((p) => (
              <li key={p.slug} className="border-b border-[var(--border)]">
                <a href={`#${p.slug}`} className="group flex items-baseline gap-3 py-3">
                  <span className="font-mono text-[12px]" style={{ color: p.accent }}>
                    {p.index}
                  </span>
                  <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{p.name}</span>
                  <span className="ml-auto text-[13px] text-[var(--gray-light)]">{p.kind}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <ol>
        {PROJECTS.map((p) => (
          <ProjectRow key={p.slug} p={p} media={MEDIA[p.slug]} />
        ))}
      </ol>

      <p className="label border-t border-[var(--border)] pt-8">More projects to come.</p>
    </div>
  );
}

function ProjectRow({ p, media }: { p: Project; media: { node: ReactNode; caption: string } }) {
  const home = p.tabs[0];
  const writeUp = p.tabs.find((t) => t.label === "Write-up");
  return (
    <li id={p.slug} className="grid scroll-mt-24 gap-8 border-t border-[var(--border)] py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      <figure>
        <Link href={home.href} className="group relative block aspect-[16/10] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]" aria-label={`Open ${p.name}`}>
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.015]">{media.node}</div>
          <span className="absolute bottom-3 left-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11.5px] text-[var(--black)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {home.label === "Play" ? "Play" : "Open demo"} →
          </span>
        </Link>
        <figcaption className="mt-3 text-[13px] leading-snug text-[var(--gray-light)]">{media.caption}</figcaption>
      </figure>

      <div className="flex flex-col">
        <p className="label flex gap-2">
          <span style={{ color: p.accent }}>{p.index}</span>
          <span>{p.kind}</span>
        </p>
        <h2 className="mt-3">
          <Link href={home.href} className="hover:underline hover:decoration-2 hover:underline-offset-4" style={{ textDecorationColor: p.accent }}>
            {p.name}
          </Link>
        </h2>
        <p className="mt-3 text-[16px] leading-relaxed">{p.summary}</p>

        <dl className="mt-6 grid grid-cols-3 gap-4">
          {p.facts.map((f) => (
            <div key={f.label}>
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-mono text-[20px] font-semibold leading-none tracking-tight text-[var(--black)]">{f.value}</dd>
              <dd className="mt-1.5 text-[12.5px] leading-snug text-[var(--gray-light)]">{f.label}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Built with">
          {p.stack.map((t) => (
            <li key={t} className="rounded-md border border-[var(--border)] px-2 py-0.5 font-mono text-[11.5px] text-[var(--gray)]">
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={home.href} className="btn btn-primary">
            {home.label === "Play" ? "Play" : "Open demo"}
          </Link>
          {writeUp && (
            <Link href={writeUp.href} className="link-arrow">
              Write-up →
            </Link>
          )}
          {p.links
            .filter((l) => l.label === "Code")
            .map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="link-arrow">
                Code ↗
              </a>
            ))}
        </div>
      </div>
    </li>
  );
}
