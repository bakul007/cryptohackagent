// Thin client for the Etherscan v2 unified API (one key, chainid selects the network).
// Docs: https://docs.etherscan.io/etherscan-v2

const BASE_URL = "https://api.etherscan.io/v2/api";

export type Chain = {
  id: number;
  name: string;
  nativeSymbol: string;
  explorerBase: string;
};

// Etherscan v2 covers 50+ chains via chainid. Start with the ones an MVP actually needs.
export const CHAINS: Record<string, Chain> = {
  ethereum: { id: 1, name: "Ethereum", nativeSymbol: "ETH", explorerBase: "https://etherscan.io" },
  bsc: { id: 56, name: "BNB Chain", nativeSymbol: "BNB", explorerBase: "https://bscscan.com" },
  polygon: { id: 137, name: "Polygon", nativeSymbol: "MATIC", explorerBase: "https://polygonscan.com" },
  arbitrum: { id: 42161, name: "Arbitrum", nativeSymbol: "ETH", explorerBase: "https://arbiscan.io" },
};

export type NormalTx = {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string; // wei, as string
  isError: string;
  tokenSymbol?: string;
};

function getApiKey(): string {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) {
    throw new Error(
      "ETHERSCAN_API_KEY is not set. Get a free key at https://etherscan.io/apis and add it to .env.local"
    );
  }
  return key;
}

async function callEtherscan(params: Record<string, string>): Promise<any> {
  const url = new URL(BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", getApiKey());

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Etherscan HTTP error ${res.status}`);
  }
  const json = await res.json();
  // Etherscan returns status "0" with message "No transactions found" for empty results —
  // that's not an error, just an empty set.
  if (json.status === "0" && json.message !== "No transactions found") {
    throw new Error(`Etherscan API error: ${json.result || json.message}`);
  }
  return json.result;
}

// Native ETH (or chain-native-coin) transfers in/out of an address.
export async function getNormalTransactions(
  address: string,
  chainId: number
): Promise<NormalTx[]> {
  const result = await callEtherscan({
    chainid: String(chainId),
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "200",
    sort: "asc",
  });
  return Array.isArray(result) ? result : [];
}

// ERC-20 token transfers — stolen funds are very often moved as tokens (USDT/USDC/etc), not native ETH.
export async function getTokenTransfers(
  address: string,
  chainId: number
): Promise<NormalTx[]> {
  const result = await callEtherscan({
    chainid: String(chainId),
    module: "account",
    action: "tokentx",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "200",
    sort: "asc",
  });
  return Array.isArray(result) ? result : [];
}
