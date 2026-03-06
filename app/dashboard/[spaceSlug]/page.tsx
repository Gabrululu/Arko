"use client";

/**
 * Space management — /dashboard/[spaceSlug]
 *
 * Shows the space details and its docs with edit links.
 * Wallet-gated: only the owner or collaborators can manage.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { listDocsInSpace, type Doc } from "@/lib/arkiv/docs";
import { canEditSpace } from "@/lib/arkiv/collaborators";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Skeleton rows
function DocSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-[#d4c9b0] rounded-lg animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-40 bg-[#ede8dc] rounded" />
        <div className="h-3 w-24 bg-[#ede8dc] rounded" />
      </div>
      <div className="h-7 w-14 bg-[#ede8dc] rounded-lg" />
    </div>
  );
}

export default function SpaceManagePage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const spaceSlug = params.spaceSlug as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        if (!s) { setError("Space not found."); return; }
        setSpace(s);

        const [spaceDocs, editAccess] = await Promise.all([
          listDocsInSpace(s.entityKey),
          canEditSpace(s.entityKey, address!, s.owner),
        ]);
        setDocs(spaceDocs);
        setCanEdit(editAccess);
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
        <p className="text-[#615050] font-semibold">Connect your wallet to manage this space.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-6 py-10">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-[#776a6a]">
        <Link href="/dashboard" className="hover:text-[#615050] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#615050]">{space?.name ?? spaceSlug}</span>
      </nav>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Space info ─────────────────────────────────────────────────── */}
      {!loading && space && (
        <div className="p-5 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[#615050]">{space.name}</h1>
              {space.description && (
                <p className="text-[#776a6a] text-sm mt-1">{space.description}</p>
              )}
            </div>
            <span
              className={`flex-shrink-0 mt-1 px-1.5 py-0.5 text-xs rounded font-mono border ${
                space.visibility === "public"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-[#ede8dc] text-[#776a6a] border-[#d4c9b0]"
              }`}
            >
              {space.visibility}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#ad9a6f] pt-1 border-t border-[#d4c9b0]">
            <span>
              Owner: <span className="font-mono text-[#776a6a]">{truncate(space.owner)}</span>
            </span>
            <span className="font-mono">/docs/{space.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/${space.slug}/new/edit`}
              className="px-3 py-1.5 text-xs bg-[#615050] hover:bg-[#776a6a] text-white rounded-lg transition-colors font-medium"
            >
              + New doc
            </Link>
            <Link
              href={`/dashboard/${space.slug}/settings`}
              className="px-3 py-1.5 text-xs bg-[#ede8dc] hover:bg-[#e0d8c8] text-[#615050] rounded-lg transition-colors"
            >
              Settings
            </Link>
            <Link
              href={`/docs/${space.slug}`}
              className="px-3 py-1.5 text-xs text-[#776a6a] hover:text-[#615050] border border-[#d4c9b0] hover:border-[#c4b89a] rounded-lg transition-colors"
            >
              Public view ↗
            </Link>
          </div>
        </div>
      )}

      {/* ── Docs list ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#776a6a] uppercase tracking-wider mb-4">
          Documents
        </h2>

        {loading && (
          <div className="space-y-2">
            <DocSkeleton />
            <DocSkeleton />
            <DocSkeleton />
          </div>
        )}

        {!loading && docs.length === 0 && !error && (
          <div className="py-12 text-center border border-dashed border-[#d4c9b0] rounded-lg">
            <p className="text-[#776a6a] text-sm">No published docs yet.</p>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.entityKey}
                className="flex items-center justify-between p-4 bg-[#f5f1e8] border border-[#d4c9b0] rounded-lg"
              >
                <div>
                  <p className="text-[#615050] text-sm font-medium">{doc.title}</p>
                  <p className="text-[#ad9a6f] text-xs font-mono mt-0.5">
                    /{doc.slug} · v{doc.version} · block {doc.blockNumber.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/docs/${spaceSlug}/${doc.slug}`}
                    className="px-3 py-1.5 text-xs text-[#776a6a] hover:text-[#615050] border border-[#d4c9b0] hover:border-[#ad9a6f] rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/dashboard/${spaceSlug}/${doc.slug}/edit`}
                      className="px-3 py-1.5 text-xs bg-[#ede8dc] hover:bg-[#e0d8c8] text-[#615050] rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
