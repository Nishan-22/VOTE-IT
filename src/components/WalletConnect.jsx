import { useWeb3 } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { ACTIVE_CHAIN, explorerAddress } from "@/lib/ballot-contract";
import { Wallet, AlertTriangle, ExternalLink, Power } from "lucide-react";
import { toast } from "sonner";

function short(addr) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function WalletConnect({ compact = false }) {
  const { address, chainId, connecting, connect, disconnect, switchToActiveChain } = useWeb3();

  const wrongChain = address && chainId !== ACTIVE_CHAIN.id;

  if (!address) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        onClick={async () => {
          try { await connect(); }
          catch (e) { toast.error(e.message); }
        }}
        disabled={connecting}
        className="bg-gradient-neon text-primary-foreground neon-ring hover:opacity-90"
      >
        <Wallet className="h-4 w-4 mr-1.5" />
        {connecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  if (wrongChain) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        onClick={async () => {
          try { await switchToActiveChain(); }
          catch (e) { toast.error(e.message); }
        }}
        className="border-destructive/60 text-destructive hover:bg-destructive/10"
      >
        <AlertTriangle className="h-4 w-4 mr-1.5" />
        Switch to {ACTIVE_CHAIN.name}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={explorerAddress(address)}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-mono text-secondary hover:bg-secondary/20 transition"
        title={address}
      >
        <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
        {short(address)}
        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
      </a>
      {!compact && (
        <Button variant="ghost" size="icon" onClick={disconnect} title="Disconnect">
          <Power className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}