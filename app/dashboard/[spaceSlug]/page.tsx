"use client";

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

function DocSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-[#d4c9b0] dark:border-[#3a3020] rounded-lg animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-40 bg-[#ede8dc] dark:bg-[#2e2410] rounded" />
        <div className="h-3 w-24 bg-[#ede8dc] dark:bg-[#2e2410] rounded" />
      </div>
      <div className="h-7 w-14 bg-[#ede8dc] dark:bg-[#2e2410] rounded-lg" />
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
        <div className="w-12 h-12 rounded-xl bg-[#f5f1e8] dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-[#615050] dark:text-[#f5f0e8] font-semibold">Connect your wallet to manage this space.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-6 py-10">

      <nav className="flex items-center gap-2 text-sm text-[#776a6a] dark:text-[#9a8870]">
        <Link href="/dashboard" className="hover:text-[#615050] dark:hover:text-[#f5f0e8] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[#615050] dark:text-[#f5f0e8]">{space?.name ?? spaceSlug}</span>
      </nav>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && space && (
        <div className="p-5 bg-[#f5f1e8] dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[#615050] dark:text-[#f5f0e8]">{space.name}</h1>
              {space.description && (
                <p className="text-[#776a6a] dark:text-[#9a8870] text-sm mt-1">{space.description}</p>
              )}
            </div>
            <span
              className={`flex-shrink-0 mt-1 px-1.5 py-0.5 text-xs rounded font-mono border ${
                space.visibility === "public"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-[#ede8dc] dark:bg-[#2e2410] text-[#776a6a] dark:text-[#9a8870] border-[#d4c9b0] dark:border-[#3a3020]"
              }`}
            >
              {space.visibility}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#ad9a6f] dark:text-[#c4a97a] pt-1 border-t border-[#d4c9b0] dark:border-[#3a3020]">
            <span>
              Owner: <span className="font-mono text-[#776a6a] dark:text-[#9a8870]">{truncate(space.owner)}</span>
            </span>
            <span className="font-mono">/docs/{space.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/${space.slug}/new/edit`}
              className="px-3 py-1.5 text-xs bg-[#615050] dark:bg-[#3a2f22] hover:bg-[#776a6a] dark:hover:bg-[#4a3d2a] text-white rounded-lg transition-colors font-medium"
            >
              + New doc
            </Link>
            <Link
              href={`/dashboard/${space.slug}/settings`}
              className="px-3 py-1.5 text-xs bg-[#ede8dc] dark:bg-[#2e2410] hover:bg-[#e0d8c8] dark:hover:bg-[#3a3020] text-[#615050] dark:text-[#c8b898] rounded-lg transition-colors"
            >
              Settings
            </Link>
            <Link
              href={`/docs/${space.slug}`}
              className="px-3 py-1.5 text-xs text-[#776a6a] dark:text-[#9a8870] hover:text-[#615050] dark:hover:text-[#f5f0e8] border border-[#d4c9b0] dark:border-[#3a3020] hover:border-[#c4b89a] dark:hover:border-[#5a4d30] rounded-lg transition-colors"
            >
              Public view ↗
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-[#776a6a] dark:text-[#9a8870] uppercase tracking-wider mb-4">
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
          <div className="py-12 text-center border border-dashed border-[#d4c9b0] dark:border-[#3a3020] rounded-lg">
            <p className="text-[#776a6a] dark:text-[#9a8870] text-sm">No published docs yet.</p>
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.entityKey}
                className="flex items-center justify-between p-4 bg-[#f5f1e8] dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] rounded-lg"
              >
                <div>
                  <p className="text-[#615050] dark:text-[#f5f0e8] text-sm font-medium">{doc.title}</p>
                  <p className="text-[#ad9a6f] dark:text-[#c4a97a] text-xs font-mono mt-0.5">
                    /{doc.slug} · v{doc.version} · block {doc.blockNumber.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/docs/${spaceSlug}/${doc.slug}`}
                    className="px-3 py-1.5 text-xs text-[#776a6a] dark:text-[#9a8870] hover:text-[#615050] dark:hover:text-[#f5f0e8] border border-[#d4c9b0] dark:border-[#3a3020] hover:border-[#ad9a6f] dark:hover:border-[#c4a97a] rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/dashboard/${spaceSlug}/${doc.slug}/edit`}
                      className="px-3 py-1.5 text-xs bg-[#ede8dc] dark:bg-[#2e2410] hover:bg-[#e0d8c8] dark:hover:bg-[#3a3020] text-[#615050] dark:text-[#c8b898] rounded-lg transition-colors"
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
