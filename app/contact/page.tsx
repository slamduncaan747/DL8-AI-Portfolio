import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects";
import { MELODY, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const links = [
    { label: "GitHub", href: SITE.github, note: "slamduncaan747" },
    { label: "X", href: SITE.x, note: "@duncanlarz" },
    ...PROJECTS.flatMap((p) => p.links.filter((l) => l.label === "Code").map((l) => ({ label: `${p.name} source`, href: l.href, note: "GitHub" }))),
    { label: "Melody Diffuser weights", href: MELODY.weights, note: "Hugging Face" },
  ];
  return (
    <div className="container pb-24 pt-14 sm:pt-20">
      <div className="max-w-[620px]">
        <p className="label">Contact</p>
        <h1 className="mt-4">Contact</h1>
        <p className="mt-5 text-[17px] leading-relaxed">For questions about a project or anything else, email is the best way to reach me.</p>
        <a href={`mailto:${SITE.email}`} className="mt-8 inline-block text-[21px] font-bold underline decoration-[var(--border)] decoration-2 underline-offset-[6px] hover:decoration-[var(--black)]">
          {SITE.email}
        </a>

        <ul className="mt-12 border-t border-[var(--border)]">
          {links.map((l) => (
            <li key={l.label} className="border-b border-[var(--border)]">
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between py-4">
                <span className="font-semibold">{l.label}</span>
                <span className="flex items-center gap-3 text-[14px] text-[var(--gray-light)]">
                  {l.note}
                  <span className="transition group-hover:translate-x-0.5 group-hover:text-[var(--black)]">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
