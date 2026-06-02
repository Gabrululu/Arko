"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useChainId, useSwitchChain, useDisconnect, useConnect } from "wagmi";
import Link from "next/link";
import { CreateSpaceButton } from "../app/CreateSpaceButton";
import { ChevronDown, Wallet, LogOut, ExternalLink } from "lucide-react";
import { braga } from "@/lib/chains";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BRAGA_ID = braga.id;

export function Navbar() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending, error } = useConnect();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll shrink effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navbar entrance animation
  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.1 }
    );
  }, []);

  const isWrongNetwork = chainId !== BRAGA_ID;

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) connect({ connector: injectedConnector });
    else if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hasWallet =
    mounted &&
    typeof window !== "undefined" &&
    ((window as any).ethereum ||
      (window as any).phantom ||
      (window as any).solana ||
      (window as any).web3 ||
      (window as any).BitKeep ||
      (window as any).okxwallet);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const hasConnectors = connectors.length > 0;

  if (!mounted) {
    return <nav className="h-16 border-b border-[#d4c9b0]/20 bg-transparent w-full" />;
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "border-b border-[#d4c9b0]/20 bg-[#fcfcfc]/90 backdrop-blur-xl shadow-sm h-13"
            : "border-b border-transparent bg-transparent h-16"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 ${
            scrolled ? "h-13 py-2" : "h-16"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className={`font-serif text-2xl italic font-bold tracking-tighter transition-colors duration-300 ${
                scrolled ? "text-[#615050]" : "text-[#615050]"
              }`}
            >
              arko
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#776a6a] hover:text-[#615050] transition-colors"
              >
                Dashboard
              </Link>
              <a
                href="https://braga.hoodi.arkiv.network"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-bold text-[#ad9a6f] hover:text-[#615050] transition-colors"
              >
                Explorer <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Wrong network alert */}
            {isWrongNetwork && isConnected && (
              <button
                onClick={() => switchChain?.({ chainId: BRAGA_ID })}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200
                           text-amber-700 text-[9px] font-bold uppercase tracking-widest
                           hover:bg-amber-100 transition-colors animate-pulse"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Switch to Braga
              </button>
            )}

            {isConnected ? (
              <div className="flex items-center gap-3">
                <CreateSpaceButton />

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0]
                               hover:border-[#ad9a6f] transition-all duration-200"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ad9a6f] to-[#615050]" />
                    <span className="text-[11px] font-mono text-[#615050]">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-[#ad9a6f] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#d4c9b0] bg-[#fcfcfc] p-2 shadow-xl
                                      animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2.5 border-b border-[#f5f1e8] mb-1">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-[#ad9a6f]">Network</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[11px] font-medium text-[#615050]">Braga Testnet</p>
                          </div>
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
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error.message}</div>
                )}
                {!hasWallet && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded hidden lg:block">
                    Install MetaMask or another Web3 wallet
                  </div>
                )}
                <button
                  onClick={handleConnect}
                  disabled={isPending || !hasConnectors}
                  className="btn-primary flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold disabled:opacity-50
                             hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                >
                  <Wallet size={14} />
                  {isPending ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile wrong network bar */}
        {isWrongNetwork && isConnected && (
          <div
            onClick={() => switchChain?.({ chainId: BRAGA_ID })}
            className="lg:hidden w-full bg-amber-500 text-white text-[9px] font-bold py-1 text-center uppercase tracking-[0.2em] cursor-pointer"
          >
            Switch to Braga Testnet
          </div>
        )}
      </nav>
    </>
  );
}
