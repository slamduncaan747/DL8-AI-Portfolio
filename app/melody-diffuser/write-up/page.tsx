import type { Metadata } from "next";
import Link from "next/link";
import { ProjectBar } from "@/components/ProjectBar";
import { Article, Facts, Sec, Table } from "@/components/WriteUp";
import { project } from "@/lib/projects";
import { MELODY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Melody Diffuser — Write-up",
  description: "How Melody Diffuser works: data, gesture labels, a gesture-conditioned diffusion transformer, and training.",
};

const GESTURES: Array<[string, string, string]> = [
  ["0", "Hold", "sustain the current note"],
  ["1", "Repeat", "same pitch again"],
  ["2 · 3 · 4", "Up", "small, medium or large step up"],
  ["5 · 6 · 7", "Down", "small, medium or large step down"],
];

export default function MelodyWriteUp() {
  const p = project("melody-diffuser");
  return (
    <>
      <ProjectBar project={p} active="write-up" />
      <Article
        title="Melody Diffuser"
        subtitle="A gesture-conditioned discrete diffusion transformer for symbolic melody."
        accent={p.accent}
      >
        <Facts
          accent={p.accent}
          items={[
            ["32.2M", "parameters"],
            ["10M+", "training excerpts"],
            ["64", "diffusion steps"],
            ["8", "gesture classes"],
          ]}
        />

        <Sec title="Problem">
          <p>
            Text-to-music systems produce convincing style and timbre but give little direct control over melodic contour and rhythm. Melody Diffuser makes the contour itself the input: the user traces the shape of a melody with a finger, and the model generates notes that follow it.
          </p>
        </Sec>

        <Sec title="Data">
          <p>
            The training set is over 10 million four-measure monophonic excerpts, quantised to sixteenth notes, so each melody is a sequence of 64 tokens. The vocabulary has 130 tokens: MIDI pitches 0–127, plus <code>128</code> to hold the previous note and <code>129</code> for a rest.
          </p>
          <p>
            No dataset pairs melodies with gestures, so the labels are derived from the music. The pitch movement at each step is mapped to one of eight gesture classes. At inference time the same classes are computed from fingertip movement tracked by MediaPipe, so the model is conditioned on the same kind of signal it was trained on.
          </p>
          <Table head={["Token", "Gesture", "Meaning"]} rows={GESTURES} />
        </Sec>

        <Sec title="Model">
          <p>
            A transformer predicts the clean melody from a noised one. Every block attends to the gesture sequence through cross-attention, so the condition shapes each layer rather than only the input.
          </p>
          <Table
            head={["Component", "Configuration"]}
            rows={[
              ["Width / depth / heads", "512 / 6 blocks / 8"],
              ["Block", "RMSNorm → self-attention → RMSNorm → cross-attention to gestures → RMSNorm → SwiGLU (inner 2048)"],
              ["Gesture input", "learned embedding plus learned position embedding"],
              ["Timestep", "sinusoidal encoding → two-layer MLP, added to every token"],
              ["Output", "logits over the 130-token vocabulary, tied to the input embedding"],
              ["Parameters", "32.2M"],
            ]}
          />
          <pre>{`# in every transformer block
cond = gesture_emb + gesture_pos_emb
attn, _ = self.cross_attn(h, cond, cond)
x = x + attn`}</pre>
        </Sec>

        <Sec title="Diffusion">
          <p>
            The forward process corrupts tokens by uniform replacement. Over T = 64 steps with a linear β schedule from 10⁻⁴ to 0.05, each token is replaced by a random token with probability 1 − ∏(1 − βₜ). The network is trained with cross-entropy to recover the original sequence at a random step. The gesture condition is dropped for 15% of training examples, which enables classifier-free guidance at generation time: a scale that trades off following the gesture against producing a natural melody.
          </p>
        </Sec>

        <Sec title="Training">
          <Table
            head={["Setting", "Value"]}
            rows={[
              ["Optimiser", "AdamW, learning rate 2·10⁻⁴, weight decay 0.01"],
              ["Schedule", "linear warm-up for 2 epochs, cosine decay"],
              ["Batch / epochs", "2,048 / 10"],
              ["Gradient clipping", "1.0"],
              ["Validation", "100,000 held-out excerpts, every 2,000 steps"],
              ["Hardware", "NVIDIA A100"],
            ]}
          />
        </Sec>

        <Sec title="Serving">
          <p>
            The demo captures gestures in the browser and sends the token sequence to the model, which runs on a cloud GPU (NVIDIA T4) through Replicate. The returned tokens are decoded to notes, drawn as a piano roll and played back in the browser with Tone.js.
          </p>
        </Sec>

        <Sec title="Next">
          <p>Polyphony: a variational autoencoder over four-part chorales, so diffusion can run in a latent space of harmony rather than a single line.</p>
        </Sec>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/melody-diffuser" className="btn btn-melody">
            Open the demo
          </Link>
          <a href={MELODY.paper} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Paper (PDF)
          </a>
          <a href={MELODY.code} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Code ↗
          </a>
          <a href={MELODY.weights} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Weights ↗
          </a>
        </div>
      </Article>
    </>
  );
}
