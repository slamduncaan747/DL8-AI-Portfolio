import * as Tone from "tone";

// Pitch vocabulary:
// 0-127: MIDI note numbers
// 128: NOTE_HOLD (sustain current note)
// 129: REST (silence)

const NOTE_HOLD = 128;
const REST = 129;

export interface MelodyNote {
  pitch: number;
  startTime: number;
  duration: number;
}

/**
 * Convert a sequence of pitch tokens into note events
 * Handles HOLD (128) and REST (129)
 */
export function parseMelodyTokens(tokens: number[], stepDuration: number = 0.2): MelodyNote[] {
  const notes: MelodyNote[] = [];
  let currentNote: MelodyNote | null = null;
  let currentTime = 0;

  for (const pitch of tokens) {
    if (pitch === REST) {
      // Rest - end current note
      if (currentNote) {
        notes.push(currentNote);
        currentNote = null;
      }
    } else if (pitch === NOTE_HOLD) {
      // Hold - extend current note duration
      if (currentNote) {
        currentNote.duration += stepDuration;
      }
      // Don't advance currentTime separately, it's done at the end
    } else if (pitch >= 0 && pitch <= 127) {
      // New note - push current and start new
      if (currentNote) {
        notes.push(currentNote);
      }
      currentNote = {
        pitch,
        startTime: currentTime,
        duration: stepDuration,
      };
    }
    currentTime += stepDuration;
  }

  if (currentNote) {
    notes.push(currentNote);
  }

  return notes;
}

/**
 * Convert MIDI note number to note name (e.g., "C4", "F#5")
 */
export function midiToNoteName(midi: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}

/**
 * Melody player with reliable Web Audio playback
 */
export class MelodyPlayer {
  private synth: Tone.PolySynth | null = null;
  private isPlaying = false;
  private onProgress?: (progress: number) => void;
  private stopRequested = false;
  private playbackId = 0;
  private animationFrameId: number | null = null;

  async initialize() {
    // Start audio context (required for browsers)
    await Tone.start();
    
    // Create a nice sounding synth
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.4,
      },
      volume: -6,
    }).toDestination();

    // Add subtle reverb
    const reverb = new Tone.Reverb({ 
      decay: 1.2, 
      wet: 0.2,
      preDelay: 0.01
    }).toDestination();
    
    this.synth.connect(reverb);
  }

  setOnProgress(callback: (progress: number) => void) {
    this.onProgress = callback;
  }

  async play(tokens: number[], stepDuration: number = 0.2) {
    if (!this.synth) {
      await this.initialize();
    }

    // Stop any existing playback
    this.stop();
    this.stopRequested = false;
    this.playbackId++;
    const currentPlaybackId = this.playbackId;

    const notes = parseMelodyTokens(tokens, stepDuration);
    const totalDuration = tokens.length * stepDuration;

    if (notes.length === 0) {
      console.warn("No playable notes in melody");
      if (this.onProgress) this.onProgress(1);
      return;
    }

    this.isPlaying = true;
    
    // Use Tone.now() for timing
    const startTime = Tone.now();
    
    // Schedule all notes
    for (const note of notes) {
      if (this.stopRequested) break;
      
      const noteName = midiToNoteName(note.pitch);
      const noteTime = startTime + note.startTime;
      
      // Schedule the note - use full duration for holds
      this.synth?.triggerAttackRelease(
        noteName,
        note.duration * 0.95, // Slight gap between repeated notes
        noteTime,
        0.8 // velocity
      );
    }

    // Progress tracking with requestAnimationFrame
    const updateProgress = () => {
      if (this.stopRequested || currentPlaybackId !== this.playbackId) {
        this.animationFrameId = null;
        return;
      }

      const elapsed = Tone.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (this.onProgress) {
        this.onProgress(progress);
      }

      if (progress < 1 && this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        this.isPlaying = false;
        this.animationFrameId = null;
        if (this.onProgress) {
          this.onProgress(1);
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(updateProgress);

    // Return a promise that resolves when playback ends
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (currentPlaybackId === this.playbackId) {
          this.isPlaying = false;
        }
        resolve();
      }, totalDuration * 1000 + 200);
    });
  }

  stop() {
    this.stopRequested = true;
    this.isPlaying = false;
    
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Immediately release all notes and stop transport
    if (this.synth) {
      this.synth.releaseAll();
    }
    
    // Reset progress
    if (this.onProgress) {
      this.onProgress(0);
    }
  }

  dispose() {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

/**
 * Analyze melody statistics
 */
export function analyzeMelody(tokens: number[]): {
  noteCount: number;
  restCount: number;
  holdCount: number;
  pitchRange: { min: number; max: number };
  averagePitch: number;
} {
  const pitches = tokens.filter((t) => t >= 0 && t <= 127);
  
  return {
    noteCount: pitches.length,
    restCount: tokens.filter((t) => t === REST).length,
    holdCount: tokens.filter((t) => t === NOTE_HOLD).length,
    pitchRange: {
      min: pitches.length > 0 ? Math.min(...pitches) : 0,
      max: pitches.length > 0 ? Math.max(...pitches) : 0,
    },
    averagePitch: pitches.length > 0 
      ? Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length)
      : 0,
  };
}

/** Seconds per sixteenth-note step during playback (75 BPM). */
export const STEP_SECONDS = 0.2;

/**
 * A standard MIDI file (format 0, one track) of the melody, at the same tempo
 * it plays at here.
 */
export function melodyToMidi(tokens: number[]): Uint8Array {
  const PPQ = 480;
  const tick = PPQ / 4; // one sixteenth
  const usPerQuarter = Math.round(STEP_SECONDS * 4 * 1e6);
  const notes = parseMelodyTokens(tokens, 1);

  const events: Array<{ t: number; bytes: number[] }> = [];
  for (const n of notes) {
    const on = Math.round(n.startTime * tick);
    const off = Math.round((n.startTime + n.duration) * tick) - 1;
    events.push({ t: on, bytes: [0x90, n.pitch, 90] }, { t: off, bytes: [0x80, n.pitch, 0] });
  }
  events.sort((a, b) => a.t - b.t || a.bytes[0] - b.bytes[0]);

  const vlq = (v: number) => {
    const out = [v & 0x7f];
    while ((v >>= 7)) out.unshift((v & 0x7f) | 0x80);
    return out;
  };
  const track: number[] = [
    0, 0xff, 0x51, 3, (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff, // tempo
    0, 0xff, 0x58, 4, 4, 2, 24, 8, // 4/4
  ];
  let last = 0;
  for (const e of events) {
    track.push(...vlq(e.t - last), ...e.bytes);
    last = e.t;
  }
  track.push(...vlq(Math.max(0, tokens.length * tick - last)), 0xff, 0x2f, 0); // end of track

  const u32 = (v: number) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
  return new Uint8Array([
    ...[0x4d, 0x54, 0x68, 0x64], ...u32(6), 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff, // MThd
    ...[0x4d, 0x54, 0x72, 0x6b], ...u32(track.length), ...track, // MTrk
  ]);
}
