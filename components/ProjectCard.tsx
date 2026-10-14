import Link from "next/link";
import type { ReactNode } from "react";

export interface ProjectCardProps {
  index: string;
  field: string;
  name: string;
  pitch: string;
  accent: string;
  media: ReactNode;
  dark?: boolean;
  stats: Array<{ value: string; label: string }>;
  stack: string[];
  primary: { href: string; label: string; className: string };
  secondary: { href: string; label: string };
  code: string;
}

/** One project on the home page: media, a one-line pitch, three numbers, and where to go next. */
export function ProjectCard(p: ProjectCardProps) {
  return (
    <article className="card flex flex-col overflow-hidden" style={{ borderTop: `3px solid ${p.accent}` }}>
      <div className={`relative aspect-[16/10] overflow-hidden ${p.dark ? "bg-[var(--otto-ink)]" : "bg-black"}`}>{p.media}</div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="label flex items-center gap-2">
          <span style={{ color: p.accent }}>{p.index}</span>
          <span>·</span>
          <span>{p.field}</span>
        </div>
        <h2 className="mt-3">{p.name}</h2>
        <p className="mt-2 text-[16px] leading-relaxed">{p.pitch}</p>

        <dl className="mt-6 grid grid-cols-3 border-y border-[var(--border)]">
          {p.stats.map((s, i) => (
            <div key={s.label} className={`py-4 ${i ? "border-l border-[var(--border)] pl-4" : "pr-4"}`}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-mono text-[22px] font-semibold leading-none tracking-tight" style={{ color: i === 0 ? p.accent : undefined }}>
                {s.value}
              </dd>
              <dd className="mt-2 text-[12.5px] leading-snug text-[var(--gray-light)]">{s.label}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Built with">
          {p.stack.map((t) => (
            <li key={t} className="rounded-md border border-[var(--border)] px-2 py-0.5 font-mono text-[11.5px] text-[var(--gray)]">
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
          <Link href={p.primary.href} className={`btn ${p.primary.className}`}>
            {p.primary.label}
          </Link>
          <Link href={p.secondary.href} className="btn btn-ghost">
            {p.secondary.label}
          </Link>
          <a href={p.code} target="_blank" rel="noopener noreferrer" className="link-arrow ml-auto text-[14px]">
            Code ↗
          </a>
        </div>
      </div>
    </article>
  );
}
