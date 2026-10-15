import type { ModeConfig } from "./types";

/** The model always sees 64 gesture tokens: one per sixteenth note of a four-bar melody. */
export const STEPS = 64;

/** Plain-language name for each gesture token. */
export const GESTURE_LABEL: Record<number, string> = {
  0: "Hold",
  1: "Repeat",
  2: "Up",
  3: "Up more",
  4: "Up a lot",
  5: "Down",
  6: "Down more",
  7: "Down a lot",
};

export const GESTURE_SYMBOL: Record<number, string> = {
  0: "—",
  1: "↔",
  2: "↑",
  3: "⇡",
  4: "⇈",
  5: "↓",
  6: "⇣",
  7: "⇊",
};

/** Rough pitch movement of each gesture, used to draw the contour you made. */
const DELTA = [0, 0, 1, 2, 3, -1, -2, -3];

/**
 * Spread the captured gestures over the model's 64 steps. Slower modes place
 * each gesture at the start of an equal slice and hold for the rest of it.
 */
export function expandGestures(gestures: number[], mode: ModeConfig): number[] {
  let out: number[];
  if (!mode.expandGestures) {
    out = gestures.slice(0, STEPS);
  } else {
    const per = Math.max(1, Math.floor(STEPS / Math.max(1, gestures.length)));
    out = [];
    for (const g of gestures) {
      out.push(g);
      for (let i = 1; i < per; i++) out.push(0);
    }
  }
  while (out.length < STEPS) out.push(0);
  return out.slice(0, STEPS);
}

/** Running height of the gesture sequence: the shape you drew. */
export function contour(tokens: number[]): number[] {
  let h = 0;
  return tokens.map((t) => (h += DELTA[t] ?? 0));
}

/**
 * Classify a movement since the last beat. `dy` is in a 720-unit-tall frame
 * (negative = up), so thresholds behave the same for every camera and screen.
 */
export function classifyMovement(dy: number, dx: number, mode: ModeConfig): number {
  const { verticalHoldThresh, horizontalRepeatThresh, smallJumpPx, mediumJumpPx, largeJumpPx } = mode;
  if (mode.name === "Expert" && Math.abs(dx) >= horizontalRepeatThresh && Math.abs(dy) < smallJumpPx) return 1;
  const a = Math.abs(dy);
  if (a < verticalHoldThresh) return 0;
  const size = a >= largeJumpPx ? 2 : a >= mediumJumpPx ? 1 : 0;
  return dy < 0 ? 2 + size : 5 + size;
}
