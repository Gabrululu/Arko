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
    <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-40 bg-slate-800 rounded" />
        <div className="h-3 w-24 bg-slate-800 rounded" />
      </div>
      <div className="h-7 w-14 bg-slate-800 rounded-lg" />
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
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-white font-semibold">Connect your wallet to manage this space.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-300">{space?.name ?? spaceSlug}</span>
      </nav>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Space info ─────────────────────────────────────────────────── */}
      {!loading && space && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">{space.name}</h1>
              {space.description && (
                <p className="text-slate-400 text-sm mt-1">{space.description}</p>
              )}
            </div>
            <span
              className={`flex-shrink-0 mt-1 px-1.5 py-0.5 text-xs rounded font-mono border ${
                space.visibility === "public"
                  ? "bg-emerald-950 text-emerald-500 border-emerald-800/60"
                  : "bg-slate-800 text-slate-500 border-slate-700"
              }`}
            >
              {space.visibility}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-800">
            <span>
              Owner: <span className="font-mono text-slate-500">{truncate(space.owner)}</span>
            </span>
            <span className="font-mono">/docs/{space.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/${space.slug}/new/edit`}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
            >
              + New doc
            </Link>
            <Link
              href={`/dashboard/${space.slug}/collaborators`}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Collaborators
            </Link>
            <Link
              href={`/docs/${space.slug}`}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
            >
              Public view ↗
            </Link>
          </div>
        </div>
      )}

      {/* ── Docs list ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
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
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg">
            <p className="text-slate-600 text-sm">No published docs yet.</p>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.entityKey}
                className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{doc.title}</p>
                  <p className="text-slate-600 text-xs font-mono mt-0.5">
                    /{doc.slug} · v{doc.version} · block {doc.blockNumber.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/docs/${spaceSlug}/${doc.slug}`}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600 rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/dashboard/${spaceSlug}/${doc.slug}/edit`}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
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
