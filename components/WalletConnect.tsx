"use client";

/**
 * WalletConnect — connect/disconnect button in the nav bar.
 * Shows a Connect button when disconnected; connected address with a
 * dropdown to disconnect when connected.
 */

import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Render a stable placeholder until hydration is complete
  if (!mounted) {
    return (
      <button disabled className="px-4 py-1.5 bg-[#615050]/40 text-white/40 text-sm font-medium rounded-lg">
        Connect wallet
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="px-4 py-1.5 bg-[#615050] hover:bg-[#776a6a] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 bg-[#f5f1e8] hover:bg-[#ede8dc] border border-[#d4c9b0] text-[#615050] text-sm font-mono rounded-lg transition-colors flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
        {short}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#d4c9b0]">
            <p className="text-[#776a6a] text-xs font-mono truncate">{address}</p>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-[#ede8dc] transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
