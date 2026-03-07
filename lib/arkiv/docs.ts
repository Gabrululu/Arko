/**
 * Doc entity helpers for Arko.
 */

import { publicClient } from "./client";
import type { ArkivSigningClient } from "./client";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity } from "@arkiv-network/sdk";

export interface Doc {
  entityKey: string;
  title: string;
  content: string; 
  slug: string;
  spaceId: string;
  version: number;
  author: string;
  status: "published" | "draft";
  blockNumber: number;
}

// ─── Save  ────────────────────────────────

export async function saveDoc(
  walletClient: ArkivSigningClient,
  params: {
    title: string;
    content: string;
    slug: string;
    spaceId: string;
    version: number; 
    author: string;
    status: "published" | "draft";
  }
): Promise<string> {  
  const currentBlock = await publicClient.getBlockNumber();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({ 
      title: params.title, 
      content: params.content 
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "doc" },
      { key: "spaceId", value: params.spaceId },
      { key: "slug", value: params.slug },
      { key: "version", value: String(params.version) },
      { key: "author", value: params.author.toLowerCase() },
      { key: "status", value: params.status },
      { key: "blockNumber", value: String(currentBlock) },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

// ─── Read ─────────────────────────────────────────

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

  if (!result.entities || result.entities.length === 0) return null;

  const docs = result.entities.map(entityToDoc);
  // Reducimos para encontrar la versión numérica más alta
  return docs.reduce((prev, current) => (prev.version > current.version ? prev : current));
}

// ─── Read: Snapshot  ──────────────────────────────────


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
    
    .validAtBlock(BigInt(atBlock))
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (!result.entities || result.entities.length === 0) return null;

  const docs = result.entities.map(entityToDoc);
  return docs.reduce((prev, current) => (prev.version > current.version ? prev : current));
}

// ─── Read: History ─────────────────────────────────────────────

export async function getDocVersions(
  spaceId: string,
  slug: string
): Promise<Doc[]> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq("type", "doc"), 
      eq("spaceId", spaceId), 
      eq("slug", slug)
    ])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities
    .map(entityToDoc)
    .sort((a, b) => b.version - a.version); 
}

// ─── Read: List ────────────────────────────────

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
  
  const latestBySlug = new Map<string, Doc>();
  for (const doc of docs) {
    const existing = latestBySlug.get(doc.slug);
    if (!existing || doc.version > existing.version) {
      latestBySlug.set(doc.slug, doc);
    }
  }

  return Array.from(latestBySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

// ─── Helper ──────────────────────────────────────

export async function getNextVersion(
  spaceId: string,
  slug: string
): Promise<number> {
  const versions = await getDocVersions(spaceId, slug);
  return versions.length === 0 ? 1 : versions[0].version + 1;
}

// ─── Mapper ──────────────────────────────────────

function entityToDoc(entity: Entity): Doc {
  const attrs: Record<string, string> = {};
  if (entity.attributes) {
    for (const a of entity.attributes) {
      attrs[a.key] = String(a.value);
    }
  }

  let payload: { title?: string; content?: string } = {};
  try {
    payload = entity.toJson() as { title?: string; content?: string };
  } catch {
    console.warn("Error decoding doc payload:", entity.key);
  }

  return {
    entityKey: entity.key,
    title: payload.title || "Untitled Document",
    content: payload.content || "",
    slug: attrs["slug"] || "",
    spaceId: attrs["spaceId"] || "",
    version: parseInt(attrs["version"] || "1", 10),
    author: attrs["author"] || "0x0",
    status: (attrs["status"] || "draft") as "published" | "draft",
    blockNumber: parseInt(attrs["blockNumber"] || "0", 10),
  };
}