# DL8 AI

The portfolio site at **[dl8ai.com](https://dl8ai.com)**: AI projects by Duncan Larzelere.

| Project | What it is | Code |
|---|---|---|
| **Melody Diffuser** | A gesture-conditioned discrete diffusion transformer for melody. The live demo is part of this site. | [slamduncaan747/Melody-Diffuser](https://github.com/slamduncaan747/Melody-Diffuser) |
| **Otto** | An adaptive poker AI: self-play CFR, a Bayesian opponent model and a PPO-trained exploitation layer, all in the browser. | [slamduncaan747/Poker-rl](https://github.com/slamduncaan747/Poker-rl) |

This repo is only the website. Each project's model code lives in its own repo.

## Pages

| Route | |
|---|---|
| `/` | Project index |
| `/melody-diffuser` | Melody Diffuser demo: webcam gesture capture → generation → piano-roll playback |
| `/melody-diffuser/write-up` | How Melody Diffuser works |
| `/otto` | Otto, with tabs for Play, Your style, Arena and Write-up (`?view=you`, `arena`, `how`) |
| `/contact` | Email and links |
| `/api/generate` | Server route that calls the Melody Diffuser model on Replicate |

Projects are listed in `lib/projects.ts`; adding an entry adds it to the index, the navigation and the footer, and gives its pages the shared project bar.

Otto is its own app, deployed from the Poker-rl repo. On `/otto` it runs in an iframe in its paper theme with its own navigation hidden (`?embed&theme=paper&nav=0`); the project bar's tabs switch its views over `postMessage`, and it reports view changes back so the tabs and URL stay in sync.

## Develop

```bash
npm install
cp env.example .env.local   # REPLICATE_API_TOKEN for the Melody Diffuser demo; NEXT_PUBLIC_OTTO_URL to use a local Otto
npm run dev                 # http://localhost:3000
```

## Deploy (Vercel)

1. Import this repo as a Vercel project (framework: Next.js, no build settings to change).
2. Add the environment variable `REPLICATE_API_TOKEN` (the same token the current dl8ai.com project uses).
3. Move the `dl8ai.com` and `www.dl8ai.com` domains from the old `dl-8-ai` project to this one.


## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion · MediaPipe Hands · Tone.js · Replicate
