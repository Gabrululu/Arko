import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ShutterReveal } from "@/components/ShutterReveal";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arko — Web3 Documentation",
  description:
    "Sovereign documentation owned by you, verified by Ethereum. Built on Arkiv.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {  
  const cookieStore = await cookies();
  const cookie = cookieStore.get("wagmi_store")?.value || null;

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      {/* suppressHydrationWarning en el body es vital para evitar errores por 
          extensiones de navegador que inyectan atributos (como las wallets) */}
      <body 
        suppressHydrationWarning 
        className="min-h-screen bg-[#fcfcfc] text-[#615050] antialiased font-sans transition-colors duration-300"
      >
        <Providers cookie={cookie}>
          <ShutterReveal>
            
            {/* ── Navigation ── */}
            <Navbar />

            {/* ── Content ── */}
            <main className="w-full min-h-[calc(100vh-64px)]">
              {children}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-[#d4c9b0]/30 bg-[#fcfcfc] mt-auto" suppressHydrationWarning>
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid sm:grid-cols-2 gap-12 mb-10">
                  <div className="space-y-4">
                    <p className="font-serif text-2xl italic text-[#615050]">arko</p>
                    <p className="text-sm text-[#776a6a] max-w-sm leading-relaxed">
                      Sovereign Documentation. Immutable History. 
                      Every version of your work is cryptographically committed to the Kaolin chain.
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
                      <a
                        href="https://kaolin.hoodi.arkiv.network"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors"
                        suppressHydrationWarning
                      >
                        Kaolin Explorer
                      </a>
                      <a
                        href="https://arkiv.network"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#776a6a] hover:text-[#615050] transition-colors"
                        suppressHydrationWarning
                      >
                        Arkiv Network
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#d4c9b0]/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#ad9a6f] uppercase tracking-widest">
                    <span className="w-1 h-1 rounded-full bg-[#ad9a6f] animate-pulse" />
                    Built on Arkiv · Kaolin Testnet
                  </div>
                  <p className="text-[10px] text-[#776a6a] uppercase tracking-widest font-medium">
                    © {new Date().getFullYear()} Arko Protocol · Open Source
                  </p>
                </div>
              </div>
            </footer>

          </ShutterReveal>
        </Providers>
      </body>
    </html>
  );
}