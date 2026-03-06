/**
 * SnapshotBanner — Alerta de visualización histórica.
 */

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

interface SnapshotBannerProps {
  atBlock: number;
  spaceSlug: string;
  docSlug: string;
  docBlockNumber: number;
}

export function SnapshotBanner({
  atBlock,
  spaceSlug,
  docSlug,
  docBlockNumber,
}: SnapshotBannerProps) {
  return (
    <div className="mb-10 overflow-hidden rounded-2xl border border-[#ad9a6f]/30 bg-[#1a1508] shadow-2xl">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ad9a6f]/10 text-[#ad9a6f]">
          <Clock size={20} />
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F0E8]">
            Point-in-Time Snapshot
          </p>
          <p className="text-xs leading-relaxed text-[#ad9a6f]/80">
            Viewing state as of Kaolin block <span className="text-[#F5F0E8] font-mono">#{atBlock.toLocaleString()}</span>. 
            This specific version was committed at block <span className="font-mono">#{docBlockNumber.toLocaleString()}</span>.
          </p>
        </div>

        <Link
          href={`/docs/${spaceSlug}/${docSlug}`}
          className="flex items-center gap-2 rounded-lg bg-[#F5F0E8] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1508] transition-all hover:bg-white active:scale-95"
        >
          Latest <ArrowRight size={12} />
        </Link>
      </div>
      
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#ad9a6f]/40 to-transparent" />
    </div>
  );
}
