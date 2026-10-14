"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectBar } from "@/components/ProjectBar";
import { project } from "@/lib/projects";
import { OTTO } from "@/lib/site";

const VIEWS = ["play", "you", "arena", "how"];
const ORIGIN = new URL(OTTO.app).origin;

/**
 * Otto is its own app, deployed from the Poker-rl repo. Here it runs in its
 * paper theme with its own navigation hidden: the project bar's tabs switch
 * its views over postMessage, and it reports back when a link inside it
 * changes the view, so the tabs and the URL always match what is showing.
 */
export function OttoFrame({ initial }: { initial: string }) {
  const start = VIEWS.includes(initial) ? initial : "play";
  const [view, setView] = useState(start);
  const frame = useRef<HTMLIFrameElement>(null);
  // the src is fixed at the first view; later switches are messages, so the app keeps its state
  const [src] = useState(`${OTTO.app}?embed&theme=paper&nav=0#${start}`);

  const sync = (v: string) => {
    setView(v);
    const url = v === "play" ? "/otto" : `/otto?view=${v}`;
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGIN || e.data?.type !== "otto:route" || !VIEWS.includes(e.data.route)) return;
      sync(e.data.route);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const go = (v: string) => {
    frame.current?.contentWindow?.postMessage({ type: "otto:navigate", route: v }, ORIGIN);
    sync(v);
  };

  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-[640px] flex-col">
      <ProjectBar project={project("otto")} active={view} onTab={go} />
      <iframe ref={frame} src={src} title="Otto" className="block w-full flex-1 border-0" allow="fullscreen" />
    </div>
  );
}
