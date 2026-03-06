/**
 * Version history — /docs/[spaceSlug]/[docSlug]/history
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpaceBySlug } from "@/lib/arkiv/spaces";
import { getDocVersions, type Doc } from "@/lib/arkiv/docs";

interface Props {
  params: Promise<{ spaceSlug: string; docSlug: string }>;
}

export const revalidate = 30;

export default async function HistoryPage(props: Props) {
  const { spaceSlug, docSlug } = await props.params;

  // 1. Validar existencia del espacio
  const space = await getSpaceBySlug(spaceSlug);
  if (!space) notFound();

  // 2. Obtener historial desde el nodo Kaolin (Arkiv)
  let versions: Doc[] = [];
  let historyError: string | null = null;
  
  try {
    versions = await getDocVersions(space.entityKey, docSlug);
  } catch (error) {
    console.error("Arkiv History Error:", error);
    historyError = "Could not load version history from the Arkiv network.";
  }
  
  if (!historyError && versions.length === 0) notFound();

  const latestTitle = versions[0]?.title || docSlug;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-[#ad9a6f]">
        <Link href={`/docs/${spaceSlug}`} className="hover:text-[#615050] transition-colors">
          {space.name}
        </Link>
        <span className="opacity-40">/</span>
        <Link
          href={`/docs/${spaceSlug}/${docSlug}`}
          className="hover:text-[#615050] transition-colors"
        >
          {latestTitle}
        </Link>
        <span className="opacity-40">/</span>
        <span className="text-[#615050]">History</span>
      </nav>

      {/* ── Header ── */}
      <div className="space-y-2 border-b border-[#d4c9b0] pb-6">
        <h1 className="text-3xl font-serif italic text-[#615050]">Provenance</h1>
        <p className="text-[#776a6a] text-sm leading-relaxed max-w-md">
          {versions.length} immutable version{versions.length !== 1 ? "s" : ""} recorded. 
          Every save is cryptographically committed to the Kaolin chain.
        </p>
      </div>

      {historyError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {historyError}
        </div>
      )}

      {/* ── Version List ── */}
      <div className="space-y-4">
        {versions.map((v, i) => (
          <div 
            key={v.entityKey} 
            className="group relative flex items-center justify-between p-5 bg-[#fcfcfc] border border-[#d4c9b0] rounded-xl hover:border-[#ad9a6f] transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#ede8dc] text-[#ad9a6f] rounded">
                  v{v.version}
                </span>
                <h3 className="text-sm font-semibold text-[#615050]">{v.title}</h3>
                {i === 0 && (
                  <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">Latest</span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#ad9a6f]">
                Block: {v.blockNumber} · Author: {v.author.slice(0, 6)}...{v.author.slice(-4)}
              </p>
            </div>

            <Link
              href={`/docs/${spaceSlug}/${docSlug}?atBlock=${v.blockNumber}`}
              className="text-xs font-bold text-[#615050] hover:text-[#ad9a6f] underline decoration-[#d4c9b0] underline-offset-4 transition-colors"
            >
              View Snapshot →
            </Link>
          </div>
        ))}
      </div>

      {/* ── How snapshots work ── */}
      <div className="p-6 bg-[#1a1508] rounded-2xl text-[#ad9a6f] space-y-3 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E8]">The Proof of History</h4>
        <p className="text-xs leading-relaxed opacity-80">
          Unlike centralized docs where history can be rewritten, Arko uses Arkiv&apos;s native{" "}
          <code className="bg-[#2a2318] px-1 rounded text-[#F5F0E8]">validAtBlock(N)</code>. 
          When you view a snapshot, the node returns the exact state of the entity at that specific 
          block height, excluding any subsequent edits or deletions.
        </p>
      </div>

    </div>
  );
}