import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
  try {
    // 1. Check for API token
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      console.error("REPLICATE_API_TOKEN is not set");
      return NextResponse.json(
        { error: "Server configuration error: API token not configured." },
        { status: 500 }
      );
    }

    const replicate = new Replicate({ auth: apiToken });
    const body = await request.json();
    const { gestures, cfgScale = 2, temperature = 1, topP = 0.95, useCfg = true } = body;

    if (!gestures || !Array.isArray(gestures)) {
      return NextResponse.json({ error: "Invalid gestures array" }, { status: 400 });
    }

    const gesturesString = gestures.join(",");
    console.log("PHASE 1: Generating melody from gestures...");

    // ---------------------------------------------------------
    // PHASE 1: GENERATE THE MELODY (SOPRANO LINE)
    // ---------------------------------------------------------
    let melodyPrediction = await replicate.deployments.predictions.create(
      "slamduncaan747",
      "deployment-1",
      {
        input: {
          cfg_scale: cfgScale,
          gestures: gesturesString,
          temperature: temperature,
          top_p: topP,
          use_cfg: useCfg,
        },
      }
    );

    melodyPrediction = await replicate.wait(melodyPrediction);
    const rawMelodyOutput = melodyPrediction.output;

    let melody: number[] = [];
    if (typeof rawMelodyOutput === "string") {
      try {
        melody = JSON.parse(rawMelodyOutput);
      } catch {
        melody = rawMelodyOutput.split(",").map((n: string) => parseInt(n.trim(), 10));
      }
    } else if (Array.isArray(rawMelodyOutput)) {
      melody = rawMelodyOutput.map((n: any) => (typeof n === 'number' ? n : parseInt(n, 10) || 0));
    }

    if (!melody || melody.length === 0) {
      return NextResponse.json({ error: "Empty melody returned" }, { status: 500 });
    }

    console.log("Melody generated:", melody.slice(0, 10), "...");

    return NextResponse.json({ melody });

  } catch (error) {
    console.error("Pipeline error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Standard error handling...
    if (errorMessage.includes("401")) return NextResponse.json({ error: "API authentication failed." }, { status: 401 });
    if (errorMessage.includes("404")) return NextResponse.json({ error: "Deployment not found." }, { status: 404 });
    if (errorMessage.includes("429")) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

    return NextResponse.json({ error: `Generation failed: ${errorMessage}` }, { status: 500 });
  }
}