# ChainHound

Agentic on-chain hack tracer. Give it a seed address (e.g. an exploited contract or a hacker's
wallet), and it:

1. Walks live outgoing transfers N hops out using the real Etherscan v2 API (works across
   Ethereum, BNB Chain, Polygon, Arbitrum — anywhere Etherscan's unified API covers).
2. Flags any address on your watchlist (`data/watchlist.json`).
3. Has an LLM agent narrate the trace in plain English — this narration step, not the hop-walk,
   is the actual differentiator over clicking through a block explorer by hand.

## What this is not

Read this before treating any output as authoritative:

- **No attribution database.** `data/watchlist.json` ships with only the burn/zero address —
  nothing else. It does not know which addresses belong to mixers, exchanges, or sanctioned
  entities. That data set is most of what Chainalysis, TRM Labs, and Elliptic actually sell,
  built over years from subpoenas and law-enforcement cooperation — it's not something to
  fabricate here. Populate the watchlist yourself from sources you trust:
  - OFAC SDN list: https://ofac.treasury.gov/specially-designated-nationals-list-sdn-list
  - Community datasets: https://github.com/OffcierCia/On-Chain-Investigations-Tools-List
- **No freezing capability.** Only an exchange's compliance team can freeze funds, and they act
  on requests from vendors/law enforcement they already have a relationship with. This tool can
  help you build the evidence trail for a freeze request letter; it cannot send one or make an
  exchange act on it.
- **No cross-chain bridge/mixer demixing.** Following funds through a bridge or a mixer like
  Tornado Cash requires dedicated heuristics this MVP doesn't implement.
- **Not court-admissible chain of custody.** No cryptographic proof of data integrity, no expert
  witness track record.

What it's honest about being: a real, functional first-hop tracer with an autonomous narration
layer, useful for a fast first look at where funds moved — not a regulatory-grade investigation
platform.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in ETHERSCAN_API_KEY (free, https://etherscan.io/apis)
# fill in ANTHROPIC_API_KEY (https://console.anthropic.com/)
npm run dev
```

Open http://localhost:3000, paste an address, pick a chain and hop depth, and trace.

## Architecture

```
src/
  app/
    page.tsx              UI: address form, results, narrative
    api/trace/route.ts    server-side chain walk (keeps API keys off the client)
    api/narrate/route.ts  LLM narration of the trace graph
  lib/
    etherscan.ts           Etherscan v2 API client
    trace.ts               BFS outward walk, fan-out capping, watchlist flagging
    watchlist.ts            watchlist lookup
data/
  watchlist.json           known-address list (ships nearly empty — see above)
```

## Roadmap ideas (not built — future scope)

- Legal freeze-request-letter drafting from a completed trace (this is the piece that's
  actually valuable and legally differentiated — a template + facts-of-the-trace generator for
  letters to exchange compliance teams, for cases too small for the Feds to prioritize).
  Requires legal review before shipping as a real product feature.
- Incoming-transfer tracing (where funds *came from*), not just outward.
- Bridge-hop following.
- Persistent case storage so a trace can be revisited/exported as a report (PDF).
