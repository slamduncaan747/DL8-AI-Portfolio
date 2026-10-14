import * as Tone from "tone";

// Pitch vocabulary:
// 0-127: MIDI note numbers
// 128: NOTE_HOLD (sustain current note)
// 129: REST (silence)

const NOTE_HOLD = 128;
const REST = 129;
const REPEAT = 1; // Repeat gesture - repeats previous note

export interface MelodyNote {
  pitch: number;
  startTime: number;
  duration: number;
}

/**
 * Convert a sequence of pitch tokens into note events
 * Handles HOLD (128), REST (129), and REPEAT (1) gestures
 */
export function parseMelodyTokens(tokens: number[], stepDuration: number = 0.2): MelodyNote[] {
  const notes: MelodyNote[] = [];
  let currentNote: MelodyNote | null = null;
  let lastPitch: number | null = null; // Track last actual pitch for REPEAT
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
    } else if (pitch === REPEAT) {
      // Repeat - start a new note with the same pitch as last
      if (currentNote) {
        notes.push(currentNote);
      }
      if (lastPitch !== null) {
        currentNote = {
          pitch: lastPitch,
          startTime: currentTime,
          duration: stepDuration,
        };
      } else {
        currentNote = null; // Can't repeat if no previous note
      }
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
      lastPitch = pitch; // Remember this pitch for REPEAT
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
  repeatCount: number;
  pitchRange: { min: number; max: number };
  averagePitch: number;
} {
  const pitches = tokens.filter((t) => t >= 0 && t <= 127);
  
  return {
    noteCount: pitches.length,
    restCount: tokens.filter((t) => t === REST).length,
    holdCount: tokens.filter((t) => t === NOTE_HOLD).length,
    repeatCount: tokens.filter((t) => t === REPEAT).length,
    pitchRange: {
      min: pitches.length > 0 ? Math.min(...pitches) : 0,
      max: pitches.length > 0 ? Math.max(...pitches) : 0,
    },
    averagePitch: pitches.length > 0 
      ? Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length)
      : 0,
  };
}
