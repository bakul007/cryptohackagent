"use client";

import { TraceGraph } from "@/lib/trace";
import { Chain } from "@/lib/etherscan";

function shorten(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function TraceResults({ graph, chain }: { graph: TraceGraph; chain: Chain }) {
  const sorted = [...graph.nodes].sort((a, b) => a.depth - b.depth);
  const flaggedCount = graph.nodes.filter((n) => n.watchlistHit && n.watchlistHit.category !== "burn").length;
  const maxDepth = Math.max(0, ...graph.nodes.map((n) => n.depth));

  return (
    <>
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-value">{graph.nodes.length}</div>
          <div className="stat-label">Addresses touched</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{graph.edges.length}</div>
          <div className="stat-label">Transfers followed</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{maxDepth}</div>
          <div className="stat-label">Hops deep</div>
        </div>
        <div className="stat-tile">
          <div className={`stat-value${flaggedCount > 0 ? " flagged" : ""}`}>{flaggedCount}</div>
          <div className="stat-label">Watchlist hits</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-label">
          Trace graph{graph.truncated ? " — fan-out truncated at some nodes" : ""}
        </div>
        <table className="trace-table">
          <thead>
            <tr>
              <th>Hop</th>
              <th>Address</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((node) => (
              <tr key={node.address}>
                <td><span className="depth-pill">{node.depth === 0 ? "seed" : `+${node.depth}`}</span></td>
                <td>
                  <a
                    className="addr-link"
                    href={`${chain.explorerBase}/address/${node.address}`}
                    target="_blank"
                    rel="noreferrer"
                    title={node.address}
                  >
                    {shorten(node.address)}
                  </a>
                </td>
                <td>
                  {node.watchlistHit && (
                    <span className={`badge${node.watchlistHit.category === "burn" ? " burn" : ""}`}>
                      {node.watchlistHit.label}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
