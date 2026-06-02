import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { listPublicSpaces } from "@/lib/arkiv/spaces";
import { RevealSection } from "@/components/RevealSection";
import { AnimatedCounter } from "@/components/AnimatedCounter";

export const revalidate = 30;

const HeroCanvas = dynamic(
  () => import("@/components/HeroCanvas").then((m) => m.HeroCanvas),
  { ssr: false }
);

// ─── Constants ───────────────────────────────────────────────────────────────

const WHY_ARKO_ITEMS = [
  {
    num: "01",
    title: "You Own Your Data",
    desc: "Your wallet is your identity. No account to delete, no platform to shut down, no terms of service to change. Your address is the only key that matters.",
  },
  {
    num: "02",
    title: "Immutable Version History",
    desc: "Every save creates a new on-chain entity. Old versions are never overwritten — they accumulate on Arkiv and remain queryable forever.",
  },
  {
    num: "03",
    title: "Point-in-Time Proof",
    desc: "Prove what your docs said at block #21504823. The validAtBlock() query makes this possible. Impossible on any centralized platform.",
  },
  {
    num: "04",
    title: "Zero Backend",
    desc: "No database, no server, no vendor lock-in. Arko reads and writes directly to Arkiv on Braga testnet. There is nothing to go down.",
  },
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Connect your wallet",
    desc: "Your Ethereum address is your account. No sign-up, no email, no password.",
    icon: "◎",
  },
  {
    num: "02",
    title: "Create a space",
    desc: "Name it, set visibility. The space entity is stored on Arkiv with a 365-day expiration.",
    icon: "◻",
  },
  {
    num: "03",
    title: "Write and publish",
    desc: "Every version is a new on-chain entity. Permanent. Queryable by block number.",
    icon: "◈",
  },
];

const STATS = [
  { value: "0", label: "Backend servers" },
  { value: "365+", label: "Days of storage" },
  { value: "100%", label: "On-chain" },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Spaces grid ─────────────────────────────────────────────────────────────

async function SpacesGrid() {
  let spaces: Awaited<ReturnType<typeof listPublicSpaces>> = [];
  let fetchError: string | null = null;
  try {
    spaces = await listPublicSpaces();
  } catch (e) {
    fetchError = "Could not reach the Arkiv network.";
    console.error(e);
  }

  if (fetchError) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-lg text-red-400 text-sm">
        {fetchError}
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-[#2a2318] rounded-2xl">
        <p className="text-[#6a5f52] text-sm font-mono">— No public spaces yet. Be the first. —</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {spaces.map((space) => (
        <Link
          key={space.entityKey}
          href={`/docs/${space.slug}`}
          className="group relative flex flex-col p-6 bg-[#1c1507] border border-[#2a2318] rounded-2xl overflow-hidden
                     hover:border-[#ad9a6f]/40 transition-all duration-500
                     before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#ad9a6f]/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
          suppressHydrationWarning
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-serif font-normal text-[#F5F0E8] group-hover:text-[#ad9a6f] transition-colors duration-300 leading-snug text-lg">
                {space.name}
              </h3>
              <span className="flex-shrink-0 mt-1 px-2 py-0.5 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 rounded-full font-mono tracking-widest uppercase">
                live
              </span>
            </div>

            {space.description && (
              <p className="text-[#7a6f62] text-sm leading-relaxed line-clamp-2 mb-4">
                {space.description}
              </p>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#2a2318]/60">
              <span className="text-xs font-mono text-[#8a7a6a]">/{space.slug}</span>
              <span className="text-xs font-mono text-[#8a7a6a]" title={space.owner}>
                {truncate(space.owner)}
              </span>
            </div>

            <span className="inline-block mt-3 text-xs text-[#ad9a6f] font-medium group-hover:translate-x-1 transition-transform duration-300">
              Read docs →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SpacesGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col p-6 bg-[#1c1507] border border-[#2a2318] rounded-2xl h-44">
          <div className="h-5 w-36 bg-[#2a2318] rounded mb-3" />
          <div className="h-3 w-full bg-[#2a2318] rounded mb-2" />
          <div className="h-3 w-3/4 bg-[#2a2318] rounded mb-auto" />
          <div className="mt-4 pt-4 border-t border-[#2a2318]">
            <div className="h-3 w-20 bg-[#2a2318] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="w-full">

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────────── */}
      <section className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#1f1303" }}>

        {/* Three.js canvas */}
        <HeroCanvas />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Radial glow center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(173,154,111,0.08) 0%, transparent 70%)",
          }}
        />

        {/* SVG Wordmark */}
        <div
          className="w-full select-none relative z-10"
          style={{ lineHeight: 0, paddingTop: "clamp(4rem, 10vh, 9rem)" }}
        >
          <svg
            viewBox="0 0 1000 220"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
            aria-label="arko"
          >
            <defs>
              <pattern id="blind-stripes" patternUnits="userSpaceOnUse" width="1000" height="16">
                <rect width="1000" height="8" fill="#fffcf6" />
                <rect y="8" width="1000" height="8" fill="#1f1303" />
              </pattern>
              <clipPath id="arko-clip">
                <text
                  x="0"
                  y="200"
                  style={{
                    fontFamily: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
                    fontWeight: 900,
                    fontSize: "220px",
                    letterSpacing: "-8px",
                  }}
                >
                  arko
                </text>
              </clipPath>
            </defs>
            <rect width="1000" height="220" fill="url(#blind-stripes)" clipPath="url(#arko-clip)" />
          </svg>
        </div>

        {/* Tagline + CTAs */}
        <div
          className="absolute z-10"
          style={{
            bottom: "3.5rem",
            left: "clamp(1.5rem, 4vw, 4rem)",
            maxWidth: "min(44ch, 52vw)",
          }}
        >
          <p className="text-[#9a8870] text-[10px] tracking-[0.3em] uppercase font-mono mb-3">
            Sovereign documentation
          </p>
          <h2
            className="not-italic font-sans font-light leading-[1.1]"
            style={{ color: "#fffcf6", fontSize: "clamp(1.7rem, 3.5vw, 3.2rem)", letterSpacing: "-0.02em" }}
          >
            Own your words.<br />
            <span style={{ color: "rgba(255,252,246,0.45)" }}>Forever.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <Link
              href="/dashboard"
              style={{ backgroundColor: "#fffcf6", color: "#1f1303" }}
              className="relative overflow-hidden group px-8 py-3.5 text-[10px] tracking-[0.2em] uppercase font-bold transition-all duration-300
                         hover:shadow-[0_0_30px_rgba(255,252,246,0.2)]"
              suppressHydrationWarning
            >
              <span className="relative z-10">Start writing</span>
              <span className="absolute inset-0 bg-[#ad9a6f] translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            </Link>
            <a
              href="#public-spaces"
              style={{ borderColor: "rgba(255,252,246,0.2)", color: "rgba(255,252,246,0.7)" }}
              className="border px-8 py-3.5 text-[10px] tracking-[0.2em] uppercase hover:border-[#fffcf6]/50 hover:text-[#fffcf6] transition-all duration-300"
              suppressHydrationWarning
            >
              Browse spaces
            </a>
          </div>
        </div>

        {/* Network badge — bottom right */}
        <div
          className="absolute z-10 flex items-center gap-2.5"
          style={{ bottom: "3.5rem", right: "clamp(1.5rem, 4vw, 4rem)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="font-mono text-[0.65rem] leading-snug" style={{ color: "rgba(255,252,246,0.4)" }}>
            Braga testnet · live
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-1 animate-bounce">
            <span className="block w-px h-8 bg-gradient-to-b from-transparent to-[rgba(255,252,246,0.2)]" />
            <span className="text-[10px] tracking-[0.3em]" style={{ color: "rgba(255,252,246,0.2)" }}>scroll</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: STATS ─────────────────────────────────────────────────── */}
      <section className="bg-[#171005] border-y border-[#2a2318] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 divide-x divide-[#2a2318]">
            {STATS.map((s) => (
              <RevealSection key={s.label}>
                <AnimatedCounter value={s.value} label={s.label} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: WHY ARKO ──────────────────────────────────────────────── */}
      <section className="bg-[#1a1508] py-28 md:py-36 border-b border-[#2a2318]">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#6a5f52] text-[10px] tracking-[0.3em] uppercase font-mono mb-4">Why Arko</p>
            <h2 className="text-[#F5F0E8] font-serif font-normal mb-20 leading-[1.1] text-[clamp(28px,4vw,56px)]">
              We do things differently,<br />by design.
            </h2>
          </RevealSection>

          <div className="divide-y divide-[#2a2318]">
            {WHY_ARKO_ITEMS.map((item, i) => (
              <RevealSection key={item.num} delay={i * 0.04}>
                <div className="group py-9 grid grid-cols-[48px_1fr] md:grid-cols-[80px_240px_1fr] gap-6 items-center cursor-default">
                  <span className="text-[#6a5f52] text-sm font-mono group-hover:text-[#9a8870] transition-colors duration-300">
                    {item.num}
                  </span>
                  <h3 className="text-[#F5F0E8] font-serif text-xl font-normal group-hover:text-[#ad9a6f] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-[#7a6f62] text-sm leading-relaxed md:max-w-lg group-hover:text-[#9a8d80] transition-colors duration-300">
                    {item.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: PROCESS ───────────────────────────────────────────────── */}
      <section className="bg-[#f5f1e8] py-28 md:py-36">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#ad9a6f] text-[10px] tracking-[0.3em] uppercase font-mono mb-4">Process</p>
            <h2 className="text-[#615050] font-serif font-normal mb-20 leading-[1.1] text-[clamp(28px,4vw,56px)]">
              Three steps.<br />No servers.
            </h2>
          </RevealSection>

          <div className="grid sm:grid-cols-3 gap-px bg-[#d4c9b0]">
            {PROCESS_STEPS.map((step, i) => (
              <RevealSection key={step.num} delay={i * 0.08}>
                <div className="group bg-[#f5f1e8] p-10 flex flex-col gap-6 h-full hover:bg-[#ede8dc] transition-colors duration-500">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl text-[#b0a080] group-hover:text-[#ad9a6f] transition-colors duration-500">
                      {step.icon}
                    </span>
                    <span className="text-[10px] font-mono text-[#8a7a6a] tracking-widest">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#615050] mb-3 font-normal">{step.title}</h3>
                    <p className="text-sm text-[#776a6a] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: COMPARISON ────────────────────────────────────────────── */}
      <section className="bg-[#fcfcfc] py-28 md:py-36 border-y border-[#d4c9b0]">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#ad9a6f] text-[10px] tracking-[0.3em] uppercase font-mono mb-4">Comparison</p>
            <h2 className="text-[#615050] font-serif font-normal mb-4 leading-[1.1] text-[clamp(28px,4vw,56px)]">
              Fully on-chain.
            </h2>
            <p className="text-[#776a6a] text-lg mb-14 max-w-xl">
              How Arko compares to centralized documentation platforms.
            </p>
          </RevealSection>

          <RevealSection>
            <div className="overflow-x-auto rounded-2xl border border-[#e0d9cc] shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-5 px-6 text-[#776a6a] font-normal text-[10px] tracking-[0.2em] uppercase border-b border-[#e0d9cc] w-2/5 bg-[#faf7f2]">
                      Feature
                    </th>
                    <th className="py-5 px-6 text-center bg-[#615050] text-white font-normal text-sm tracking-wide border-b border-[#615050]">
                      Arko
                    </th>
                    <th className="py-5 px-6 text-center text-[#776a6a] font-normal text-[10px] tracking-[0.2em] uppercase border-b border-[#e0d9cc] bg-[#faf7f2]">
                      GitBook / Notion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { f: "Data ownership", a: "Wallet-controlled", t: "Platform-controlled" },
                    { f: "Version history", a: "Immutable, on-chain", t: "Editable, deletable" },
                    { f: "Point-in-time proof", a: "validAtBlock() ✓", t: "Not possible" },
                    { f: "Account required", a: "Wallet only", t: "Email + password" },
                    { f: "Backend infrastructure", a: "None", t: "Servers + databases" },
                  ].map((row, i) => (
                    <tr
                      key={row.f}
                      className="group hover:bg-[#faf7f2] transition-colors duration-200"
                      style={{ borderBottom: i < 4 ? "1px solid #f0ebe0" : "none" }}
                    >
                      <td className="py-4 px-6 text-[#615050] font-medium text-sm">{row.f}</td>
                      <td className="py-4 px-6 text-center bg-emerald-50/50 group-hover:bg-emerald-50 transition-colors">
                        <span className="text-emerald-700 font-semibold text-sm">{row.a}</span>
                      </td>
                      <td className="py-4 px-6 text-center text-[#776a6a] text-sm">{row.t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── SECTION 6: PUBLIC SPACES ─────────────────────────────────────────── */}
      <section id="public-spaces" className="bg-[#1a1508] py-28 md:py-36">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
              <div>
                <p className="text-[#9a8870] text-[10px] tracking-[0.3em] uppercase font-mono mb-4">Community</p>
                <h2 className="text-[#F5F0E8] font-serif font-normal leading-[1.1] text-[clamp(28px,4vw,56px)]">
                  Built in the open.
                </h2>
              </div>
              <p className="text-[#9a8870] text-sm max-w-xs leading-relaxed">
                Browse documentation spaces published by the community on Arkiv.
              </p>
            </div>
          </RevealSection>

          <Suspense fallback={<SpacesGridSkeleton />}>
            <SpacesGrid />
          </Suspense>
        </div>
      </section>

      {/* ── SECTION 7: CTA ───────────────────────────────────────────────────── */}
      <section className="relative bg-[#1f1303] py-36 md:py-48 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(173,154,111,0.1) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <RevealSection from="clip">
            <p className="text-[#9a8870] text-[10px] tracking-[0.4em] uppercase font-mono mb-8">Ready?</p>
            <h2
              className="font-serif font-normal text-[#F5F0E8] leading-[0.95] mb-10"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
            >
              Start building.
            </h2>
          </RevealSection>
          <RevealSection delay={0.15}>
            <p className="text-[#9a8870] text-base mb-12 max-w-md mx-auto leading-relaxed">
              Connect your wallet. Create a space. Own your docs. No sign-up required.
            </p>
            <Link
              href="/dashboard"
              className="relative inline-flex items-center gap-3 overflow-hidden group
                         border border-[#fffcf6]/20 text-[#fffcf6] px-10 py-4
                         text-[10px] tracking-[0.25em] uppercase font-bold
                         hover:border-[#fffcf6]/60 transition-all duration-500
                         hover:shadow-[0_0_60px_rgba(255,252,246,0.08)]"
              suppressHydrationWarning
            >
              <span className="relative z-10">Open dashboard</span>
              <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">→</span>
              <span className="absolute inset-0 bg-[#fffcf6]/5 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-400 ease-out" />
            </Link>
          </RevealSection>
        </div>
      </section>

    </div>
  );
}
