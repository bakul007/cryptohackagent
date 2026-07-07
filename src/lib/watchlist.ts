import watchlistData from "../../data/watchlist.json";

// This file ships with only universally-uncontroversial entries (burn/zero addresses).
// It does NOT contain a curated list of sanctioned entities, mixers, or "known hacker"
// addresses — building that list well is a large, ongoing data-ops job (that's most of
// what Chainalysis/TRM/Elliptic actually sell), and getting a single address wrong here
// means falsely accusing someone. Populate data/watchlist.json yourself from sources
// you trust, e.g.:
//   - OFAC SDN list:      https://ofac.treasury.gov/specially-designated-nationals-list-sdn-list
//   - Community datasets: https://github.com/OffcierCia/On-Chain-Investigations-Tools-List
export type WatchlistEntry = {
  address: string;
  label: string;
  category: string;
  source: string;
};

const watchlist: WatchlistEntry[] = watchlistData as WatchlistEntry[];

const byAddress: Map<string, WatchlistEntry> = new Map(
  watchlist.map((entry) => [entry.address.toLowerCase(), entry])
);

export function checkAddress(address: string): WatchlistEntry | null {
  return byAddress.get(address.toLowerCase()) ?? null;
}
