import type { Metadata } from "next";
import { MELODY, OTTO, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

const LINKS = [
  { label: "GitHub", href: SITE.github, note: "slamduncaan747" },
  { label: "X", href: SITE.x, note: "@duncanlarz" },
  { label: "Melody Diffuser code", href: MELODY.code, note: "PyTorch" },
  { label: "Otto code", href: OTTO.code, note: "TypeScript" },
  { label: "Model weights", href: MELODY.weights, note: "Hugging Face" },
];

export default function ContactPage() {
  return (
    <div className="container pb-24 pt-14 sm:pt-20">
      <div className="max-w-[620px]">
        <p className="label">Contact</p>
        <h1 className="mt-4">Get in touch.</h1>
        <p className="mt-5 text-[17px] leading-relaxed">
          Questions about the research, an internship or a collaboration, or just want to talk about AI — email is the fastest way to reach me.
        </p>
        <a href={`mailto:${SITE.email}`} className="mt-8 inline-block text-[22px] font-bold underline decoration-[var(--blue)] decoration-2 underline-offset-[6px] hover:decoration-[var(--orange)]">
          {SITE.email}
        </a>

        <ul className="mt-12 border-t border-[var(--border)]">
          {LINKS.map((l) => (
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
