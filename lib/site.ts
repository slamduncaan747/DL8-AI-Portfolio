/** Links and facts shared across the site. */
export const SITE = {
  name: "DL8 AI",
  author: "Duncan Larzelere",
  email: "duncan.larzelere@gmail.com",
  github: "https://github.com/slamduncaan747",
  x: "https://x.com/duncanlarz",
};

export const MELODY = {
  code: "https://github.com/slamduncaan747/Melody-Diffuser",
  weights: "https://huggingface.co/DuncanLarz/Melody-Diffuser",
  paper: "/paper.pdf",
};

export const OTTO = {
  /** Otto runs as its own app (GitHub Pages) and is embedded here; override for local development. */
  app: process.env.NEXT_PUBLIC_OTTO_URL ?? "https://slamduncaan747.github.io/Poker-rl/",
  code: "https://github.com/slamduncaan747/Poker-rl",
};
