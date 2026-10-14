import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { MELODY, OTTO, SITE } from "@/lib/site";

const THREAD = [
  {
    title: "Built from scratch",
    melody: "Diffusion transformer, noise schedule and training loop written in PyTorch.",
    otto: "Game engine, equilibrium solver and reinforcement learning written in TypeScript.",
  },
  {
    title: "Measured, not just demoed",
    melody: "A written paper; validation on 100,000 held-out melodies.",
    otto: "30,000-hand duplicate matches with confidence intervals; tested on 40 unseen opponents.",
  },
  {
    title: "Made to be played",
    melody: "Your webcam tracks your finger in real time and the model writes the tune.",
    otto: "The whole AI runs in your browser and explains every adjustment it makes.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="container pb-12 pt-14 sm:pb-16 sm:pt-20">
        <p className="label">
          {SITE.name} · {SITE.author}
        </p>
        <h1 className="mt-4 max-w-[820px]">
          AI research you can <span style={{ color: "var(--blue)" }}>play</span> <span style={{ color: "var(--orange)" }}>with</span>.
        </h1>
        <p className="mt-5 max-w-[620px] text-[17.5px] leading-relaxed">
          I build machine-learning systems end to end — data, architecture, training and evaluation — and then turn them into something anyone can try in a browser. Two of them live here.
        </p>
      </section>

      <section className="container grid gap-6 pb-20 lg:grid-cols-2" aria-label="Projects">
        <ProjectCard
          index="01"
          field="Generative music"
          name="Melody Diffuser"
          pitch="Compose a melody by moving your finger. A diffusion transformer turns the shape of your gesture into music."
          accent="var(--blue)"
          media={<video src="/melody-demo.mp4" poster="/melody-poster.jpg" autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" aria-label="Melody Diffuser demo: a finger traces a melody in front of a webcam" />}
          stats={[
            { value: "32M", label: "parameter diffusion transformer" },
            { value: "10M+", label: "melodies in the training set" },
            { value: "64", label: "denoising steps, gesture-guided" },
          ]}
          stack={["PyTorch", "Discrete diffusion", "Cross-attention", "MediaPipe", "Replicate"]}
          primary={{ href: "/melody-diffuser", label: "Try the demo", className: "btn-melody" }}
          secondary={{ href: "/research#melody-diffuser", label: "Research" }}
          code={MELODY.code}
        />
        <ProjectCard
          index="02"
          field="Game AI"
          name="Otto"
          pitch="A poker AI that learns how you play. It starts unbeatable, reads your habits, then leans its strategy to exploit them."
          accent="var(--orange)"
          dark
          media={
            <Image
              src="/otto-table.png"
              alt="Otto's poker table after a hand, with each of the player's decisions marked Best, Good or Blunder"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[40%_30%]"
            />
          }
          stats={[
            { value: "+95", label: "big blinds per 100 hands gained by adapting" },
            { value: "39/40", label: "unseen opponents where adapting won more" },
            { value: "66M", label: "games of self-play" },
          ]}
          stack={["TypeScript", "Monte Carlo CFR", "Bayesian modelling", "PPO", "Web Workers"]}
          primary={{ href: "/otto", label: "Play Otto", className: "btn-otto" }}
          secondary={{ href: "/otto?view=how", label: "Write-up" }}
          code={OTTO.code}
        />
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/70">
        <div className="container py-16 sm:py-20">
          <p className="label">The common thread</p>
          <h2 className="mt-3 max-w-[640px]">Two very different problems, one way of working.</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {THREAD.map((t) => (
              <div key={t.title}>
                <h3>{t.title}</h3>
                <ul className="mt-4 flex flex-col gap-3 text-[14.5px] leading-relaxed text-[var(--gray)]">
                  <li className="flex gap-3">
                    <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[var(--blue)]" aria-label="Melody Diffuser" />
                    {t.melody}
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[var(--orange)]" aria-label="Otto" />
                    {t.otto}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid items-center gap-10 py-16 sm:py-20 md:grid-cols-[200px_1fr]">
        <Image src="/profile.jpeg" alt={SITE.author} width={200} height={200} className="h-[160px] w-[160px] rounded-2xl border border-[var(--border)] object-cover md:h-[200px] md:w-[200px]" />
        <div>
          <p className="label">About</p>
          <h2 className="mt-3">{SITE.author}</h2>
          <p className="mt-3 max-w-[620px] text-[16px] leading-relaxed">
            Independent AI researcher at East Lansing High School. I like problems where a model has to work with a person in real time — following a gesture, or adapting to an opponent — and I build every piece myself, from the training pipeline to the interface.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/contact" className="btn btn-primary">
              Get in touch
            </Link>
            <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
