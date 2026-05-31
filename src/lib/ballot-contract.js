// Chain metadata used by the wallet connect UI.
// For the midterm defense, wallet connection is required to bind ballots to a digital identity.

export const CHAINS = {
  polygonAmoy: {
    id: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorer: "https://amoy.polygonscan.com",
    currency: { name: "POL", symbol: "POL", decimals: 18 },
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    currency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  },
};

export const ACTIVE_CHAIN = CHAINS.polygonAmoy;

export const explorerAddress = (addr) =>
  `${ACTIVE_CHAIN.explorer}/address/${addr}`;