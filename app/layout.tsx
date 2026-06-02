import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ShutterReveal } from "@/components/ShutterReveal";
import { Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";
import { CommandPalette } from "@/components/CommandPalette";
import { AppShell } from "@/components/AppShell";

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
  description: "Sovereign documentation owned by you, verified by Ethereum. Built on Arkiv.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("wagmi_store")?.value || null;

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#fcfcfc] text-[#615050] antialiased font-sans"
      >
        <Providers cookie={cookie}>
          <CustomCursor />
          <CommandPalette />
          <ShutterReveal>
            <Navbar />
            <AppShell>{children}</AppShell>
          </ShutterReveal>
        </Providers>
      </body>
    </html>
  );
}
