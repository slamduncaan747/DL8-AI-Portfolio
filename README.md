# DL8 AI

The portfolio site at **[dl8ai.com](https://dl8ai.com)**: AI projects by Duncan Larzelere.

| Project | What it is | Code |
|---|---|---|
| **Melody Diffuser** | A gesture-conditioned discrete diffusion transformer: move your finger in front of a webcam and it writes a melody. The live demo is part of this site. | [slamduncaan747/Melody-Diffuser](https://github.com/slamduncaan747/Melody-Diffuser) |
| **Otto** | A poker AI that learns how you play: self-play CFR, a Bayesian opponent model and a PPO-trained exploitation layer, all in the browser. Embedded on `/otto`. | [slamduncaan747/Poker-rl](https://github.com/slamduncaan747/Poker-rl) |

This repo is only the website. Each project's model code lives in its own repo.

## Pages

| Route | |
|---|---|
| `/` | Both projects side by side, what they have in common, about |
| `/melody-diffuser` | The Melody Diffuser demo (webcam gesture capture → generation → playback and MIDI download) |
| `/otto` | Otto, embedded full-height from its own deployment. `?view=you`, `?view=arena` or `?view=how` opens a specific part |
| `/research` | Short write-ups and key numbers for both projects |
| `/contact` | Email and links |
| `/api/generate` | Server route that calls the Melody Diffuser model on Replicate |

## Develop

```bash
npm install
cp env.example .env.local   # add REPLICATE_API_TOKEN for the Melody Diffuser demo
npm run dev                 # http://localhost:3000
```

## Deploy (Vercel)

1. Import this repo as a Vercel project (framework: Next.js, no build settings to change).
2. Add the environment variable `REPLICATE_API_TOKEN` (the same token the current dl8ai.com project uses).
3. Move the `dl8ai.com` and `www.dl8ai.com` domains from the old `dl-8-ai` project to this one.

Otto is deployed separately (GitHub Pages, from the Poker-rl repo) and loaded in an iframe; set its URL in `lib/site.ts`.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion · MediaPipe Hands · Tone.js · Replicate
