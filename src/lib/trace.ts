import { getNormalTransactions, getTokenTransfers, NormalTx } from "./etherscan";
import { checkAddress, WatchlistEntry } from "./watchlist";

export type TraceEdge = {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUnit: "native" | "token";
  tokenSymbol?: string;
  timestamp: string;
  depth: number;
};

export type TraceNode = {
  address: string;
  depth: number;
  watchlistHit: WatchlistEntry | null;
};

export type TraceGraph = {
  seed: string;
  chainId: number;
  nodes: TraceNode[];
  edges: TraceEdge[];
  truncated: boolean;
};

const MAX_FANOUT_PER_NODE = 8; // cap children per address so the graph doesn't explode
const MIN_NODES_TO_VISIT = 1;

// Breadth-first walk outward from `seed`, following outgoing transfers, up to `maxDepth` hops.
// This only follows OUTGOING transfers (where funds went), which is what "where did the
// stolen money go" tracing needs. It intentionally does not follow incoming transfers.
export async function traceOutward(
  seed: string,
  chainId: number,
  maxDepth: number
): Promise<TraceGraph> {
  const nodes = new Map<string, TraceNode>();
  const edges: TraceEdge[] = [];
  const visited = new Set<string>();
  let truncated = false;

  nodes.set(seed.toLowerCase(), {
    address: seed,
    depth: 0,
    watchlistHit: checkAddress(seed),
  });

  let frontier: string[] = [seed];

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: string[] = [];

    for (const address of frontier) {
      const key = address.toLowerCase();
      if (visited.has(key)) continue;
      visited.add(key);

      let normal: NormalTx[] = [];
      let tokens: NormalTx[] = [];
      try {
        [normal, tokens] = await Promise.all([
          getNormalTransactions(address, chainId),
          getTokenTransfers(address, chainId),
        ]);
      } catch (err) {
        // A single address failing (rate limit, bad data) shouldn't kill the whole trace.
        continue;
      }

      const outgoing = [
        ...normal
          .filter((tx) => tx.from.toLowerCase() === key && tx.isError === "0" && BigInt(tx.value || "0") > 0n)
          .map((tx) => ({ ...tx, unit: "native" as const })),
        ...tokens
          .filter((tx) => tx.from.toLowerCase() === key)
          .map((tx) => ({ ...tx, unit: "token" as const })),
      ].slice(0, MAX_FANOUT_PER_NODE);

      if (
        normal.filter((tx) => tx.from.toLowerCase() === key).length + tokens.filter((tx) => tx.from.toLowerCase() === key).length >
        MAX_FANOUT_PER_NODE
      ) {
        truncated = true;
      }

      for (const tx of outgoing) {
        const toKey = tx.to.toLowerCase();
        edges.push({
          hash: tx.hash,
          from: address,
          to: tx.to,
          value: tx.value,
          valueUnit: tx.unit,
          tokenSymbol: tx.tokenSymbol,
          timestamp: tx.timeStamp,
          depth,
        });

        if (!nodes.has(toKey)) {
          nodes.set(toKey, {
            address: tx.to,
            depth: depth + 1,
            watchlistHit: checkAddress(tx.to),
          });
        }
        if (!visited.has(toKey)) {
          nextFrontier.push(tx.to);
        }
      }
    }

    frontier = nextFrontier;
    if (frontier.length === 0) break;
  }

  return {
    seed,
    chainId,
    nodes: Array.from(nodes.values()),
    edges,
    truncated,
  };
}
