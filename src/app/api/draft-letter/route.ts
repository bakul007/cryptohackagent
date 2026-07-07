import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TraceGraph } from "@/lib/trace";

// Drafts a demand/freeze-request letter from real trace facts. This is deliberately scoped:
// no claim of exchange relationships, no auto-send, no guarantee of a freeze. Real letters of
// this kind follow a known structure — evidence, a request to hold funds pending law
// enforcement legal process, and a response window — and exchanges generally require law
// enforcement involvement for anything beyond a short administrative hold. See README.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const graph = body?.graph as TraceGraph | undefined;
  const lossAmount = body?.lossAmount as string | undefined;
  const lossCurrency = (body?.lossCurrency as string | undefined) ?? "USD";
  const ic3Number = body?.ic3Number as string | undefined;

  if (!graph) {
    return NextResponse.json({ error: "Missing graph in request body" }, { status: 400 });
  }
  if (!lossAmount) {
    return NextResponse.json({ error: "Loss amount is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable letter drafting." },
      { status: 500 }
    );
  }

  const flaggedNodes = graph.nodes.filter((n) => n.watchlistHit && n.watchlistHit.category !== "burn");
  const facts = {
    seedAddress: graph.seed,
    chainId: graph.chainId,
    hopsFollowed: Math.max(0, ...graph.nodes.map((n) => n.depth)),
    addressesTouched: graph.nodes.length,
    transfersFollowed: graph.edges.length,
    flaggedAddresses: flaggedNodes.map((n) => ({
      address: n.address,
      depth: n.depth,
      label: n.watchlistHit?.label,
    })),
    sampleTransactionHashes: graph.edges.slice(0, 5).map((e) => e.hash),
    lossAmount,
    lossCurrency,
    ic3Number: ic3Number || null,
  };

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Draft a formal demand/freeze-request letter for a cryptocurrency theft victim to send
themselves to the compliance/fraud department of the exchange or platform that received their
stolen funds. Base it only on the facts provided below — never invent an exchange name, a legal
citation, or a fact not given. If the destination exchange isn't known from the data, address it
generically ("To the Compliance and Fraud Department of the institution operating the wallet
address below") rather than guessing a specific exchange.

Follow the real structure such letters use: victim's incident summary, the on-chain evidence
(seed address, relevant transaction hashes, hop path), the specific request (place an
administrative hold on the receiving account pending law enforcement legal process — do NOT claim
the letter itself can compel a freeze), a note referencing the FBI IC3 complaint number if one was
provided, and a reasonable response window (10-14 business days). Include a placeholder for the
victim's contact details and signature.

The letter must open with this exact notice before the letter body itself:
"DRAFT — review carefully and have it checked before sending. This is not legal advice. File a
report with the FBI's Internet Crime Complaint Center (ic3.gov) regardless of anything else you do
— most exchanges require law enforcement involvement to extend a hold beyond an initial review."

Facts:
${JSON.stringify(facts, null, 2)}`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    return NextResponse.json({ letter: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Letter drafting failed" }, { status: 500 });
  }
}
