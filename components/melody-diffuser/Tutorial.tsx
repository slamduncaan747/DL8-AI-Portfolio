"use client";

import { useRef, useEffect, useState } from "react";
import type { Hands, Results } from "@mediapipe/hands";
import { motion, AnimatePresence } from "framer-motion";
import { GESTURE_COLORS } from "@/lib/types";

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = "intro" | "camera" | "hold" | "up" | "down" | "practice" | "done";
const STEPS: Step[] = ["intro", "camera", "hold", "up", "down", "practice", "done"];
const PRACTICE_SEQUENCE = ["hold", "up", "hold", "down"] as const;

export function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const handYRef = useRef<number | null>(null);
  const positionHistoryRef = useRef<number[]>([]);
  const holdFramesRef = useRef(0);
  const successTriggeredRef = useRef(false);

  const [step, setStep] = useState<Step>("intro");
  const [cameraReady, setCameraReady] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>("none");
  const [holdProgress, setHoldProgress] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceGestures, setPracticeGestures] = useState<string[]>([]);
  const [handDetected, setHandDetected] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const isPracticeGesture = step === "hold" || step === "up" || step === "down";
  const requiredSuccesses = 2;
  const holdFramesNeeded = 18;
  const historyLength = 8;

  useEffect(() => {
    const init = async () => {
      try {
        const { Hands } = await import("@mediapipe/hands");
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        hands.onResults((results: Results) => {
          if (results.multiHandLandmarks?.[0]) {
            const lm = results.multiHandLandmarks[0][8];
            const video = videoRef.current;
            if (video && video.videoHeight > 0) {
              handYRef.current = lm.y * video.videoHeight;
              setHandDetected(true);
            }
          } else {
            handYRef.current = null;
            setHandDetected(false);
          }
        });
        handsRef.current = hands;
      } catch (e) {
        console.error("MediaPipe init failed:", e);
      }
    };
    init();
    return () => { handsRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (step !== "camera" && !cameraReady) return;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            setCameraReady(true);
          };
        }
      } catch (e) {
        console.error("Camera error:", e);
      }
    };
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [step, cameraReady]);

  useEffect(() => {
    holdFramesRef.current = 0;
    positionHistoryRef.current = [];
    successTriggeredRef.current = false;
    setHoldProgress(0);
    setCurrentGesture("none");
  }, [step]);

  useEffect(() => {
    if (!cameraReady || !handsRef.current || (!isPracticeGesture && step !== "practice")) return;

    const process = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(process);
        return;
      }

      try { await handsRef.current?.send({ image: video }); } catch {}

      const handY = handYRef.current;
      let detectedGesture = "none";

      if (handY !== null) {
        positionHistoryRef.current.push(handY);
        if (positionHistoryRef.current.length > historyLength) {
          positionHistoryRef.current.shift();
        }

        const history = positionHistoryRef.current;
        
        if (history.length >= 3) {
          const recentMovement = history[history.length - 1] - history[history.length - 2];
          const avg = history.reduce((a, b) => a + b, 0) / history.length;
          const variance = history.reduce((sum, y) => sum + Math.pow(y - avg, 2), 0) / history.length;
          const isStill = variance < 350;

          if (recentMovement < -20) {
            detectedGesture = "up";
          } else if (recentMovement > 20) {
            detectedGesture = "down";
          } else if (isStill && history.length >= historyLength) {
            detectedGesture = "hold";
          }
        }
      }

      setCurrentGesture(detectedGesture);

      const targetGesture = step === "practice" ? PRACTICE_SEQUENCE[practiceIndex] : step;

      if (!successTriggeredRef.current) {
        if (targetGesture === "hold") {
          if (detectedGesture === "hold") {
            holdFramesRef.current++;
            setHoldProgress(Math.min(holdFramesRef.current / holdFramesNeeded, 1));
            if (holdFramesRef.current >= holdFramesNeeded) {
              triggerSuccess();
            }
          } else {
            holdFramesRef.current = Math.max(0, holdFramesRef.current - 2);
            setHoldProgress(Math.min(holdFramesRef.current / holdFramesNeeded, 1));
          }
        } else if (targetGesture === "up" && detectedGesture === "up") {
          triggerSuccess();
        } else if (targetGesture === "down" && detectedGesture === "down") {
          triggerSuccess();
        }
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0);
        ctx.restore();

        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGuides(ctx, canvas.width, canvas.height, targetGesture as string, detectedGesture);

        if (handY !== null) {
          drawHand(ctx, canvas.width / 2, handY, detectedGesture);
        }
      }

      animationRef.current = requestAnimationFrame(process);
    };

    animationRef.current = requestAnimationFrame(process);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [cameraReady, step, isPracticeGesture, practiceIndex]);

  const drawGuides = (ctx: CanvasRenderingContext2D, w: number, h: number, target: string, detected: string) => {
    const isMatch = target === detected && detected !== "none";
    const centerY = h / 2;

    ctx.font = "600 22px system-ui";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;

    if (target === "hold") {
      ctx.fillText("Hold your hand perfectly still", w / 2, 45);
      
      if (holdProgress > 0 && handYRef.current !== null) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(w / 2, handYRef.current, 38, -Math.PI / 2, -Math.PI / 2 + holdProgress * Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 4;
      }
    }

    if (target === "up") {
      ctx.fillStyle = isMatch ? "rgba(34, 197, 94, 0.25)" : "rgba(129, 199, 132, 0.12)";
      ctx.shadowBlur = 0;
      ctx.fillRect(0, 0, w, centerY - 50);

      ctx.font = "600 26px system-ui";
      ctx.fillStyle = isMatch ? "#22c55e" : "white";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText("↑ Move up quickly", w / 2, 55);
    }

    if (target === "down") {
      ctx.fillStyle = isMatch ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 154, 154, 0.12)";
      ctx.shadowBlur = 0;
      ctx.fillRect(0, centerY + 50, w, h - centerY - 50);

      ctx.font = "600 26px system-ui";
      ctx.fillStyle = isMatch ? "#22c55e" : "white";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText("↓ Move down quickly", w / 2, h - 25);
    }

    ctx.shadowBlur = 0;
  };

  const drawHand = (ctx: CanvasRenderingContext2D, x: number, y: number, gesture: string) => {
    const color = gesture === "hold" ? GESTURE_COLORS[0] 
      : gesture === "up" ? GESTURE_COLORS[2]
      : gesture === "down" ? GESTURE_COLORS[5]
      : "#ffffff";

    ctx.shadowColor = color;
    ctx.shadowBlur = gesture !== "none" ? 30 : 15;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, gesture !== "none" ? 18 : 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    if (gesture !== "none") {
      ctx.font = "bold 15px system-ui";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 3;
      ctx.fillText(gesture.toUpperCase(), x, y - 35);
      ctx.shadowBlur = 0;
    }
  };

  const triggerSuccess = () => {
    if (successTriggeredRef.current) return;
    successTriggeredRef.current = true;
    setShowSuccess(true);
    holdFramesRef.current = 0;
    setHoldProgress(0);
    positionHistoryRef.current = [];

    if (step === "practice") {
      setPracticeGestures(g => [...g, PRACTICE_SEQUENCE[practiceIndex]]);
      setTimeout(() => {
        setShowSuccess(false);
        successTriggeredRef.current = false;
        if (practiceIndex + 1 >= PRACTICE_SEQUENCE.length) {
          nextStep();
        } else {
          setPracticeIndex(i => i + 1);
        }
      }, 400);
    } else {
      setSuccessCount(c => {
        const newCount = c + 1;
        setTimeout(() => {
          setShowSuccess(false);
          successTriggeredRef.current = false;
          if (newCount >= requiredSuccesses) {
            nextStep();
            setSuccessCount(0);
          }
        }, 400);
        return newCount;
      });
    }
  };

  const nextStep = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) {
      setStep(STEPS[i + 1]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm text-[var(--text-secondary)]">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <button onClick={onSkip} className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Skip tutorial →
        </button>
      </div>
      <div className="h-px bg-[var(--border)] mb-8">
        <div 
          className="h-px bg-[var(--text-primary)] transition-all duration-300" 
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} 
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {step === "intro" && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-3">Three gestures, infinite melodies</h2>
              <p className="text-[var(--text-secondary)] mb-10">
                Master the basics in under a minute.
              </p>
              
              <div className="grid grid-cols-3 gap-8 mb-12 max-w-md mx-auto">
                {[
                  { name: "Hold", desc: "Stay still", color: GESTURE_COLORS[0], icon: "✋" },
                  { name: "Up", desc: "Rise", color: GESTURE_COLORS[2], icon: "👆" },
                  { name: "Down", desc: "Fall", color: GESTURE_COLORS[5], icon: "👇" },
                ].map((g) => (
                  <div key={g.name} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: g.color }}
                    >
                      {g.icon}
                    </div>
                    <div className="font-semibold mb-1">{g.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{g.desc}</div>
                  </div>
                ))}
              </div>
              
              <button onClick={nextStep} className="btn btn-primary">
                Begin tutorial →
              </button>
            </div>
          )}

          {step === "camera" && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-3">Camera setup</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Position yourself so your hand is clearly visible.
              </p>
              <div className="aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden mb-6 relative shadow-sm">
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm">
                    Requesting camera access...
                  </div>
                )}
              </div>
              {cameraReady && (
                <button onClick={nextStep} className="btn btn-primary">
                  Camera ready →
                </button>
              )}
            </div>
          )}

          {isPracticeGesture && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {step === "hold" && "Keep perfectly still"}
                {step === "up" && "Move upward"}
                {step === "down" && "Move downward"}
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                {step === "hold" && "Freeze your hand in place—a ring will appear"}
                {step === "up" && "Quick upward gesture anywhere in frame"}
                {step === "down" && "Quick downward gesture anywhere in frame"}
              </p>
              
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: requiredSuccesses }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < successCount ? "bg-green-500 scale-110" : "bg-[var(--border)]"
                    }`}
                  />
                ))}
              </div>

              <div className="aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden relative shadow-sm">
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                
                {!handDetected && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-mono text-sm shadow-lg">
                    Position your hand in frame
                  </div>
                )}
                
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-green-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg">
                        ✓ Perfect
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 font-mono text-sm">
                {handDetected ? (
                  currentGesture !== "none" ? (
                    <span className="text-green-500">✓ Detected: {currentGesture}</span>
                  ) : (
                    <span className="text-[var(--text-secondary)]">Waiting for gesture...</span>
                  )
                ) : (
                  <span className="text-red-400">No hand visible</span>
                )}
              </div>
            </div>
          )}

          {step === "practice" && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Complete a sequence</h2>
              <p className="text-[var(--text-secondary)] mb-5">
                Perform this pattern to finish: Hold → Up → Hold → Down
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {PRACTICE_SEQUENCE.map((g, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                      i < practiceIndex 
                        ? "bg-green-500 text-white shadow-sm" 
                        : i === practiceIndex
                        ? "bg-[var(--text-primary)] text-[var(--bg-canvas)] ring-2 ring-[var(--text-primary)] ring-offset-2 shadow-lg"
                        : "bg-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {i < practiceIndex ? "✓" : g === "hold" ? "—" : g === "up" ? "↑" : "↓"}
                  </div>
                ))}
              </div>

              <div className="aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden relative shadow-sm">
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 px-5 py-2 rounded-full">
                  <span className="text-white font-mono text-sm">
                    Next: <strong className="text-green-400">{PRACTICE_SEQUENCE[practiceIndex]?.toUpperCase()}</strong>
                  </span>
                </div>

                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg">
                        ✓
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="text-5xl mb-5">✨</div>
              <h2 className="text-2xl font-semibold mb-3">Tutorial complete</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                You&apos;ve mastered the gestures. Ready to create?
              </p>
              
              <div className="flex justify-center gap-2 mb-10">
                {practiceGestures.map((g, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-lg shadow-sm"
                    style={{ backgroundColor: g === "hold" ? GESTURE_COLORS[0] : g === "up" ? GESTURE_COLORS[2] : GESTURE_COLORS[5] }}
                  >
                    {g === "hold" ? "—" : g === "up" ? "↑" : "↓"}
                  </div>
                ))}
              </div>
              
              <button onClick={onComplete} className="btn btn-primary">
                Start creating →
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
