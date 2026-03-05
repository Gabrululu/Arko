"use client";

/**
 * Dashboard — /dashboard
 *
 * Wallet-gated. Lists spaces owned by the connected address and provides
 * a "New space" entry point via CreateSpaceButton.
 */

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listSpacesByOwner, type Space } from "@/lib/arkiv/spaces";
import { CreateSpaceButton } from "../CreateSpaceButton";

// ── Skeleton for loading state ───────────────────────────────────────────────
function SpaceSkeleton() {
  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-pulse">
      <div className="flex justify-between gap-2">
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-4 w-12 bg-slate-800 rounded" />
      </div>
      <div className="h-3 w-48 bg-slate-800 rounded" />
      <div className="h-3 w-24 bg-slate-800 rounded" />
      <div className="flex gap-2 pt-2">
        <div className="h-7 w-20 bg-slate-800 rounded-lg" />
        <div className="h-7 w-20 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    listSpacesByOwner(address)
      .then(setSpaces)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load spaces."))
      .finally(() => setLoading(false));
  }, [address]);

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Connect your wallet</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Your dashboard is tied to your wallet address. Connect to see your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">My spaces</h1>
          <p className="text-slate-600 text-xs font-mono mt-0.5">{address}</p>
        </div>
        <CreateSpaceButton />
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          <SpaceSkeleton />
          <SpaceSkeleton />
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!loading && !error && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-xl text-center">
          <p className="text-slate-600 text-sm">You don&apos;t own any spaces yet.</p>
          <p className="text-slate-700 text-xs mt-1">Click &ldquo;+ Create space&rdquo; above to get started.</p>
        </div>
      )}

      {/* ── Space cards ──────────────────────────────────────────────────── */}
      {!loading && spaces.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {spaces.map((space) => (
            <div
              key={space.entityKey}
              className="flex flex-col p-5 bg-slate-900 border border-slate-800 rounded-xl"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-white leading-snug">{space.name}</h3>
                <span
                  className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 text-xs rounded font-mono border ${
                    space.visibility === "public"
                      ? "bg-emerald-950 text-emerald-500 border-emerald-800/60"
                      : "bg-slate-800 text-slate-500 border-slate-700"
                  }`}
                >
                  {space.visibility}
                </span>
              </div>

              {space.description && (
                <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
                  {space.description}
                </p>
              )}

              <p className="text-slate-700 text-xs font-mono mb-4">/docs/{space.slug}</p>

              {/* Actions */}
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/${space.slug}`}
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
                >
                  Manage
                </Link>
                <Link
                  href={`/dashboard/${space.slug}/new/edit`}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  + New doc
                </Link>
                <Link
                  href={`/docs/${space.slug}`}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                >
                  Public view ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
