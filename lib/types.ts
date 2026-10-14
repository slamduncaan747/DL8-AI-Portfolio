export interface ModeConfig {
  name: "Tutorial" | "Beginner" | "Expert";
  seqLen: number;
  beatInterval: number;
  verticalHoldThresh: number;
  horizontalRepeatThresh: number;
  smallJumpPx: number;
  mediumJumpPx: number;
  largeJumpPx: number;
  showAllZones: boolean;
  countdownDuration: number;
  expandGestures: boolean;
  showTutorialHints: boolean;
  description: string;
}

export type AppState = "mode-selection" | "tutorial" | "capturing" | "generating" | "result";

export interface GenerationResult {
  melody: number[];
  midiData?: string; // base64 encoded MIDI
}

export const GESTURE_NAMES: Record<number, string> = {
  0: "HOLD",
  1: "REPEAT",
  2: "UP",
  3: "UP+",
  4: "UP++",
  5: "DOWN",
  6: "DOWN+",
  7: "DOWN++",
};

export const GESTURE_NAMES_SIMPLE: Record<number, string> = {
  0: "HOLD",
  1: "REPEAT",
  2: "UP",
  3: "UP",
  4: "UP",
  5: "DOWN",
  6: "DOWN",
  7: "DOWN",
};

export const GESTURE_COLORS: Record<number, string> = {
  0: "#64646E",   // HOLD - gray
  1: "#42A5F5",   // REPEAT - blue
  2: "#81C784",   // UP - light green
  3: "#4CAF50",   // UP+ - medium green
  4: "#2E7D32",   // UP++ - strong green
  5: "#EF9A9A",   // DOWN - light red
  6: "#E57373",   // DOWN+ - medium red
  7: "#C62828",   // DOWN++ - strong red
};

export const MODE_CONFIGS: Record<string, ModeConfig> = {
  tutorial: {
    name: "Tutorial",
    seqLen: 4,
    beatInterval: 2.5,
    verticalHoldThresh: 40,
    horizontalRepeatThresh: 100,
    smallJumpPx: 60,
    mediumJumpPx: 160,
    largeJumpPx: 300,
    showAllZones: false,
    countdownDuration: 6,
    expandGestures: true,
    showTutorialHints: true,
    description: "Learn the basics - 4 simple gestures",
  },
  beginner: {
    name: "Beginner",
    seqLen: 8,
    beatInterval: 1.4,
    verticalHoldThresh: 35,
    horizontalRepeatThresh: 120,
    smallJumpPx: 50,
    mediumJumpPx: 150,
    largeJumpPx: 280,
    showAllZones: false,
    countdownDuration: 5,
    expandGestures: true,
    showTutorialHints: false,
    description: "Slow & Easy - Perfect for first time!",
  },
  expert: {
    name: "Expert",
    seqLen: 64,
    beatInterval: 0.25,
    verticalHoldThresh: 20,
    horizontalRepeatThresh: 80,
    smallJumpPx: 35,
    mediumJumpPx: 100,
    largeJumpPx: 180,
    showAllZones: true,
    countdownDuration: 4,
    expandGestures: false,
    showTutorialHints: false,
    description: "64 gestures at 16th note tempo",
  },
};

