"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listSpacesByOwner, type Space } from "@/lib/arkiv/spaces";
import { CreateSpaceButton } from "../CreateSpaceButton";

// ── Skeleton para estados de carga ───────────────────────────────────────────
function SpaceSkeleton() {
  return (
    <div className="p-5 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl space-y-3 animate-pulse">
      <div className="flex justify-between gap-2">
        <div className="h-4 w-32 bg-[#ede8dc] rounded" />
        <div className="h-4 w-12 bg-[#ede8dc] rounded" />
      </div>
      <div className="h-3 w-48 bg-[#ede8dc] rounded" />
      <div className="h-3 w-24 bg-[#ede8dc] rounded" />
      <div className="flex gap-2 pt-2">
        <div className="h-7 w-20 bg-[#ede8dc] rounded-lg" />
        <div className="h-7 w-20 bg-[#ede8dc] rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Efecto para manejar el montaje y evitar errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Efecto para cargar los espacios desde Arkiv (Kaolin RPC)
  useEffect(() => {
    if (!mounted || !address) return;

    const fetchSpaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSpacesByOwner(address);
        setSpaces(data);
      } catch (e) {
        console.error("Arkiv fetch error:", e);
        setError(e instanceof Error ? e.message : "Failed to reach Arkiv network.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [address, mounted]);

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="h-10 w-48 bg-[#ede8dc] animate-pulse rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <SpaceSkeleton />
          <SpaceSkeleton />
        </div>
      </div>
    );
  }

  // ── Caso: No conectado ─────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-12 h-12 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <h2 className="text-lg font-semibold text-[#615050] mb-1">Connect your wallet</h2>
        <p className="text-[#776a6a] text-sm max-w-xs">
          Your dashboard is tied to your wallet address. Connect to see your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-6 py-10">
      
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#615050]">My spaces</h1>
          <p 
            className="text-[#ad9a6f] text-xs font-mono mt-0.5" 
            suppressHydrationWarning 
          >
            {address}
          </p>
        </div>
        <CreateSpaceButton />
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Loading state ────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          <SpaceSkeleton />
          <SpaceSkeleton />
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && !error && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#d4c9b0] rounded-xl text-center">
          <p className="text-[#776a6a] text-sm">You don&apos;t own any spaces yet.</p>
          <p className="text-[#ad9a6f] text-xs mt-1">Click &ldquo;+ Create space&rdquo; above to get started.</p>
        </div>
      )}

      {/* ── Space cards ──────────────────────────────────────────────────── */}
      {!loading && spaces.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {spaces.map((space) => (
            <div
              key={space.entityKey}
              className="flex flex-col p-5 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl group hover:border-[#ad9a6f] transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-[#615050] leading-snug group-hover:text-[#ad9a6f] transition-colors">
                  {space.name}
                </h3>
                <span
                  className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 text-xs rounded font-mono border ${
                    space.visibility === "public"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-[#ede8dc] text-[#776a6a] border-[#d4c9b0]"
                  }`}
                >
                  {space.visibility}
                </span>
              </div>

              {space.description && (
                <p className="text-[#776a6a] text-xs leading-relaxed mb-3 line-clamp-2">
                  {space.description}
                </p>
              )}

              <p className="text-[#ad9a6f] text-xs font-mono mb-4">/docs/{space.slug}</p>

              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/${space.slug}`}
                  className="px-3 py-1.5 text-xs bg-[#615050] hover:bg-[#776a6a] text-white rounded-lg transition-colors font-medium"
                >
                  Manage
                </Link>
                <Link
                  href={`/dashboard/${space.slug}/new/edit`}
                  className="px-3 py-1.5 text-xs bg-[#ede8dc] hover:bg-[#e0d8c8] text-[#615050] rounded-lg transition-colors"
                >
                  + New doc
                </Link>
                <Link
                  href={`/docs/${space.slug}`}
                  className="px-3 py-1.5 text-xs text-[#776a6a] hover:text-[#615050] border border-[#d4c9b0] hover:border-[#c4b89a] rounded-lg transition-colors"
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