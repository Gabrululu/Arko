/**
 * Version history — /docs/[spaceSlug]/[docSlug]/history
 *
 * Server Component. Shows all immutable versions of a doc with snapshot links.
 * Every version is permanently stored on Arkiv — none can be deleted or edited.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpaceBySlug } from "@/lib/arkiv/spaces";
import { getDocVersions } from "@/lib/arkiv/docs";
import { VersionHistory } from "@/components/VersionHistory";

interface Props {
  params: { spaceSlug: string; docSlug: string };
}

export const revalidate = 30;

export default async function HistoryPage({ params }: Props) {
  const space = await getSpaceBySlug(params.spaceSlug);
  if (!space) notFound();

  let versions: Awaited<ReturnType<typeof getDocVersions>> = [];
  let historyError: string | null = null;
  try {
    versions = await getDocVersions(space.entityKey, params.docSlug);
  } catch {
    historyError = "Could not load version history from Arkiv.";
  }

  if (!historyError && versions.length === 0) notFound();

  const latestTitle = versions[0]?.title ?? params.docSlug;

  return (
    <div className="max-w-2xl space-y-8">

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href={`/docs/${params.spaceSlug}`} className="hover:text-white transition-colors">
          {space.name}
        </Link>
        <span>/</span>
        <Link
          href={`/docs/${params.spaceSlug}/${params.docSlug}`}
          className="hover:text-white transition-colors"
        >
          {latestTitle}
        </Link>
        <span>/</span>
        <span className="text-slate-300">History</span>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Version history</h1>
        <p className="text-slate-500 text-sm">
          {versions.length} immutable version{versions.length !== 1 ? "s" : ""} stored on-chain.
          None can be altered or deleted.
        </p>
      </div>

      {historyError && (
        <p className="text-red-400 text-sm">{historyError}</p>
      )}

      {/* ── Version list ─────────────────────────────────────────────── */}
      <VersionHistory
        versions={versions}
        spaceSlug={params.spaceSlug}
        docSlug={params.docSlug}
      />

      {/* ── How snapshots work ───────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-500 space-y-1">
        <p className="text-slate-400 font-medium">How block snapshots work</p>
        <p>
          Each version stores the Kaolin block number at publish time as an attribute.
          &ldquo;View snapshot&rdquo; uses Arkiv&apos;s native{" "}
          <code className="font-mono text-slate-400 bg-slate-800 px-1 rounded">validAtBlock(N)</code>{" "}
          query to fetch the state of this doc at that exact block —
          proving what it said at any point in history.
        </p>
      </div>
    </div>
  );
}
