"use client";

import { useState } from "react";
import { TraceGraph } from "@/lib/trace";
import { Chain } from "@/lib/etherscan";
import { TraceResults } from "@/components/TraceResults";
import { NarrativeReport } from "@/components/NarrativeReport";

export default function Home() {
  const [address, setAddress] = useState("");
  const [chainKey, setChainKey] = useState("ethereum");
  const [depth, setDepth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<TraceGraph | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrating, setNarrating] = useState(false);

  async function runTrace(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGraph(null);
    setNarrative(null);

    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain: chainKey, depth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Trace failed");
      setGraph(data.graph);
      setChain(data.chain);

      setNarrating(true);
      const narRes = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: data.graph }),
      });
      const narData = await narRes.json();
      if (narRes.ok) setNarrative(narData.narrative);
      setNarrating(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <h1>ChainHound</h1>
      <p className="subtitle">
        Agentic on-chain hack tracer. Walks live outgoing transfers from a seed address and has
        an agent narrate where funds moved. This is a scoped MVP, not a Chainalysis/TRM Labs
        replacement — see README for exactly what it does and doesn't do.
      </p>

      <form onSubmit={runTrace} className="panel">
        <div className="form-row">
          <input
            type="text"
            placeholder="0x... exploited/seed address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <select value={chainKey} onChange={(e) => setChainKey(e.target.value)}>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BNB Chain</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
          </select>
          <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
            <option value={1}>1 hop</option>
            <option value={2}>2 hops</option>
            <option value={3}>3 hops</option>
            <option value={4}>4 hops</option>
            <option value={5}>5 hops</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Tracing..." : "Trace"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>

      {graph && chain && <TraceResults graph={graph} chain={chain} />}
      {(narrative || narrating) && <NarrativeReport narrative={narrative} loading={narrating} />}
    </div>
  );
}
