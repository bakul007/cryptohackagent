import { NextRequest, NextResponse } from "next/server";
import { traceOutward } from "@/lib/trace";
import { CHAINS } from "@/lib/etherscan";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = body?.address as string | undefined;
  const chainKey = (body?.chain as string | undefined) ?? "ethereum";
  const depth = Math.min(Math.max(Number(body?.depth) || 3, 1), 5);

  if (!address || !ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Provide a valid 0x... address" }, { status: 400 });
  }

  const chain = CHAINS[chainKey];
  if (!chain) {
    return NextResponse.json(
      { error: `Unsupported chain "${chainKey}". Supported: ${Object.keys(CHAINS).join(", ")}` },
      { status: 400 }
    );
  }

  if (!process.env.ETHERSCAN_API_KEY) {
    return NextResponse.json(
      { error: "ETHERSCAN_API_KEY is not set. Get a free key at https://etherscan.io/apis and add it to .env.local" },
      { status: 500 }
    );
  }

  try {
    const graph = await traceOutward(address, chain.id, depth);
    return NextResponse.json({ graph, chain });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Trace failed" }, { status: 500 });
  }
}
