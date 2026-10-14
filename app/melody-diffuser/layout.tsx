import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Melody Diffuser",
  description: "Compose a melody with your finger: a gesture-conditioned diffusion transformer that turns hand movement into music.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
