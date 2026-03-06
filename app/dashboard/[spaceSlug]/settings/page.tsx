"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { CollaboratorsManager } from "@/components/CollaboratorsManager";
import Link from "next/link";

export default function SettingsPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const spaceSlug = params.spaceSlug as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        if (!s) {
          setError(`Space "${spaceSlug}" not found.`);
          return;
        }
        setSpace(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load space.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, spaceSlug]);

  if (!isConnected) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-12 h-12 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-[#615050] font-semibold">Connect your wallet to access settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse max-w-4xl mx-auto px-6 py-10">
        <div className="h-4 w-48 bg-[#ede8dc] rounded" />
        <div className="h-64 bg-[#ede8dc] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 space-y-2 max-w-4xl mx-auto px-6">
        <p className="text-red-500 text-sm">{error}</p>
        <Link href="/dashboard" className="text-[#ad9a6f] text-xs hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-6 py-10">
      <nav className="flex items-center gap-2 text-sm text-[#776a6a]">
        <Link href="/dashboard" className="hover:text-[#615050] transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/${spaceSlug}`} className="hover:text-[#615050] transition-colors">
          {space.name}
        </Link>
        <span>/</span>
        <span className="text-[#615050]">Settings</span>
      </nav>

      <div>
        <h1 className="font-serif italic text-2xl text-[#615050]">{space.name} Settings</h1>
        <p className="text-[10px] uppercase tracking-widest text-[#ad9a6f] font-bold mt-1">Space Configuration</p>
      </div>

      <CollaboratorsManager spaceId={space.entityKey} />

      <div className="rounded-2xl border border-[#d4c9b0] bg-[#f5f1e8] p-6 space-y-4">
        <h3 className="font-serif italic text-lg text-[#615050]">Sovereign Access Control</h3>
        <div className="space-y-3 text-sm text-[#776a6a] leading-relaxed">
          <p>
            Arko uses on-chain permissions stored directly on the Kaolin network. Access is granted by the space owner and expires automatically after 90 days unless renewed.
          </p>
          <p className="text-xs text-[#ad9a6f]">
            Owner: {space.owner}
          </p>
        </div>
      </div>
    </div>
  );
}