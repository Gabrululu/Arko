/**
 * VersionHistory — displays all immutable versions of a doc.
 *
 * Each row links to the doc viewer with ?atBlock=<blockNumber> so the reader
 * can see exactly what the doc looked like when that version was published.
 * This is the "on-chain changelog" — every version is permanently stored on
 * Arkiv and can never be altered or deleted.
 */

import Link from "next/link";
import type { Doc } from "@/lib/arkiv/docs";

interface VersionHistoryProps {
  versions: Doc[];
  spaceSlug: string;
  docSlug: string;
}

export function VersionHistory({ versions, spaceSlug, docSlug }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <p className="text-gray-400 text-sm">No versions found for this document.</p>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v, i) => (
        <div
          key={v.entityKey}
          className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-indigo-900/40 border border-indigo-700/50 rounded-lg">
              <span className="text-indigo-400 text-xs font-mono">v{v.version}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                Version {v.version}
                {i === 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-900/50 text-green-400 border border-green-700/50 rounded-full">
                    latest
                  </span>
                )}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Block {v.blockNumber.toLocaleString()} ·{" "}
                <span
                  className={
                    v.status === "published"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                >
                  {v.status}
                </span>{" "}
                · by {v.author.slice(0, 6)}…{v.author.slice(-4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/docs/${spaceSlug}/${docSlug}?atBlock=${v.blockNumber}`}
              className="px-3 py-1.5 text-xs text-indigo-400 border border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition-colors"
            >
              View snapshot
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
