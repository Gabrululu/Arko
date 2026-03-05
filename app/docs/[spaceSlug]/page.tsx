/**
 * Space overview — /docs/[spaceSlug]
 *
 * Server Component: fetches space + published docs from Arkiv at render time.
 * No wallet needed to browse.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpaceBySlug } from "@/lib/arkiv/spaces";
import { listDocsInSpace } from "@/lib/arkiv/docs";

interface Props {
  params: { spaceSlug: string };
}

export const revalidate = 30;

export async function generateMetadata({ params }: Props) {
  const space = await getSpaceBySlug(params.spaceSlug);
  return {
    title: space ? `${space.name} — Arko` : "Space not found — Arko",
    description: space?.description,
  };
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default async function SpacePage({ params }: Props) {
  const space = await getSpaceBySlug(params.spaceSlug);
  if (!space) notFound();

  let docs: Awaited<ReturnType<typeof listDocsInSpace>> = [];
  let docsError: string | null = null;
  try {
    docs = await listDocsInSpace(space.entityKey);
  } catch {
    docsError = "Could not load docs from Arkiv.";
  }

  return (
    <div className="max-w-2xl space-y-8">

      {/* ── Space header ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{space.name}</h1>
            {space.description && (
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{space.description}</p>
            )}
          </div>
          <Link
            href={`/dashboard/${space.slug}/new/edit`}
            className="flex-shrink-0 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            + New doc
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
          <span title={space.owner}>{truncate(space.owner)}</span>
          <span>·</span>
          <span>/docs/{space.slug}</span>
          <span>·</span>
          <span
            className={
              space.visibility === "public" ? "text-emerald-600" : "text-slate-600"
            }
          >
            {space.visibility}
          </span>
        </div>
      </div>

      {/* ── Doc list ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Documents{docs.length > 0 && ` · ${docs.length}`}
        </h2>

        {docsError && (
          <p className="text-red-400 text-sm">{docsError}</p>
        )}

        {!docsError && docs.length === 0 && (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg">
            <p className="text-slate-600 text-sm">No published docs yet.</p>
          </div>
        )}

        <div className="space-y-1">
          {docs.map((doc) => (
            <Link
              key={doc.entityKey}
              href={`/docs/${space.slug}/${doc.slug}`}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all group"
            >
              <div>
                <p className="text-white text-sm font-medium group-hover:text-indigo-300 transition-colors">
                  {doc.title}
                </p>
                <p className="text-slate-600 text-xs font-mono mt-0.5">
                  /{doc.slug}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 flex-shrink-0">
                <span>v{doc.version}</span>
                <span>·</span>
                <span className="font-mono">#{doc.blockNumber.toLocaleString()}</span>
                <Link
                  href={`/docs/${space.slug}/${doc.slug}/history`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-700 hover:text-indigo-400 transition-colors ml-1"
                >
                  history
                </Link>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
