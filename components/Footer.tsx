import Link from "next/link";
import { MELODY, OTTO, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="container flex flex-col justify-between gap-6 py-8 text-sm sm:flex-row">
        <div>
          <div className="font-bold">DL8 AI</div>
          <p className="mt-1 text-[13.5px]">AI projects by {SITE.author}.</p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-4 text-[13.5px]">
          <div className="flex flex-col gap-1.5">
            <span className="label">Projects</span>
            <Link href="/melody-diffuser" className="hover:text-[var(--blue)]">Melody Diffuser</Link>
            <Link href="/otto" className="hover:text-[var(--orange)]">Otto</Link>
            <Link href="/research" className="hover:text-[var(--black)]">Research</Link>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="label">Code</span>
            <a href={MELODY.code} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--blue)]">Melody Diffuser ↗</a>
            <a href={OTTO.code} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--orange)]">Otto ↗</a>
            <a href={MELODY.weights} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">Model weights ↗</a>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="label">Contact</span>
            <a href={`mailto:${SITE.email}`} className="hover:text-[var(--black)]">Email</a>
            <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">GitHub ↗</a>
            <a href={SITE.x} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--black)]">X ↗</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
