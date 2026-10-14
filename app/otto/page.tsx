import type { Metadata } from "next";
import { OttoFrame } from "@/components/OttoFrame";

export const metadata: Metadata = {
  title: "Otto",
  description: "Heads-up poker against an AI that models its opponent and adapts its strategy to exploit them.",
};

export default async function OttoPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <OttoFrame initial={view ?? "play"} />;
}
