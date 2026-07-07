import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChainHound — agentic on-chain hack tracer",
  description: "Trace where exploited funds moved, live, with an autonomous narration layer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
