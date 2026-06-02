"use client";

import { useAccount } from "wagmi";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listSpacesByOwner, type Space } from "@/lib/arkiv/spaces";
import { CreateSpaceButton } from "../CreateSpaceButton";
import { gsap } from "gsap";

function SpaceSkeleton() {
  return (
    <div className="p-6 bg-[#f5f1e8] border border-[#d4c9b0] rounded-2xl space-y-4 animate-pulse">
      <div className="flex justify-between gap-2">
        <div className="h-4 w-32 bg-[#ede8dc] rounded-full" />
        <div className="h-4 w-14 bg-[#ede8dc] rounded-full" />
      </div>
      <div className="h-3 w-48 bg-[#ede8dc] rounded-full" />
      <div className="h-3 w-24 bg-[#ede8dc] rounded-full" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 bg-[#ede8dc] rounded-xl" />
        <div className="h-8 w-20 bg-[#ede8dc] rounded-xl" />
      </div>
    </div>
  );
}

function SpaceCard({ space, index }: { space: Space; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 24, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: index * 0.08,
        ease: "power3.out",
      }
    );
  }, [index]);

  const handleHoverEnter = () => {
    gsap.to(cardRef.current, { y: -4, duration: 0.3, ease: "power2.out" });
  };
  const handleHoverLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.4, ease: "power2.out" });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleHoverLeave}
      className="relative flex flex-col p-6 bg-[#f5f1e8] border border-[#d4c9b0] rounded-2xl
                 group cursor-default will-change-transform
                 hover:border-[#ad9a6f]/60 hover:shadow-[0_12px_40px_rgba(97,80,80,0.08)]
                 transition-[border-color,box-shadow] duration-300"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ad9a6f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-[#615050] leading-snug group-hover:text-[#4a3d3d] transition-colors duration-200 text-base">
          {space.name}
        </h3>
        <span
          className={`flex-shrink-0 mt-0.5 px-2 py-0.5 text-[10px] rounded-full font-mono tracking-widest uppercase border ${
            space.visibility === "public"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-[#ede8dc] text-[#776a6a] border-[#d4c9b0]"
          }`}
        >
          {space.visibility}
        </span>
      </div>

      {space.description && (
        <p className="text-[#776a6a] text-xs leading-relaxed mb-3 line-clamp-2">{space.description}</p>
      )}

      <p className="text-[#ad9a6f] text-[11px] font-mono mb-5">/docs/{space.slug}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/dashboard/${space.slug}`}
          className="px-4 py-2 text-[11px] bg-[#615050] hover:bg-[#4a3d3d] text-white rounded-xl
                     transition-all duration-200 font-medium hover:shadow-md active:scale-[0.97]"
        >
          Manage
        </Link>
        <Link
          href={`/dashboard/${space.slug}/new/edit`}
          className="px-4 py-2 text-[11px] bg-[#ede8dc] hover:bg-[#e0d8c8] text-[#615050] rounded-xl
                     transition-all duration-200 hover:shadow-sm active:scale-[0.97]"
        >
          + New doc
        </Link>
        <Link
          href={`/docs/${space.slug}`}
          className="px-4 py-2 text-[11px] text-[#776a6a] hover:text-[#615050] border border-[#d4c9b0]
                     hover:border-[#c4b89a] rounded-xl transition-all duration-200 active:scale-[0.97]"
        >
          View ↗
        </Link>
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
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !address) return;
    setLoading(true);
    setError(null);
    listSpacesByOwner(address)
      .then(setSpaces)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to reach Arkiv network."))
      .finally(() => setLoading(false));
  }, [address, mounted]);

  // Header entrance
  useEffect(() => {
    if (!headerRef.current || !mounted) return;
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="h-10 w-48 bg-[#ede8dc] animate-pulse rounded-full" />
        <div className="grid sm:grid-cols-2 gap-5">
          <SpaceSkeleton />
          <SpaceSkeleton />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f1e8] border border-[#d4c9b0] flex items-center justify-center text-2xl mb-5 shadow-inner">
          🔐
        </div>
        <h2 className="text-lg font-semibold text-[#615050] mb-2">Connect your wallet</h2>
        <p className="text-[#776a6a] text-sm max-w-xs leading-relaxed">
          Your dashboard is tied to your wallet address. Connect to see your spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#615050]">My spaces</h1>
          <p className="text-[#ad9a6f] text-xs font-mono mt-0.5" suppressHydrationWarning>
            {address}
          </p>
        </div>
        <CreateSpaceButton />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-5">
          <SpaceSkeleton />
          <SpaceSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#d4c9b0] rounded-2xl text-center">
          <div className="text-3xl mb-4 opacity-30">◻</div>
          <p className="text-[#776a6a] text-sm">No spaces yet.</p>
          <p className="text-[#ad9a6f] text-xs mt-1">Click &ldquo;+ Create space&rdquo; to get started.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && spaces.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-5">
          {spaces.map((space, i) => (
            <SpaceCard key={space.entityKey} space={space} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
