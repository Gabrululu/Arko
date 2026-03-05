"use client";

/**
 * WalletConnect — connect/disconnect button in the nav bar.
 * Shows a Connect button when disconnected; connected address with a
 * dropdown to disconnect when connected.
 */

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useRef, useEffect } from "react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
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
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-mono rounded-lg transition-colors flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
        {short}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-slate-500 text-xs font-mono truncate">{address}</p>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
