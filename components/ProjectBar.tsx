import Link from "next/link";
import type { Project } from "@/lib/projects";

/**
 * The strip at the top of every project page: which project this is, its
 * sections as tabs, and outside links. Tabs are links by default; a page that
 * switches views itself (Otto) passes `onTab`.
 */
export function ProjectBar({ project: p, active, onTab }: { project: Project; active: string; onTab?: (id: string) => void }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg)]/95">
      <div className="container flex flex-wrap items-center gap-x-8 gap-y-1 pt-3 sm:h-14 sm:flex-nowrap sm:pt-0">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="font-mono text-[11px]" style={{ color: p.accent }}>
            {p.index}
          </span>
          <span className="font-bold">{p.name}</span>
          <span className="hidden truncate text-[14px] text-[var(--gray-light)] lg:inline">{p.tagline}</span>
        </div>
        <nav aria-label={`${p.name} sections`} className="-mx-1 flex w-full gap-1 overflow-x-auto sm:ml-auto sm:w-auto">
          {p.tabs.map((t) => {
            const on = t.id === active;
            const cls = `relative shrink-0 px-3 py-3 text-[14px] font-medium transition-colors sm:py-[18px] ${on ? "text-[var(--black)]" : "text-[var(--gray-light)] hover:text-[var(--black)]"}`;
            const bar = on && <span className="absolute inset-x-3 bottom-0 h-[2px]" style={{ background: p.accent }} />;
            return onTab ? (
              <button key={t.id} type="button" onClick={() => onTab(t.id)} aria-current={on ? "page" : undefined} className={cls}>
                {t.label}
                {bar}
              </button>
            ) : (
              <Link key={t.id} href={t.href} aria-current={on ? "page" : undefined} className={cls}>
                {t.label}
                {bar}
              </Link>
            );
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-5 text-[13.5px] sm:flex">
          {p.links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-[var(--gray)] hover:text-[var(--black)]">
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
