/**
 * VersionHistory — Listado de linaje inmutable.
 */

import Link from "next/link";
import type { Doc } from "@/lib/arkiv/docs";
import { ExternalLink } from "lucide-react";

interface VersionHistoryProps {
  versions: Doc[];
  spaceSlug: string;
  docSlug: string;
}

export function VersionHistory({ versions, spaceSlug, docSlug }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-[#d4c9b0] rounded-2xl">
        <p className="text-[#776a6a] text-sm italic">No version history found on-chain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((v, i) => (
        <div
          key={v.entityKey}
          className="group relative flex items-center justify-between p-5 bg-[#fcfcfc] border border-[#d4c9b0] rounded-2xl transition-all hover:border-[#ad9a6f] hover:shadow-md"
        >
          <div className="flex items-center gap-5">
            {/* Version Badge */}
            <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#f5f1e8] rounded-xl border border-[#d4c9b0] group-hover:border-[#ad9a6f] transition-colors">
              <span className="text-[10px] font-bold text-[#ad9a6f] uppercase">Ver</span>
              <span className="text-lg font-serif italic text-[#615050] leading-none">{v.version}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-[#615050]">
                  Block #{v.blockNumber.toLocaleString()}
                </p>
                {i === 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 rounded-md">
                    Live
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#ad9a6f]">
                <span className={`px-1.5 py-0.5 rounded capitalize ${
                  v.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {v.status}
                </span>
                <span>•</span>
                <span title={v.author}>
                  By {v.author.slice(0, 6)}…{v.author.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/docs/${spaceSlug}/${docSlug}?atBlock=${v.blockNumber}`}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#615050] border border-[#d4c9b0] rounded-xl hover:bg-[#615050] hover:text-white hover:border-[#615050] transition-all"
          >
            Snapshot <ExternalLink size={12} />
          </Link>
        </div>
      ))}
    </div>
  );
}