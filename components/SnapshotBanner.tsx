/**
 * SnapshotBanner — shown when the user is viewing a doc at a historical block.
 *
 * The "atBlock" URL param triggers this banner. It makes the immutable,
 * block-anchored nature of Arko docs visible to readers — this is a core
 * differentiator that proves what a doc said at any point in time.
 */

import Link from "next/link";

interface SnapshotBannerProps {
  atBlock: number;
  spaceSlug: string;
  docSlug: string;
  /** The block number of the version being shown */
  docBlockNumber: number;
}

export function SnapshotBanner({
  atBlock,
  spaceSlug,
  docSlug,
  docBlockNumber,
}: SnapshotBannerProps) {
  return (
    <div className="mb-6 p-4 bg-amber-900/30 border border-amber-600/50 rounded-lg flex items-start gap-3">
      <span className="text-amber-400 text-lg flex-shrink-0">📸</span>
      <div className="flex-1 min-w-0">
        <p className="text-amber-300 font-medium text-sm">
          Historical snapshot — block {atBlock.toLocaleString()}
        </p>
        <p className="text-amber-200/70 text-xs mt-1">
          You&apos;re viewing this document as it existed at block {atBlock.toLocaleString()}.
          This version was published at block {docBlockNumber.toLocaleString()}.
          On-chain version history means this content is cryptographically provable.
        </p>
        <Link
          href={`/docs/${spaceSlug}/${docSlug}`}
          className="inline-block mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
        >
          View latest version →
        </Link>
      </div>
    </div>
  );
}
