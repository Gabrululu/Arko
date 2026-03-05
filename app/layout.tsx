import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WalletConnect } from "@/components/WalletConnect";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Arko — Web3 Documentation",
  description:
    "Documentation owned by you, verified by Ethereum. Built on Arkiv.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080810] text-slate-100 antialiased">
        <Providers>
          {/* ── Navigation ───────────────────────────────────────────── */}
          <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#080810]/90 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-5 h-13 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-white font-bold text-base tracking-tight flex items-center gap-2 py-3.5"
                >
                  <span className="text-indigo-400 text-lg">◈</span>
                  <span>Arko</span>
                </Link>
                <nav className="hidden sm:flex items-center gap-5 text-sm text-slate-500">
                  <Link href="/" className="hover:text-white transition-colors">
                    Explore
                  </Link>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </nav>
              </div>
              <WalletConnect />
            </div>
          </header>

          {/* ── Content ──────────────────────────────────────────────── */}
          <main className="max-w-5xl mx-auto px-5 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
