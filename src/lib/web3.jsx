import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAddress } from "ethers";
import { ACTIVE_CHAIN } from "./ballot-contract";

const Web3Ctx = createContext(null);

const toHex = (n) => "0x" + n.toString(16);

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const eth = typeof window !== "undefined" ? window.ethereum : undefined;

  useEffect(() => {
    if (!eth) return;
    (async () => {
      try {
        const accounts = await eth.request({ method: "eth_accounts" });
        if (accounts?.[0]) setAddress(getAddress(accounts[0]));
        const cid = await eth.request({ method: "eth_chainId" });
        setChainId(parseInt(cid, 16));
      } catch {
        /* user dismissed */
      }
    })();

    const onAccounts = (accs) => {
      setAddress(accs?.[0] ? getAddress(accs[0]) : null);
    };
    const onChain = (cid) => setChainId(parseInt(cid, 16));
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [eth]);

  const connect = useCallback(async () => {
    if (!eth) throw new Error("MetaMask not detected. Install it from metamask.io and refresh.");
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) setAddress(getAddress(accounts[0]));
      const cid = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(cid, 16));
    } finally {
      setConnecting(false);
    }
  }, [eth]);

  const disconnect = useCallback(() => setAddress(null), []);

  const switchToActiveChain = useCallback(async () => {
    if (!eth) throw new Error("MetaMask not detected.");
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(ACTIVE_CHAIN.id) }],
      });
    } catch (err) {
      if (err?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: toHex(ACTIVE_CHAIN.id),
            chainName: ACTIVE_CHAIN.name,
            rpcUrls: [ACTIVE_CHAIN.rpcUrl],
            blockExplorerUrls: [ACTIVE_CHAIN.explorer],
            nativeCurrency: ACTIVE_CHAIN.currency,
          }],
        });
      } else {
        throw err;
      }
    }
  }, [eth]);

  const value = useMemo(
    () => ({ address, chainId, connecting, connect, disconnect, switchToActiveChain }),
    [address, chainId, connecting, connect, disconnect, switchToActiveChain]
  );

  return <Web3Ctx.Provider value={value}>{children}</Web3Ctx.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Ctx);
  if (!ctx) throw new Error("useWeb3 must be used inside <Web3Provider>");
  return ctx;
}