import { Suspense } from "react";
import Link from "next/link";
import { listPublicSpaces } from "@/lib/arkiv/spaces";
import { RevealSection } from "@/components/RevealSection";

export const revalidate = 30;

// ─── Styles & Constants ──────────────────────────────────────────────────────

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
    desc: "No database, no server, no vendor lock-in. Arko reads and writes directly to Arkiv on Kaolin testnet. There is nothing to go down.",
  },
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Connect your wallet",
    desc: "Your Ethereum address is your account. No sign-up, no email, no password.",
  },
  {
    num: "02",
    title: "Create a space",
    desc: "Name it, set visibility. The space entity is stored on Arkiv with a 365-day TTL.",
  },
  {
    num: "03",
    title: "Write and publish",
    desc: "Every version is a new on-chain entity. Permanent. Queryable by block number.",
  },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Public spaces grid ──────────────────────────────────────────────────────

async function SpacesGrid() {
  let spaces: Awaited<ReturnType<typeof listPublicSpaces>> = [];
  let fetchError: string | null = null;

  try {
    spaces = await listPublicSpaces();
  } catch (e) {
    fetchError = "Could not reach the Arkiv network. Check your connection.";
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
      <div className="text-center py-16 border border-dashed border-[#2a2318] rounded-xl">
        <p className="text-[#6a5f52] text-sm">No public spaces yet — be the first.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {spaces.map((space) => (
        <Link
          key={space.entityKey}
          href={`/docs/${space.slug}`}
          className="group flex flex-col p-5 bg-[#221a0e] border border-[#2a2318] rounded-xl hover:border-[#3a3220] transition-all"
          suppressHydrationWarning 
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-serif font-normal text-[#F5F0E8] group-hover:text-[#ad9a6f] transition-colors leading-snug">
              {space.name}
            </h3>
            <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 text-xs bg-emerald-950 text-emerald-500 border border-emerald-800/60 rounded font-mono">
              public
            </span>
          </div>

          {space.description && (
            <p className="text-[#9a8d80] text-sm leading-relaxed line-clamp-2 mb-3">
              {space.description}
            </p>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between border-t border-[#2a2318]">
            <span className="text-xs font-mono text-[#6a5f52]">/{space.slug}</span>
            <span className="text-xs font-mono text-[#6a5f52]" title={space.owner}>
              {truncate(space.owner)}
            </span>
          </div>

          <span className="mt-3 text-xs text-[#ad9a6f] group-hover:underline">
            Read docs →
          </span>
        </Link>
      ))}
    </div>
  );
}

function SpacesGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col p-5 bg-[#221a0e] border border-[#2a2318] rounded-xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="h-4 w-32 bg-[#2a2318] rounded" />
            <div className="h-4 w-10 bg-[#2a2318] rounded" />
          </div>
          <div className="h-3 w-full bg-[#2a2318] rounded mb-1.5" />
          <div className="h-3 w-3/4 bg-[#2a2318] rounded mb-4" />
          <div className="mt-auto pt-3 border-t border-[#2a2318]">
            <div className="h-3 w-16 bg-[#2a2318] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="w-full">
      
      {/* SECTION 1: HERO */}
      <section className="min-h-screen relative" style={{ backgroundColor: "#1f1303" }}>

        {/* SVG Wordmark — fills full viewport width, no clipping possible */}
        <div className="w-full select-none" style={{ lineHeight: 0, paddingTop: "clamp(4rem, 10vh, 9rem)" }}>
          <svg
            viewBox="0 0 1000 220"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block" }}
            aria-label="arko"
          >
            <defs>
              <pattern
                id="blind-stripes"
                patternUnits="userSpaceOnUse"
                width="1000"
                height="16"
              >
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
            <rect
              width="1000"
              height="220"
              fill="url(#blind-stripes)"
              clipPath="url(#arko-clip)"
            />
          </svg>
        </div>

        {/* Tagline + CTAs — bottom-left */}
        <div
          className="absolute"
          style={{
            bottom: "3rem",
            left: "clamp(1.5rem, 4vw, 4rem)",
            maxWidth: "min(44ch, 50vw)",
          }}
        >
          <h2
            className="not-italic font-sans font-light leading-tight"
            style={{
              color: "#fffcf6",
              fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
              letterSpacing: "-0.01em",
            }}
          >
            Sovereign Docs.<br />
            Immutable History.
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              href="/dashboard"
              style={{ backgroundColor: "#fffcf6", color: "#1f1303" }}
              className="px-7 py-3 text-xs tracking-widest uppercase font-bold hover:opacity-90 transition-opacity"
              suppressHydrationWarning
            >
              Start writing
            </Link>
            <a
              href="#public-spaces"
              style={{ borderColor: "rgba(255,252,246,0.3)", color: "#fffcf6" }}
              className="border px-7 py-3 text-xs tracking-widest uppercase hover:border-[#fffcf6]/60 transition-colors"
              suppressHydrationWarning
            >
              Browse spaces
            </a>
          </div>
        </div>

        {/* Network info — bottom-right */}
        <div
          className="absolute flex items-center gap-3"
          style={{ bottom: "3rem", right: "clamp(1.5rem, 4vw, 4rem)" }}
        >
          <div
            style={{
              width: "2.4rem",
              height: "2.4rem",
              borderRadius: "50%",
              backgroundColor: "rgba(255,252,246,0.08)",
              border: "1px solid rgba(255,252,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fffcf6", fontSize: "0.7rem" }}>↗</span>
          </div>
          <p
            className="font-mono text-[0.7rem] leading-snug"
            style={{ color: "rgba(255,252,246,0.55)", maxWidth: "16ch" }}
          >
            Built on Arkiv · Kaolin testnet · Open source
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <span className="text-xs tracking-[0.3em] animate-bounce" style={{ color: "rgba(255,252,246,0.2)" }}>↓</span>
        </div>
      </section>

      {/* SECTION 2: WHY ARKO */}
      <section className="bg-[#1a1508] py-24 md:py-32 border-t border-[#2a2318]">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#6a5f52] text-xs tracking-widest uppercase mb-3">Why Arko</p>
            <h2 className="text-[#F5F0E8] font-serif font-normal mb-16 leading-snug text-[clamp(28px,4vw,52px)]">
              We do things differently, by design.
            </h2>
          </RevealSection>

          <div className="divide-y divide-[#2a2318]">
            {WHY_ARKO_ITEMS.map((item, i) => (
              <RevealSection key={item.num} delay={i * 0.05}>
                <div className="py-8 grid grid-cols-[48px_1fr] md:grid-cols-[80px_220px_1fr] gap-6 items-start">
                  <span className="text-[#6a5f52] text-sm font-mono pt-0.5">{item.num}</span>
                  <h3 className="text-[#F5F0E8] font-serif text-xl font-normal">{item.title}</h3>
                  <p className="text-[#9a8d80] text-sm leading-relaxed md:max-w-lg">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PROCESS */}
      <section className="bg-[#f5f1e8] py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#ad9a6f] text-xs tracking-widest uppercase mb-3">Process</p>
            <h2 className="text-[#615050] font-serif font-normal mb-16 leading-snug text-[clamp(28px,4vw,52px)]">
              Three steps. No servers.
            </h2>
          </RevealSection>

          <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#d4c9b0]">
            {PROCESS_STEPS.map((step, i) => (
              <RevealSection
                key={step.num}
                delay={i * 0.1}
                className="px-0 sm:px-8 first:pl-0 last:pr-0 py-8 sm:py-0"
              >
                <span className="block text-xs font-mono text-[#ad9a6f] mb-4">{step.num}</span>
                <h3 className="font-serif text-xl text-[#615050] mb-3 font-normal">{step.title}</h3>
                <p className="text-sm text-[#776a6a] leading-relaxed">{step.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: COMPARISON */}
      <section className="bg-[#fcfcfc] py-24 md:py-32 border-y border-[#d4c9b0]">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#ad9a6f] text-xs tracking-widest uppercase mb-3">Comparison</p>
            <h2 className="text-[#615050] font-serif font-normal mb-4 leading-snug text-[clamp(28px,4vw,52px)]">
              Fully on-chain. Best in class.
            </h2>
            <p className="text-[#776a6a] text-lg mb-12">
              How Arko compares to centralized documentation platforms.
            </p>
          </RevealSection>

          <RevealSection>
            <div className="overflow-x-auto rounded-lg border border-[#d4c9b0]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-4 px-5 text-[#776a6a] font-normal text-xs tracking-widest uppercase border-b border-[#d4c9b0] w-1/2">
                      Feature
                    </th>
                    <th className="py-4 px-5 text-center bg-[#615050] text-white font-normal text-sm tracking-wide border-b border-[#615050]">
                      Arko
                    </th>
                    <th className="py-4 px-5 text-center text-[#776a6a] font-normal text-xs tracking-widest uppercase border-b border-[#d4c9b0]">
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
                  ].map((row) => (
                    <tr key={row.f} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5 text-[#615050] border-b border-[#f0ebe0] font-medium">
                        {row.f}
                      </td>
                      <td className="py-4 px-5 text-center text-emerald-700 font-bold border-b border-[#f0ebe0] bg-emerald-50/30">
                        {row.a}
                      </td>
                      <td className="py-4 px-5 text-center text-[#776a6a] border-b border-[#f0ebe0]">
                        {row.t}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* SECTION 5: PUBLIC SPACES */}
      <section id="public-spaces" className="bg-[#1a1508] py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <p className="text-[#6a5f52] text-xs tracking-widest uppercase mb-3">Community</p>
            <h2 className="text-[#F5F0E8] font-serif font-normal mb-4 leading-snug text-[clamp(28px,4vw,52px)]">
              Built in the open.
            </h2>
            <p className="text-[#9a8d80] text-lg mb-12">
              Browse documentation spaces published by the community.
            </p>
          </RevealSection>

          <Suspense fallback={<SpacesGridSkeleton />}>
            <SpacesGrid />
          </Suspense>
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section className="bg-[#f5f1e8] py-24 md:py-32 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <h2 className="font-serif font-normal text-[#615050] mb-6 leading-tight text-[clamp(40px,6vw,96px)]">
              Start building.
            </h2>
            <p className="text-[#776a6a] text-lg mb-10">
              Connect your wallet. Create a space. Own your docs.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-[#615050] text-white px-10 py-4 text-sm tracking-widest uppercase hover:bg-[#4a3d3d] transition-colors shadow-xl"
              suppressHydrationWarning
            >
              Open dashboard →
            </Link>
          </RevealSection>
        </div>
      </section>

    </div>
  );
}