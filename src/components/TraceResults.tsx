"use client";

import { TraceGraph } from "@/lib/trace";
import { Chain } from "@/lib/etherscan";

export function TraceResults({ graph, chain }: { graph: TraceGraph; chain: Chain }) {
  const sorted = [...graph.nodes].sort((a, b) => a.depth - b.depth);

  return (
    <div className="panel">
      <div className="meta">
        {graph.nodes.length} addresses touched · {graph.edges.length} transfers followed
        {graph.truncated ? " · some fan-out was truncated (see README on raising limits)" : ""}
      </div>
      {sorted.map((node) => (
        <div key={node.address} className="node-row">
          <span>{"  ".repeat(node.depth)}{node.depth === 0 ? "●" : "└─"}</span>
          <a
            href={`${chain.explorerBase}/address/${node.address}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit" }}
          >
            {node.address}
          </a>
          {node.watchlistHit && (
            <span className="badge">{node.watchlistHit.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
