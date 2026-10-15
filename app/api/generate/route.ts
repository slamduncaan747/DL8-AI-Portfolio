import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

/**
 * Melody generation runs on a Replicate deployment. A cold start can take a
 * few minutes, longer than a serverless function should wait, so generation is
 * split in two:
 *
 *   POST /api/generate         starts a prediction and returns its id
 *   GET  /api/generate?id=...  reports its status, and the melody once done
 */

const OWNER = "slamduncaan747";
const DEPLOYMENT = "deployment-1";
const SEQ_LEN = 64;

function client() {
  const auth = process.env.REPLICATE_API_TOKEN;
  return auth ? new Replicate({ auth }) : null;
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Melody generation error:", message);
  if (message.includes("401")) return NextResponse.json({ error: "The model service rejected the request." }, { status: 502 });
  if (message.includes("404")) return NextResponse.json({ error: "The model deployment could not be found." }, { status: 502 });
  if (message.includes("429")) return NextResponse.json({ error: "Too many requests right now. Wait a moment and try again." }, { status: 429 });
  return NextResponse.json({ error: "The model service could not be reached." }, { status: 502 });
}

/** The deployment returns the melody as a JSON string, a comma list or an array. */
function parseMelody(output: unknown): number[] {
  let values: unknown[] = [];
  if (Array.isArray(output)) values = output;
  else if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      values = Array.isArray(parsed) ? parsed : [];
    } catch {
      values = output.split(",");
    }
  }
  return values
    .map((v) => (typeof v === "number" ? v : parseInt(String(v).trim(), 10)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 129);
}

export async function POST(request: NextRequest) {
  const replicate = client();
  if (!replicate) {
    console.error("REPLICATE_API_TOKEN is not set");
    return NextResponse.json({ error: "The demo isn't configured on this server." }, { status: 503 });
  }

  let body: { gestures?: unknown; cfgScale?: number; temperature?: number; topP?: number; useCfg?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { gestures, cfgScale = 2, temperature = 1, topP = 0.95, useCfg = true } = body;
  if (
    !Array.isArray(gestures) ||
    gestures.length !== SEQ_LEN ||
    !gestures.every((g) => Number.isInteger(g) && g >= 0 && g <= 7)
  ) {
    return NextResponse.json({ error: `Expected ${SEQ_LEN} gesture tokens between 0 and 7.` }, { status: 400 });
  }

  try {
    const prediction = await replicate.deployments.predictions.create(OWNER, DEPLOYMENT, {
      input: {
        gestures: gestures.join(","),
        cfg_scale: cfgScale,
        temperature,
        top_p: topP,
        use_cfg: useCfg,
      },
    });
    return NextResponse.json({ id: prediction.id, status: prediction.status });
  } catch (error) {
    return failure(error);
  }
}

export async function GET(request: NextRequest) {
  const replicate = client();
  if (!replicate) return NextResponse.json({ error: "The demo isn't configured on this server." }, { status: 503 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[a-z0-9]+$/i.test(id)) return NextResponse.json({ error: "Missing prediction id." }, { status: 400 });

  try {
    const prediction = await replicate.predictions.get(id);
    if (prediction.status === "succeeded") {
      const melody = parseMelody(prediction.output);
      if (melody.length === 0) return NextResponse.json({ status: "failed", error: "The model returned an empty melody." });
      return NextResponse.json({ status: "succeeded", melody });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      console.error("Prediction failed:", prediction.error);
      return NextResponse.json({ status: "failed", error: "The model couldn't finish this melody." });
    }
    // "starting" (cold start) or "processing"
    return NextResponse.json({ status: prediction.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}
