"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { getLatestDoc, getDocAtBlock, type Doc } from "@/lib/arkiv/docs";
import { canEditSpace } from "@/lib/arkiv/collaborators";
import { DocViewer } from "@/components/DocViewer";
import { SnapshotBanner } from "@/components/SnapshotBanner";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function DocPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();

  const spaceSlug = params.spaceSlug as string;
  const docSlug = params.docSlug as string;
  const atBlockRaw = searchParams.get("atBlock");
  const atBlock = atBlockRaw ? parseInt(atBlockRaw, 10) : null;

  const [space, setSpace] = useState<Space | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        if (!s) {
          setError("Space not found");
          return;
        }
        setSpace(s);

        let allowed = s.visibility === "public";
        if (s.visibility === "private" && address) {
          allowed = await canEditSpace(s.entityKey, address, s.owner);
        }
        setCanView(allowed);

        if (allowed) {
          const d = atBlock !== null
            ? await getDocAtBlock(s.entityKey, docSlug, atBlock)
            : await getLatestDoc(s.entityKey, docSlug);
          setDoc(d);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [spaceSlug, docSlug, atBlock, address]);

  useEffect(() => {
    if (doc && space) {
      const title = atBlock
        ? `Document Snapshot at Block ${atBlock} - Verified by Arko`
        : `${doc.title} — ${space.name} — Arko`;
      document.title = title;
    }
  }, [doc, space, atBlock]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 px-6 py-12 animate-pulse">
        <div className="h-8 bg-[#ede8dc] rounded" />
        <div className="h-64 bg-[#ede8dc] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!space) return null;

  if (!canView) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] flex items-center justify-center text-2xl mx-auto">
          🔒
        </div>
        <h1 className="font-serif italic text-xl text-[#615050]">Access Restricted</h1>
        <p className="text-[#776a6a]">
          This is a private space. Only the owner and authorized collaborators can view its documents.
        </p>
        {isConnected ? (
          <p className="text-sm text-[#ad9a6f]">
            Connected as {truncate(address!)}
          </p>
        ) : (
          <p className="text-sm text-[#ad9a6f]">
            Please connect your wallet to check access.
          </p>
        )}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-[#776a6a]">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-6 py-12">
      {atBlock !== null && (
        <SnapshotBanner
          atBlock={atBlock}
          spaceSlug={spaceSlug}
          docSlug={docSlug}
          docBlockNumber={doc.blockNumber}
        />
      )}

      <header className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#d4c9b0] pb-4">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#ad9a6f]">
            <Link href={`/docs/${spaceSlug}`} className="hover:text-[#615050] transition-colors">
              {space.name}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-[#615050]">{doc.title}</span>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href={`/docs/${spaceSlug}/${docSlug}/history`}
              className="text-[10px] uppercase tracking-widest font-bold text-[#776a6a] hover:text-[#ad9a6f] transition-colors underline underline-offset-4 decoration-[#d4c9b0]"
            >
              History
            </Link>
            <Link
              href={`/dashboard/${spaceSlug}/${docSlug}/edit`}
              className="px-3 py-1 text-[10px] uppercase font-bold bg-[#1a1508] text-[#F5F0E8] rounded hover:opacity-80 transition-opacity"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-serif text-[#615050] leading-tight italic">
            {doc.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-[#ad9a6f]">
            <span className="bg-[#f5f1e8] px-1.5 py-0.5 rounded border border-[#d4c9b0]">v{doc.version}</span>
            <span>·</span>
            <Link
              href={`/docs/${spaceSlug}/${docSlug}?atBlock=${doc.blockNumber}`}
              className="hover:underline hover:text-[#615050] transition-all"
              title="View snapshot at this specific block"
            >
              Block #{doc.blockNumber.toLocaleString()}
            </Link>
            <span>·</span>
            <span className="cursor-help" title={doc.author}>Author: {truncate(doc.author)}</span>
            {atBlock === null && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold uppercase tracking-tighter">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Latest
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <article className="prose prose-stone max-w-none">
        <DocViewer content={doc.content} />
      </article>

      <footer className="pt-12 border-t border-[#d4c9b0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest font-bold text-[#ad9a6f]">
        <Link href={`/docs/${spaceSlug}`} className="hover:text-[#615050] transition-colors">
          ← Back to {space.name}
        </Link>
        <Link
          href={`/docs/${spaceSlug}/${docSlug}/history`}
          className="hover:text-[#615050] transition-colors"
        >
          Provenance: {doc.version} Immutable versions on-chain →
        </Link>
      </footer>
    </div>
  );
}