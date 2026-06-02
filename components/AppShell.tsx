"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import Link from "next/link";

const HIDE_SIDEBAR_PATHS = ["/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const showSidebar = !HIDE_SIDEBAR_PATHS.includes(pathname);

  if (!showSidebar) {
    return (
      <>
        <main className="w-full">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 transition-all duration-300 ${collapsed ? "pl-10" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#d4c9b0]/30 bg-[#fcfcfc]" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 gap-12 mb-10">
          <div className="space-y-4">
            <p className="font-serif text-2xl italic text-[#615050]">arko</p>
            <p className="text-sm text-[#776a6a] max-w-sm leading-relaxed">
              Sovereign Documentation. Immutable History. Every version of your work is
              cryptographically committed to the Braga chain.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4 sm:justify-end items-start">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ad9a6f] mb-2">Platform</p>
              <Link href="/" className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors" suppressHydrationWarning>Explore</Link>
              <Link href="/dashboard" className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors" suppressHydrationWarning>Dashboard</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#ad9a6f] mb-2">Network</p>
              <a href="https://explorer.braga.hoodi.arkiv.network" target="_blank" rel="noopener noreferrer" className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors" suppressHydrationWarning>Braga Explorer</a>
              <a href="https://arkiv.network" target="_blank" rel="noopener noreferrer" className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors" suppressHydrationWarning>Arkiv Network</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#d4c9b0]/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#ad9a6f] uppercase tracking-widest">
            <span className="w-1 h-1 rounded-full bg-[#ad9a6f] animate-pulse" />
            Built on Arkiv · Braga Testnet
          </div>
          <p className="text-[10px] text-[#776a6a] uppercase tracking-widest font-medium">
            © {new Date().getFullYear()} Arko Protocol · Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
