/**
 * Doc entity helpers.
 *
 * Docs are IMMUTABLE. Every save creates a NEW entity with an incremented
 * version number. Old versions are never deleted — they remain queryable
 * forever. This is the core differentiator of Arko:
 *
 *   "What did this doc say at block 21504823?"
 *
 * We store the chain blockNumber in the attributes at publish time, enabling
 * point-in-time queries via the ?atBlock URL param.
 *
 * ⚠️  Never call updateEntity on a doc entity.
 */

import { publicClient } from "./client";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity, WalletArkivClient } from "@arkiv-network/sdk";

export interface Doc {
  entityKey: string;
  title: string;
  content: string; // Full Markdown
  slug: string;
  spaceId: string;
  version: number;
  author: string;
  status: "published" | "draft";
  blockNumber: number;
}

// ─── Create (or "update" = create new version) ────────────────────────────────

export async function saveDoc(
  walletClient: WalletArkivClient,
  params: {
    title: string;
    content: string;
    slug: string;
    spaceId: string;
    version: number; // caller is responsible for incrementing
    author: string;
    status: "published" | "draft";
  }
): Promise<string> {
  // Fetch current block number to record when this version was published.
  // This enables "view at block X" queries.
  const currentBlock = await publicClient.getBlockNumber();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({ title: params.title, content: params.content }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "doc" },
      { key: "spaceId", value: params.spaceId },
      { key: "slug", value: params.slug },
      { key: "version", value: String(params.version) },
      { key: "author", value: params.author },
      { key: "status", value: params.status },
      // blockNumber recorded at publish time — used for point-in-time queries.
      { key: "blockNumber", value: String(currentBlock) },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

// ─── Read: latest published version of a doc ─────────────────────────────────

export async function getLatestDoc(
  spaceId: string,
  slug: string
): Promise<Doc | null> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "doc"),
      eq("spaceId", spaceId),
      eq("slug", slug),
      eq("status", "published"),
    ])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (result.entities.length === 0) return null;

  // Pick the entity with the highest version number.
  const docs = result.entities.map(entityToDoc);
  return docs.reduce((best, d) => (d.version > best.version ? d : best), docs[0]);
}

// ─── Read: doc at a specific block number ────────────────────────────────────
// Returns the highest-versioned published doc that existed at `atBlock`.
//
// We use QueryBuilder.validAtBlock(bigint) — the SDK-native way to query the
// Arkiv state at a specific block. This is more correct than filtering
// client-side because Arkiv can return entities that were alive at that block
// (even if they've since expired), without fetching the entire history.

export async function getDocAtBlock(
  spaceId: string,
  slug: string,
  atBlock: number
): Promise<Doc | null> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "doc"),
      eq("spaceId", spaceId),
      eq("slug", slug),
      eq("status", "published"),
    ])
    // validAtBlock tells Arkiv: "give me the state as it was at this block".
    // Entities created after this block are excluded; expired-by-then are excluded.
    .validAtBlock(BigInt(atBlock))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (result.entities.length === 0) return null;

  // Among all versions visible at that block, pick the highest version.
  const docs = result.entities.map(entityToDoc);
  return docs.reduce((best, d) => (d.version > best.version ? d : best), docs[0]);
}

// ─── Read: all versions of a doc (for history page) ──────────────────────────

export async function getDocVersions(
  spaceId: string,
  slug: string
): Promise<Doc[]> {
  const result = await publicClient
    .buildQuery()
    .where([eq("type", "doc"), eq("spaceId", spaceId), eq("slug", slug)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities
    .map(entityToDoc)
    .sort((a, b) => b.version - a.version); // newest first
}

// ─── Read: all docs in a space ───────────────────────────────────────────────
// Returns only the latest published version of each unique slug.

export async function listDocsInSpace(spaceId: string): Promise<Doc[]> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "doc"),
      eq("spaceId", spaceId),
      eq("status", "published"),
    ])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  const docs = result.entities.map(entityToDoc);

  // Deduplicate by slug, keeping the highest version of each.
  const bySlug = new Map<string, Doc>();
  for (const doc of docs) {
    const existing = bySlug.get(doc.slug);
    if (!existing || doc.version > existing.version) {
      bySlug.set(doc.slug, doc);
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

// ─── Read: next version number for a slug ────────────────────────────────────
// Call this before saving to get the correct version to write.

export async function getNextVersion(
  spaceId: string,
  slug: string
): Promise<number> {
  const versions = await getDocVersions(spaceId, slug);
  if (versions.length === 0) return 1;
  return versions[0].version + 1;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function entityToDoc(entity: Entity): Doc {
  const attrs: Record<string, string> = {};
  for (const a of entity.attributes ?? []) {
    attrs[a.key] = String(a.value);
  }

  // Entity.toJson() decodes the Uint8Array payload via bytesToString + JSON.parse.
  let payload: { title?: string; content?: string } = {};
  try {
    payload = entity.toJson() as { title?: string; content?: string };
  } catch { /* leave empty if payload unset */ }

  return {
    entityKey: entity.key,
    title: payload.title ?? "",
    content: payload.content ?? "",
    slug: attrs["slug"] ?? "",
    spaceId: attrs["spaceId"] ?? "",
    version: parseInt(attrs["version"] ?? "0", 10),
    author: attrs["author"] ?? "",
    status: (attrs["status"] ?? "draft") as "published" | "draft",
    blockNumber: parseInt(attrs["blockNumber"] ?? "0", 10),
  };
}
