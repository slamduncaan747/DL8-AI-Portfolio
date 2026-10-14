"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModeConfig, GenerationResult } from "@/lib/types";
import { GESTURE_COLORS } from "@/lib/types";
import { MelodyPlayer, analyzeMelody, midiToNoteName } from "@/lib/midi";

interface ResultViewProps {
  result: GenerationResult;
  mode: ModeConfig;
  gestures: number[];
  onReset: () => void;
  onTryAgain: () => void;
}

interface Note {
  pitch: number; // MIDI number, or -1 for visual-only holds
  displayPitch: number; // Actual MIDI pitch to display
  startIndex: number;
  duration: number; // Number of tokens
}

export function ResultView({ result, mode, gestures, onReset, onTryAgain }: ResultViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [isInit, setIsInit] = useState(false);
  const playerRef = useRef<MelodyPlayer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const analysis = analyzeMelody(result.melody);

  // Expand gestures to exactly match melody length
  const expandedGestures = expandGesturesToMatch(gestures, result.melody.length, mode.expandGestures);

  // Parse melody into notes with proper hold handling
  const notes = parseMelodyToNotes(result.melody);
  
  // Calculate piano roll range from actual pitches in melody
  const pitchRange = calculatePitchRange(notes);

  useEffect(() => {
    return () => { playerRef.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const noteIndex = Math.floor(progress * result.melody.length);
      setCurrentNote(Math.min(noteIndex, result.melody.length - 1));
      
      // Auto-scroll to keep playhead visible
      if (scrollRef.current) {
        const container = scrollRef.current;
        const playheadPos = progress * container.scrollWidth;
        const containerWidth = container.clientWidth;
        const scrollPos = container.scrollLeft;
        
        // Scroll if playhead is near edges
        if (playheadPos < scrollPos + containerWidth * 0.2) {
          container.scrollLeft = Math.max(0, playheadPos - containerWidth * 0.3);
        } else if (playheadPos > scrollPos + containerWidth * 0.8) {
          container.scrollLeft = playheadPos - containerWidth * 0.5;
        }
      }
    } else {
      setCurrentNote(null);
    }
  }, [progress, isPlaying, result.melody.length]);

  const init = useCallback(async () => {
    if (!playerRef.current) {
      playerRef.current = new MelodyPlayer();
      playerRef.current.setOnProgress(setProgress);
      await playerRef.current.initialize();
    }
    setIsInit(true);
  }, []);

  const handlePlay = async () => {
    if (!isInit) await init();
    
    if (isPlaying) {
      playerRef.current?.stop();
      setIsPlaying(false);
      setProgress(0);
      setCurrentNote(null);
    } else {
      setIsPlaying(true);
      setProgress(0);
      await playerRef.current?.play(result.melody);
      setIsPlaying(false);
      setProgress(1);
    }
  };

  const getPitchInfo = (pitch: number) => {
    if (pitch === 129) return { label: "Rest", color: "#94a3b8", isRest: true };
    if (pitch === 128) return { label: "Hold", color: "#64748b", isRest: false };
    if (pitch === 1) return { label: "Repeat", color: "#42a5f5", isRest: false };
    const normalized = Math.max(0, Math.min(1, (pitch - 48) / 36));
    // Blue gradient for melody
    const hue = 200 + normalized * 60; // Blue to cyan
    return { 
      label: midiToNoteName(pitch), 
      color: `hsl(${hue}, 70%, ${45 + normalized * 15}%)`,
      isRest: false
    };
  };

  const getGestureSymbol = (gesture: number) => {
    if (gesture === 0) return "—";
    if (gesture === 1) return "↔";
    if (gesture === 2) return "↑";
    if (gesture === 3) return "⇡";
    if (gesture === 4) return "⇈";
    if (gesture === 5) return "↓";
    if (gesture === 6) return "⇣";
    if (gesture === 7) return "⇊";
    return "·";
  };

  // Calculate minimum width needed (at least 75% of container, more if needed)
  const minNoteWidth = 20; // Minimum pixels per token
  const calculatedWidth = Math.max(
    result.melody.length * minNoteWidth,
    typeof window !== 'undefined' ? window.innerWidth * 0.75 : 1200
  );

  // Generate piano key labels based on range
  const pianoKeys = generatePianoKeys(pitchRange.min, pitchRange.max);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Your melody is ready</h2>
        <div className="flex items-center justify-center gap-3 text-sm text-[var(--text-secondary)]">
          <span className="font-mono">{midiToNoteName(analysis.pitchRange.min)} – {midiToNoteName(analysis.pitchRange.max)}</span>
          <span>·</span>
          <span>{analysis.noteCount} notes</span>
          <span>·</span>
          <span>{result.melody.length} tokens</span>
        </div>
      </div>

      {/* Player */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden mb-6">
        {/* Controls header */}
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={!isInit && isPlaying}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isPlaying
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                  : "bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:scale-105"
              }`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            <div className="flex-grow">
              <div className="font-mono text-sm mb-1">
                {isPlaying ? (
                  <span className="text-green-500">Playing</span>
                ) : (
                  <span>Ready to play</span>
                )}
                {currentNote !== null && (
                  <span className="text-[var(--text-secondary)] ml-2">
                    · {currentNote + 1} of {result.melody.length}
                  </span>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="h-1 bg-[var(--bg-canvas)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>

          {/* Current note display */}
          <AnimatePresence>
            {isPlaying && currentNote !== null && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center justify-center gap-3 text-sm"
              >
                <div 
                  className="px-2 py-1 rounded font-mono font-bold text-white"
                  style={{ backgroundColor: GESTURE_COLORS[expandedGestures[currentNote]] }}
                >
                  {getGestureSymbol(expandedGestures[currentNote])}
                </div>
                <span className="text-[var(--text-secondary)]">→</span>
                <div 
                  className="px-2 py-1 rounded font-mono font-bold text-white"
                  style={{ backgroundColor: getPitchInfo(result.melody[currentNote]).color }}
                >
                  {getPitchInfo(result.melody[currentNote]).label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Piano Roll Visualization */}
        <div className="p-5">
          <div 
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden"
            style={{ maxWidth: '100%' }}
          >
            <div style={{ minWidth: `${calculatedWidth}px` }}>
              {/* Piano roll */}
              <div className="relative h-64 bg-[var(--bg-canvas)] rounded overflow-hidden border border-[var(--border)]">
                {/* Piano keys on left */}
                <div className="absolute left-0 top-0 bottom-0 w-14 bg-white border-r-2 border-[var(--border)] z-20">
                  {pianoKeys.map((key, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-center text-[9px] font-mono font-bold border-b"
                      style={{ 
                        height: `${100 / pianoKeys.length}%`,
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8f8f8",
                        borderColor: key.isC ? "var(--border)" : "rgba(0,0,0,0.05)",
                        color: "#666"
                      }}
                    >
                      {key.label}
                    </div>
                  ))}
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 left-14">
                  {pianoKeys.map((key, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        height: `${100 / pianoKeys.length}%`,
                        backgroundColor: i % 2 === 0 ? "rgba(0,0,0,0.01)" : "transparent",
                        borderBottom: "1px solid",
                        borderColor: key.isC ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.04)"
                      }}
                    />
                  ))}
                </div>

                {/* Notes with proper durations */}
                <div className="absolute inset-0 left-14" style={{ paddingRight: '4px' }}>
                  {notes.map((note, idx) => {
                    if (note.pitch === 129) {
                      // REST - show as empty space (no visual)
                      return null;
                    }
                    
                    const info = getPitchInfo(note.displayPitch);
                    const isActive = currentNote !== null && 
                                     currentNote >= note.startIndex && 
                                     currentNote < note.startIndex + note.duration;
                    
                    // Map MIDI note to vertical position (0-100%)
                    const normalized = (note.displayPitch - pitchRange.min) / (pitchRange.max - pitchRange.min);
                    const yPos = 100 - (normalized * 100); // Invert so high notes are at top
                    
                    const noteWidth = (note.duration / result.melody.length) * 100;
                    const noteLeft = (note.startIndex / result.melody.length) * 100;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute transition-all"
                        style={{
                          left: `${noteLeft}%`,
                          top: `${yPos}%`,
                          width: `${noteWidth}%`,
                          transform: "translateY(-50%)",
                          paddingRight: '2px'
                        }}
                      >
                        <div
                          className={`w-full rounded transition-all ${
                            isActive ? "shadow-lg ring-2 ring-white ring-offset-1" : ""
                          }`}
                          style={{
                            height: isActive ? '16px' : '12px',
                            backgroundColor: info.color,
                            opacity: isActive ? 1 : 
                                     currentNote !== null && note.startIndex < currentNote ? 0.3 : 0.75,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Playhead */}
                {isPlaying && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10"
                    style={{ left: `calc(3.5rem + ${progress * (100 - 3.5)}%)` }}
                  />
                )}
              </div>

              {/* Gesture strip */}
              <div className="mt-3 h-10 flex gap-px overflow-hidden rounded border border-[var(--border)]">
                {expandedGestures.map((g, i) => {
                  const symbol = getGestureSymbol(g);
                  const isActive = currentNote === i;
                  return (
                    <div
                      key={i}
                      className={`flex-1 flex items-center justify-center text-white text-xs font-bold transition-all ${
                        isActive ? "scale-y-110" : ""
                      }`}
                      style={{ 
                        backgroundColor: GESTURE_COLORS[g],
                        opacity: isActive ? 1 : 
                                 currentNote !== null && i < currentNote ? 0.25 : 0.7,
                        minWidth: `${100 / expandedGestures.length}%`
                      }}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={onTryAgain} className="btn btn-primary">
          Create another
        </button>
        <button onClick={onReset} className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Change mode
        </button>
      </div>

      <p className="text-center mt-6 text-xs text-[var(--text-secondary)]">
        🔊 Ensure your system volume is on
      </p>
    </div>
  );
}

function parseMelodyToNotes(melody: number[]): Note[] {
  const notes: Note[] = [];
  let i = 0;
  let lastPitch: number | null = null; // Track last actual pitch
  
  while (i < melody.length) {
    const token = melody[i];
    
    if (token === 129) {
      // REST - add as-is
      notes.push({ pitch: 129, displayPitch: 60, startIndex: i, duration: 1 });
      i++;
    } else if (token === 128) {
      // HOLD - extend previous note or treat as rest if no previous
      if (lastPitch !== null) {
        // Find the last note and extend it
        if (notes.length > 0 && notes[notes.length - 1].displayPitch === lastPitch) {
          notes[notes.length - 1].duration++;
        } else {
          // Previous note ended, start new note with same pitch
          notes.push({ pitch: 128, displayPitch: lastPitch, startIndex: i, duration: 1 });
        }
      } else {
        // No previous pitch, treat as rest
        notes.push({ pitch: 129, displayPitch: 60, startIndex: i, duration: 1 });
      }
      i++;
    } else if (token === 1) {
      // REPEAT - repeat last pitch as new note
      const repeatPitch = lastPitch !== null ? lastPitch : 60;
      notes.push({ pitch: 1, displayPitch: repeatPitch, startIndex: i, duration: 1 });
      i++;
    } else if (token >= 0 && token <= 127) {
      // New pitch
      notes.push({ pitch: token, displayPitch: token, startIndex: i, duration: 1 });
      lastPitch = token;
      i++;
    } else {
      i++;
    }
  }
  
  return notes;
}

function calculatePitchRange(notes: Note[]): { min: number; max: number } {
  const pitches = notes
    .filter(n => n.displayPitch >= 0 && n.displayPitch <= 127)
    .map(n => n.displayPitch);
  
  if (pitches.length === 0) {
    return { min: 48, max: 72 }; // Default 2-octave range
  }
  
  let min = Math.min(...pitches);
  let max = Math.max(...pitches);
  
  // Ensure at least 1 octave range
  const range = max - min;
  if (range < 12) {
    const center = Math.floor((min + max) / 2);
    min = center - 6;
    max = center + 6;
  }
  
  // Add padding
  min = Math.max(21, min - 2);
  max = Math.min(108, max + 2);
  
  return { min, max };
}

function generatePianoKeys(minPitch: number, maxPitch: number) {
  const keys = [];
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  for (let pitch = maxPitch; pitch >= minPitch; pitch--) {
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    keys.push({
      label: `${noteName}${octave}`,
      pitch,
      isC: noteName === "C"
    });
  }
  
  return keys;
}

function expandGesturesToMatch(gestures: number[], targetLength: number, shouldExpand: boolean): number[] {
  if (!shouldExpand || targetLength === gestures.length) {
    // No expansion needed - just pad/trim
    const result = [...gestures];
    while (result.length < targetLength) result.push(0);
    return result.slice(0, targetLength);
  }

  // Expand: distribute gestures evenly across target length
  const result: number[] = [];
  const ratio = targetLength / gestures.length;
  
  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = Math.floor(i / ratio);
    const positionInExpansion = i % Math.floor(ratio);
    
    // First position gets the gesture, rest get HOLD (0)
    if (positionInExpansion === 0) {
      result.push(gestures[sourceIndex] || 0);
    } else {
      result.push(0);
    }
  }
  
  return result.slice(0, targetLength);
}
