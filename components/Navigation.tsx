"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROJECTS } from "@/lib/projects";

export function Navigation() {
  const path = usePathname();
  const links = [
    { href: "/", label: "Projects", exact: true },
    ...PROJECTS.map((p) => ({ href: `/${p.slug}`, label: p.name, dot: p.accent, exact: false })),
    { href: "/contact", label: "Contact", exact: true },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="container">
        <nav className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight" aria-label="DL8 AI home">
            <Mark />
            <span className="hidden text-[17px] min-[440px]:inline">DL8 AI</span>
          </Link>
          <div className="flex items-center gap-5 overflow-x-auto sm:gap-7">
            {links.map((l) => {
              const on = l.exact ? path === l.href : path === l.href || path.startsWith(`${l.href}/`);
              return (
                <Link key={l.href} href={l.href} className={`nav-link flex shrink-0 items-center gap-2 ${l.href === "/" ? "hidden sm:flex" : ""}`} aria-current={on ? "page" : undefined}>
                  {"dot" in l && l.dot && <span className="hidden h-1.5 w-1.5 rounded-full sm:inline-block" style={{ background: l.dot }} />}
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}

/** Two offset squares: one per project so far. */
function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" rx="3" fill="none" stroke="var(--blue)" strokeWidth="2" />
      <rect x="9.5" y="9.5" width="15" height="15" rx="3" fill="none" stroke="var(--orange)" strokeWidth="2" />
    </svg>
  );
}
