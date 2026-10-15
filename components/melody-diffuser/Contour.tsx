import { contour } from "@/lib/gestures";

/** The shape of a 64-step gesture sequence, drawn as a line. */
export function Contour({ tokens, className = "", height = 56 }: { tokens: number[]; className?: string; height?: number }) {
  const ys = [0, ...contour(tokens)];
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = Math.max(4, max - min);
  const w = 640;
  const pad = 6;
  const pts = ys
    .map((y, i) => {
      const x = (i / (ys.length - 1)) * w;
      const yy = pad + (1 - (y - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${yy.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={`block w-full ${className}`} style={{ height }} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--blue)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
