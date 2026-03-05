/**
 * Doc viewer — /docs/[spaceSlug]/[docSlug]
 *
 * Server Component. Supports ?atBlock=N for point-in-time snapshots via the
 * Arkiv validAtBlock() query — the core Arko differentiator.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpaceBySlug } from "@/lib/arkiv/spaces";
import { getLatestDoc, getDocAtBlock } from "@/lib/arkiv/docs";
import { DocViewer } from "@/components/DocViewer";
import { SnapshotBanner } from "@/components/SnapshotBanner";

interface Props {
  params: { spaceSlug: string; docSlug: string };
  searchParams: { atBlock?: string };
}

export const revalidate = 30;

export async function generateMetadata({ params }: Props) {
  const space = await getSpaceBySlug(params.spaceSlug);
  const doc = space ? await getLatestDoc(space.entityKey, params.docSlug) : null;
  return {
    title: doc ? `${doc.title} — ${space?.name} — Arko` : "Not found — Arko",
    description: doc ? `v${doc.version} · block ${doc.blockNumber}` : undefined,
  };
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default async function DocPage({ params, searchParams }: Props) {
  const space = await getSpaceBySlug(params.spaceSlug);
  if (!space) notFound();

  // Parse atBlock — if present, query point-in-time via validAtBlock()
  const atBlock = searchParams.atBlock ? parseInt(searchParams.atBlock, 10) : null;

  let doc;
  try {
    doc = atBlock !== null
      ? await getDocAtBlock(space.entityKey, params.docSlug, atBlock)
      : await getLatestDoc(space.entityKey, params.docSlug);
  } catch {
    // Network error — show friendly message instead of crashing
    doc = null;
  }

  if (!doc) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Block snapshot banner ────────────────────────────────────── */}
      {atBlock !== null && (
        <SnapshotBanner
          atBlock={atBlock}
          spaceSlug={params.spaceSlug}
          docSlug={params.docSlug}
          docBlockNumber={doc.blockNumber}
        />
      )}

      {/* ── Doc header ──────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-slate-800 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href={`/docs/${params.spaceSlug}`} className="hover:text-white transition-colors">
              {space.name}
            </Link>
            <span>/</span>
            <span className="text-slate-400">{doc.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={`/docs/${params.spaceSlug}/${params.docSlug}/history`}
              className="text-xs text-slate-600 hover:text-indigo-400 transition-colors"
            >
              History
            </Link>
            <Link
              href={`/dashboard/${params.spaceSlug}/${params.docSlug}/edit`}
              className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white">{doc.title}</h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
          <span>v{doc.version}</span>
          <span>·</span>
          {/* Clicking the block number links to the snapshot for that block */}
          <Link
            href={`/docs/${params.spaceSlug}/${params.docSlug}?atBlock=${doc.blockNumber}`}
            className="hover:text-indigo-400 transition-colors"
            title="View snapshot at this block"
          >
            block #{doc.blockNumber.toLocaleString()}
          </Link>
          <span>·</span>
          <span title={doc.author}>{truncate(doc.author)}</span>
          {atBlock === null && (
            <>
              <span>·</span>
              <span className="text-emerald-600">latest</span>
            </>
          )}
        </div>
      </div>

      {/* ── Rendered Markdown ────────────────────────────────────────── */}
      <DocViewer content={doc.content} />

      {/* ── Footer nav ──────────────────────────────────────────────── */}
      <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <Link href={`/docs/${params.spaceSlug}`} className="hover:text-white transition-colors">
          ← {space.name}
        </Link>
        <Link
          href={`/docs/${params.spaceSlug}/${params.docSlug}/history`}
          className="hover:text-indigo-400 transition-colors"
        >
          {doc.version} version{doc.version !== 1 ? "s" : ""} on-chain →
        </Link>
      </div>
    </div>
  );
}
