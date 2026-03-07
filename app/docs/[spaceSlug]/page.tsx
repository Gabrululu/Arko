/**
 * Space overview — /docs/[spaceSlug]
 *
 * Client Component: fetches space + published docs, with client-side search.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { listDocsInSpace, type Doc } from "@/lib/arkiv/docs";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        const spaceDocs = await listDocsInSpace(s.entityKey);
        setDocs(spaceDocs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [spaceSlug]);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        router.push(`/docs/${spaceSlug}/search`)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [spaceSlug, router]);

  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-8">
        <div className="h-12 bg-[#ede8dc] rounded" />
        <div className="h-8 bg-[#ede8dc] rounded w-1/2" />
        <div className="space-y-4">
          <div className="h-16 bg-[#ede8dc] rounded" />
          <div className="h-16 bg-[#ede8dc] rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

      {/* ── Header ── */}
      <header className="space-y-6">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#ad9a6f]">
          <Link href="/docs" className="hover:text-[#615050] transition-colors">
            Public Spaces
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[#615050]">{space.name}</span>
        </nav>

        <div className="space-y-4">
          <h1 className="text-5xl font-serif text-[#615050] leading-tight italic">
            {space.name}
          </h1>
          {space.description && (
            <p className="text-lg text-[#776a6a] leading-relaxed">
              {space.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-[#ad9a6f]">
            <span>Owner: {truncate(space.owner)}</span>
            <span className={`px-2 py-1 rounded border text-xs font-bold uppercase ${
              space.visibility === "public"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-[#ede8dc] text-[#776a6a] border-[#d4c9b0]"
            }`}>
              {space.visibility}
            </span>
          </div>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#ede8dc] border border-[#c4b89a] rounded-lg text-[#615050] placeholder-[#ad9a6f]/60 focus:outline-none focus:border-[#ad9a6f] transition-colors"
          />
          <Link
            href={`/docs/${spaceSlug}/search`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              border: "1px solid rgba(255,252,246,0.15)",
              borderRadius: "6px",
              color: "rgba(255,252,246,0.5)",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontFamily: "monospace",
            }}
          >
            <span>⌕</span>
            <span>Search docs</span>
            <kbd style={{
              marginLeft: "auto",
              fontSize: "0.65rem",
              padding: "1px 5px",
              border: "1px solid rgba(255,252,246,0.2)",
              borderRadius: "3px",
              color: "rgba(255,252,246,0.3)",
            }}>⌘K</kbd>
          </Link>
        </div>
      </div>

      {/* ── Documents ── */}
      <section className="space-y-6">
        <h2 className="text-2xl font-serif italic text-[#615050]">
          Documents ({filteredDocs.length})
        </h2>

        {filteredDocs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#d4c9b0] rounded-lg">
            <p className="text-[#776a6a]">No documents found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocs.map((doc) => (
              <article
                key={doc.entityKey}
                className="p-6 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl hover:border-[#ad9a6f] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-serif italic text-[#615050]">
                      <Link
                        href={`/docs/${spaceSlug}/${doc.slug}`}
                        className="hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-[#776a6a] line-clamp-2">
                      {doc.content.slice(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[#ad9a6f]">
                      <span>v{doc.version}</span>
                      <span>·</span>
                      <span>Block #{doc.blockNumber.toLocaleString()}</span>
                      <span>·</span>
                      <span>Author: {truncate(doc.author)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold uppercase rounded">
                      Verified on Arkiv
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
