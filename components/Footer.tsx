import Link from "next/link";
import { PROJECTS } from "@/lib/projects";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="container flex flex-col justify-between gap-6 py-8 text-[13.5px] sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="font-bold">DL8 AI</span>
          <span className="text-[var(--gray-light)]">{SITE.author}</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[var(--gray)]" aria-label="Footer">
          {PROJECTS.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className="hover:text-[var(--black)]">
              {p.name}
            </Link>
          ))}
          <a href={`mailto:${SITE.email}`} className="hover:text-[var(--black)]">
            Email
          </a>
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">
            GitHub ↗
          </a>
          <a href={SITE.x} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">
            X ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
