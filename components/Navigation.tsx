"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/melody-diffuser", label: "Melody Diffuser", dot: "var(--blue)" },
  { href: "/otto", label: "Otto", dot: "var(--orange)" },
  { href: "/research", label: "Research" },
  { href: "/contact", label: "Contact" },
];

export function Navigation() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="container">
        <nav className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight" aria-label="DL8 AI home">
            <Mark />
            <span className="text-[17px]">DL8 AI</span>
          </Link>
          <div className="flex items-center gap-5 overflow-x-auto sm:gap-8">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link flex shrink-0 items-center gap-2"
                aria-current={path === l.href || path.startsWith(`${l.href}/`) ? "page" : undefined}
              >
                {l.dot && <span className="hidden h-1.5 w-1.5 rounded-full sm:inline-block" style={{ background: l.dot }} />}
                <span className={l.dot ? "" : "hidden sm:inline"}>{l.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

/** Two offset squares: one for each project, overlapping in the middle. */
function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" rx="3" fill="none" stroke="var(--blue)" strokeWidth="2" />
      <rect x="9.5" y="9.5" width="15" height="15" rx="3" fill="none" stroke="var(--orange)" strokeWidth="2" />
    </svg>
  );
}
