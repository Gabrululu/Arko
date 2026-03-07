"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useDisconnect, useConnect } from "wagmi";
import Link from "next/link";
import { CreateSpaceButton } from "../app/CreateSpaceButton";
import { ChevronDown, Wallet, LogOut, ExternalLink } from "lucide-react";
import { kaolin } from "@arkiv-network/sdk/chains";

const KAOLIN_ID = kaolin.id;

export function Navbar() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending, error } = useConnect();
  
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Evitar parpadeo de hidratación (Hydration Mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  const isWrongNetwork = chainId !== KAOLIN_ID;

  const handleConnect = () => {
    console.log('Available connectors:', connectors);
    console.log('Has window.ethereum:', hasWallet);
    
    // Solo usar injected connector
    const injectedConnector = connectors.find(c => c.id === 'injected');
    
    console.log('Injected connector:', injectedConnector);
    
    if (injectedConnector) {
      console.log('Connecting with injected');
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      console.log('Connecting with first available connector');
      connect({ connector: connectors[0] });
    } else {
      console.log('No connectors available');
    }
  };

  if (!mounted) {
    return (
      <nav className="h-16 border-b border-[#d4c9b0]/30 bg-[#fcfcfc] w-full" />
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hasWallet = mounted && typeof window !== 'undefined' && 
    ((window as any).ethereum || (window as any).phantom || (window as any).solana || 
     (window as any).web3 || (window as any).BitKeep || (window as any).okxwallet);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const hasConnectors = connectors.length > 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#d4c9b0]/30 bg-[#fcfcfc]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl italic font-bold text-[#615050] tracking-tighter">
            arko
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#776a6a] hover:text-[#615050] transition-colors">
              Dashboard
            </Link>
            <a 
              href="https://kaolin.hoodi.arkiv.network" 
              target="_blank" 
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[#ad9a6f] hover:text-[#615050] transition-colors"
            >
              Explorer <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Acciones Web3 */}
        <div className="flex items-center gap-4">
          
          {/* Alerta de Red Incorrecta */}
          {isWrongNetwork && (
            <button 
              onClick={() => switchChain?.({ chainId: KAOLIN_ID })}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-widest animate-pulse hover:bg-amber-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Switch to Kaolin
            </button>
          )}

          {isConnected ? (
            <div className="flex items-center gap-3">
              <CreateSpaceButton />
              
              {/* Wallet Dropdown Simulado */}
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] hover:border-[#ad9a6f] transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ad9a6f] to-[#615050]" />
                  <span className="text-[11px] font-mono text-[#615050]">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <ChevronDown size={12} className={`text-[#ad9a6f] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#d4c9b0] bg-[#fcfcfc] p-2 shadow-xl animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-[#f5f1e8] mb-1">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#ad9a6f]">Network</p>
                        <p className="text-[11px] font-medium text-[#615050]">Kaolin Testnet</p>
                      </div>
                      <button 
                        onClick={() => disconnect()}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={14} /> Disconnect
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  {error.message}
                </div>
              )}
              {!hasWallet && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Install MetaMask, Coinbase Wallet, or another Web3 wallet to connect
                </div>
              )}
              <button 
                onClick={handleConnect}
                disabled={isPending || !hasConnectors}
                className="btn-primary flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold disabled:opacity-50"
              >
                <Wallet size={14} /> 
                {isPending ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta Mobile para Red */}
      {isWrongNetwork && (
        <div 
          onClick={() => switchChain?.({ chainId: KAOLIN_ID })}
          className="lg:hidden w-full bg-amber-500 text-white text-[9px] font-bold py-1 text-center uppercase tracking-[0.2em] cursor-pointer"
        >
          Warning: Switch to Kaolin Testnet
        </div>
      )}
    </nav>
  );
}