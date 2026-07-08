import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TraceGraph } from "@/lib/trace";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const graph = body?.graph as TraceGraph | undefined;

  if (!graph) {
    return NextResponse.json({ error: "Missing graph in request body" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable narration." },
      { status: 500 }
    );
  }

  const flaggedNodes = graph.nodes.filter((n) => n.watchlistHit);
  const contractNodes = graph.nodes.filter((n) => n.contractName);
  const summaryForModel = {
    seedAddress: graph.seed,
    hopsFollowed: Math.max(0, ...graph.nodes.map((n) => n.depth)),
    totalAddressesTouched: graph.nodes.length,
    totalTransfersFollowed: graph.edges.length,
    truncated: graph.truncated,
    flaggedAddresses: flaggedNodes.map((n) => ({
      address: n.address,
      depth: n.depth,
      label: n.watchlistHit?.label,
      category: n.watchlistHit?.category,
    })),
    verifiedContractsEncountered: contractNodes.map((n) => ({
      address: n.address,
      depth: n.depth,
      contractName: n.contractName,
    })),
    edges: graph.edges.slice(0, 100).map((e) => ({
      from: e.from,
      to: e.to,
      hash: e.hash,
      valueUnit: e.valueUnit,
      tokenSymbol: e.tokenSymbol,
      depth: e.depth,
    })),
  };

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a blockchain forensics assistant. Below is structured trace data: an on-chain
walk of outgoing transfers starting from a seed address, up to a few hops deep, on a public
blockchain. Write a short, plain-English investigative narrative summarizing where the funds
moved. Be factual and hedge appropriately — this data source only has actual watchlist hits
(no fabricated ones), so if nothing was flagged, say so plainly rather than implying wrongdoing.
Do not speculate about identity beyond what's in the data. Do not claim funds were "stolen" —
you don't know that; just describe the movement. If any hop touched a verified smart contract
(see verifiedContractsEncountered), mention it by name — e.g. "funds passed through the verified
contract X" — since that's a real, sourced fact, distinct from any watchlist flag.

Trace data:
${JSON.stringify(summaryForModel, null, 2)}`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    return NextResponse.json({ narrative: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Narration failed" }, { status: 500 });
  }
}
