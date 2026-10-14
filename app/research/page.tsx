import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MELODY, OTTO, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Research",
  description: "Write-ups for Melody Diffuser, a gesture-conditioned diffusion transformer for melodies, and Otto, a poker AI that learns to exploit its opponent.",
};

export default function ResearchPage() {
  return (
    <div className="container pb-20 pt-14 sm:pt-20">
      <p className="label">Research</p>
      <h1 className="mt-4 max-w-[760px]">How the projects work, and how well.</h1>
      <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed">
        Each project has a full write-up. Here is the short version of both: the problem, the method, and the numbers.
      </p>
      <nav className="mt-8 flex flex-wrap gap-3" aria-label="Jump to">
        <a href="#melody-diffuser" className="btn btn-ghost">
          <span className="h-2 w-2 rounded-full bg-[var(--blue)]" /> Melody Diffuser
        </a>
        <a href="#otto" className="btn btn-ghost">
          <span className="h-2 w-2 rounded-full bg-[var(--orange)]" /> Otto
        </a>
      </nav>

      <Article id="melody-diffuser" accent="var(--blue)" index="01 · Generative music" title="Melody Diffuser" lead="A 32M-parameter discrete diffusion transformer for symbolic melodies, conditioned on real-time hand gestures through cross-attention.">
        <Facts
          items={[
            ["32M", "parameters"],
            ["10M+", "training melodies"],
            ["64", "diffusion steps"],
            ["8", "gesture tokens"],
          ]}
          accent="var(--blue)"
        />
        <Cols>
          <div>
            <Sub title="The problem">
              Text-to-music models generate convincing style and timbre, but offer little control over melodic and rhythmic structure. Melody Diffuser treats gesture as a first-class conditioning signal instead.
            </Sub>
            <Sub title="Dataset">
              No gesture-labelled music dataset existed, so the labels are made automatically. Pitch intervals across <b>10M+ symbolic melodies</b> — four-measure excerpts quantised to the sixteenth note — are converted into 8 discrete gesture tokens: small, medium and large moves up and down, hold, and repeat.
            </Sub>
            <Sub title="Inference">
              In the browser, MediaPipe tracks your index finger from the webcam and turns its movement into the same gesture tokens. Those tokens condition the diffusion process, which runs on a cloud GPU (NVIDIA T4).
            </Sub>
          </div>
          <div>
            <Sub title="Model">
              Tokens are corrupted over a 64-step schedule and reconstructed step by step. Each of the 6 transformer blocks (512 wide, 8 heads) attends to the gesture embeddings through cross-attention, with RMSNorm and SwiGLU for stable training. Dropping the gesture 15% of the time during training enables classifier-free guidance at generation time.
            </Sub>
            <Sub title="Conditioning">
              <pre className="mt-1">{`# in every transformer block
cond = gesture_emb + gesture_pos_emb
attn, _ = self.cross_attn(h, cond, cond)
x = x + attn`}</pre>
            </Sub>
            <Sub title="Training">
              AdamW at 2·10⁻⁴ with warm-up and cosine decay, batch size 2,048, on an NVIDIA A100. Validation on 100,000 held-out melodies.
            </Sub>
          </div>
        </Cols>
        <Actions>
          <a href={MELODY.paper} target="_blank" rel="noopener noreferrer" className="btn btn-melody">
            Read the paper
          </a>
          <Link href="/melody-diffuser" className="btn btn-ghost">
            Try the demo
          </Link>
          <a href={MELODY.code} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Code ↗
          </a>
          <a href={MELODY.weights} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Model weights ↗
          </a>
        </Actions>
      </Article>

      <Article id="otto" accent="var(--orange)" index="02 · Game AI" title="Otto" lead="A heads-up no-limit hold'em AI that starts from unexploitable play, builds a statistical read on its opponent, and leans its strategy to exploit them — without becoming exploitable itself.">
        <Facts
          items={[
            ["+95", "bb/100 gained by adapting"],
            ["39/40", "unseen opponents beaten by more"],
            ["86%", "player types identified in 20 hands"],
            ["r = 0.89", "stress test vs. actual"],
          ]}
          accent="var(--orange)"
        />
        <Cols>
          <div>
            <Sub title="Balanced play by self-play">
              A Monte Carlo CFR solver (linear weighting, regret pruning) played <b>66M</b> games against itself over 70 minutes on 3 CPU threads, cutting average regret by 94%. Hands and bets are abstracted into 169 starting-hand classes, 32 strength buckets per street and four bet sizes — 39,795 decision points in all.
            </Sub>
            <Sub title="Reading the opponent">
              Sixteen habits — how often you fold to a bet, bluff the river, and so on — are tracked as Beta–Bernoulli estimates that start at balanced play and move toward what you actually do. Otto names the right player type 86% of the time after 20 hands and 100% after 160.
            </Sub>
          </div>
          <div>
            <Sub title="Learning to exploit">
              A 6,788-parameter policy network, trained with PPO over 4.65M hands against randomised opponents, tilts the balanced strategy toward the plays that punish the habits it has seen. The tilt is bounded, so with no evidence Otto is exactly the balanced strategy.
            </Sub>
            <Sub title="Results">
              In 30,000-hand duplicate matches Otto beats the balanced strategy against all seven player types (+95 bb/100 on average) and breaks even against a balanced opponent (+2 ± 13). On 40 opponents it never trained on, it won more in 39. A clone fitted from 150 hands predicts how exploitable a player is with r = 0.89.
            </Sub>
          </div>
        </Cols>
        <Actions>
          <Link href="/otto?view=how" className="btn btn-otto">
            Read the full write-up
          </Link>
          <Link href="/otto" className="btn btn-ghost">
            Play Otto
          </Link>
          <a href={OTTO.code} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Code ↗
          </a>
        </Actions>
      </Article>

      <p className="mt-16 max-w-[620px] text-[14px] text-[var(--gray-light)]">
        Independent research by {SITE.author} (East Lansing High School), without institutional supervision. Questions or collaboration:{" "}
        <a href={`mailto:${SITE.email}`} className="text-[var(--black)] underline decoration-[var(--border)] underline-offset-4">
          {SITE.email}
        </a>
      </p>
    </div>
  );
}

function Article({ id, accent, index, title, lead, children }: { id: string; accent: string; index: string; title: string; lead: string; children: ReactNode }) {
  return (
    <article id={id} className="mt-16 scroll-mt-24 border-t border-[var(--border)] pt-12">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <div>
          <p className="label" style={{ color: accent }}>
            {index}
          </p>
          <h2 className="mt-3">{title}</h2>
        </div>
        <div>
          <p className="max-w-[720px] text-[18px] font-medium leading-relaxed text-[var(--black)]">{lead}</p>
          {children}
        </div>
      </div>
    </article>
  );
}

function Facts({ items, accent }: { items: Array<[string, string]>; accent: string }) {
  return (
    <dl className="mt-8 grid grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4">
      {items.map(([v, l], i) => (
        <div key={l} className={`border-[var(--border)] py-5 ${i % 2 ? "border-l pl-5" : "pr-5"} sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0`}>
          <dt className="sr-only">{l}</dt>
          <dd className="font-mono text-[24px] font-semibold leading-none tracking-tight" style={{ color: i === 0 ? accent : undefined }}>
            {v}
          </dd>
          <dd className="mt-2 text-[13px] leading-snug text-[var(--gray-light)]">{l}</dd>
        </div>
      ))}
    </dl>
  );
}

function Cols({ children }: { children: ReactNode }) {
  return <div className="mt-10 grid gap-x-14 gap-y-2 md:grid-cols-2">{children}</div>;
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3>{title}</h3>
      <div className="mt-2 text-[15px] leading-relaxed text-[var(--gray)] [&_b]:text-[var(--black)]">{children}</div>
    </div>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}
