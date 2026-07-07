import "./globals.css";
import type { Metadata } from "next";

const title = "ChainHound — agentic on-chain hack tracer";
const description =
  "Trace where exploited funds moved, live: real Etherscan data, LLM-narrated summaries, real OFAC sanctions-list matching, and automated demand/freeze-letter drafting.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cryptohackagent.vercel.app"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://cryptohackagent.vercel.app",
    siteName: "ChainHound",
    images: [{ url: "/og-image.png", width: 1280, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
