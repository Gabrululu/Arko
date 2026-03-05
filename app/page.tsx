/**
 * Landing page — /
 *
 * Server Component. The hero section renders instantly; the public spaces grid
 * streams in via React Suspense while Arkiv is queried in the background.
 */

import { Suspense } from "react";
import Link from "next/link";
import { listPublicSpaces } from "@/lib/arkiv/spaces";
import { CreateSpaceButton } from "./CreateSpaceButton";

export const revalidate = 30;

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Async component: fetches spaces and renders the grid ─────────────────────

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
      <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm">
        {fetchError}
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
        <p className="text-slate-600 text-sm">No public spaces yet — be the first.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Public spaces
        </h2>
        <span className="text-xs text-slate-600">
          {spaces.length} space{spaces.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((space) => (
          <Link
            key={space.entityKey}
            href={`/docs/${space.slug}`}
            className="group flex flex-col p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-700/60 hover:bg-slate-800/60 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                {space.name}
              </h3>
              <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 text-xs bg-emerald-950 text-emerald-500 border border-emerald-800/60 rounded font-mono">
                public
              </span>
            </div>

            {space.description && (
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-3">
                {space.description}
              </p>
            )}

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs font-mono text-slate-600">
                /{space.slug}
              </span>
              <span className="text-xs font-mono text-slate-600" title={space.owner}>
                {truncate(space.owner)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

// ─── Skeleton: shown while SpacesGrid is loading ──────────────────────────────

function SpacesGridSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Public spaces
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-4 w-10 bg-slate-800 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-800 rounded mb-1.5" />
            <div className="h-3 w-3/4 bg-slate-800 rounded mb-4" />
            <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-800">
              <div className="h-3 w-16 bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="space-y-16">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="pt-12 pb-4 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Kaolin testnet · @arkiv-network/sdk v0.6
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          Documentation owned by you,<br />
          <span className="text-indigo-400">verified by Ethereum.</span>
        </h1>

        <p className="text-slate-400 max-w-lg mx-auto text-base leading-relaxed">
          Arko stores every doc version as an immutable entity on{" "}
          <span className="text-slate-300">Arkiv</span>. No databases. No servers.
          Every publish is permanently anchored to a block number.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <CreateSpaceButton />
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-sm text-slate-300 border border-slate-700 rounded-lg hover:border-slate-500 hover:text-white transition-colors"
          >
            My spaces
          </Link>
        </div>
      </div>

      {/* ── Public spaces — streams in while hero is already visible ───── */}
      <section>
        <Suspense fallback={<SpacesGridSkeleton />}>
          <SpacesGrid />
        </Suspense>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="border-t border-slate-800 pt-12 grid sm:grid-cols-3 gap-6">
        {[
          {
            label: "01",
            title: "Create a space",
            body: "Connect your wallet. Every space is owned by your address — no account needed.",
          },
          {
            label: "02",
            title: "Write and publish",
            body: "Each save creates a new immutable Arkiv entity. Old versions accumulate on-chain, forever.",
          },
          {
            label: "03",
            title: "Query any version",
            body: "Append ?atBlock=N to any doc URL to see exactly what it said at that block.",
          },
        ].map((step) => (
          <div key={step.label} className="space-y-2">
            <p className="text-xs font-mono text-indigo-500">{step.label}</p>
            <p className="font-semibold text-white text-sm">{step.title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
