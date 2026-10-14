import { MELODY, OTTO } from "./site";

export interface Project {
  slug: string;
  index: string;
  name: string;
  kind: string;
  /** one line, used in the project bar */
  tagline: string;
  /** two or three sentences, used on the index */
  summary: string;
  accent: string;
  facts: Array<{ value: string; label: string }>;
  stack: string[];
  tabs: Array<{ id: string; label: string; href: string }>;
  links: Array<{ label: string; href: string }>;
}

/** Every project on the site, in order. Adding one here adds it to the index and the nav. */
export const PROJECTS: Project[] = [
  {
    slug: "melody-diffuser",
    index: "01",
    name: "Melody Diffuser",
    kind: "Generative model",
    tagline: "Compose a melody with hand gestures.",
    summary:
      "A 32M-parameter discrete diffusion transformer that generates monophonic melodies, conditioned through cross-attention on gestures tracked from a webcam. Trained on more than 10 million four-measure excerpts.",
    accent: "var(--blue)",
    facts: [
      { value: "32M", label: "parameters, 6-layer transformer" },
      { value: "10M+", label: "training excerpts, 16th-note grid" },
      { value: "64", label: "diffusion steps, gesture-conditioned" },
    ],
    stack: ["PyTorch", "Discrete diffusion", "Cross-attention", "MediaPipe", "Next.js"],
    tabs: [
      { id: "demo", label: "Demo", href: "/melody-diffuser" },
      { id: "write-up", label: "Write-up", href: "/melody-diffuser/write-up" },
    ],
    links: [
      { label: "Code", href: MELODY.code },
      { label: "Paper", href: MELODY.paper },
      { label: "Weights", href: MELODY.weights },
    ],
  },
  {
    slug: "otto",
    index: "02",
    name: "Otto",
    kind: "Game AI",
    tagline: "A poker AI that learns how you play.",
    summary:
      "Heads-up no-limit hold'em against an AI that starts from an equilibrium strategy learned by self-play, models its opponent's habits as it plays, and uses a reinforcement-learned policy to exploit them. Runs entirely in the browser.",
    accent: "var(--orange)",
    facts: [
      { value: "+95", label: "bb/100 gained over the equilibrium strategy" },
      { value: "39/40", label: "unseen opponents where adapting won more" },
      { value: "66M", label: "self-play iterations (Monte Carlo CFR)" },
    ],
    stack: ["TypeScript", "Monte Carlo CFR", "Bayesian modelling", "PPO", "Web Workers"],
    tabs: [
      { id: "play", label: "Play", href: "/otto" },
      { id: "you", label: "Your style", href: "/otto?view=you" },
      { id: "arena", label: "Arena", href: "/otto?view=arena" },
      { id: "how", label: "Write-up", href: "/otto?view=how" },
    ],
    links: [{ label: "Code", href: OTTO.code }],
  },
];

export const project = (slug: string) => PROJECTS.find((p) => p.slug === slug)!;
