/**
 * Space entity helpers.
 *
 * A "space" is the top-level container for docs — similar to a GitBook space
 * or Notion workspace. Each space is owned by a wallet address and has a
 * human-readable slug used in URLs (/docs/[slug]).
 *
 * All spaces live on Arkiv — no external database. The owner attribute is the
 * wallet address that created the space. Visibility can be "public" or
 * "private" (private spaces are still on-chain but the app won't surface them
 * in public listings).
 */

import { publicClient } from "./client";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity, WalletArkivClient } from "@arkiv-network/sdk";

export interface Space {
  entityKey: string;
  name: string;
  description: string;
  slug: string;
  owner: string;
  visibility: "public" | "private";
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSpace(
  walletClient: WalletArkivClient,
  params: {
    name: string;
    description: string;
    slug: string;
    visibility: "public" | "private";
    owner: string;
  }
): Promise<string> {
  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({ name: params.name, description: params.description }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "space" },
      { key: "owner", value: params.owner },
      { key: "slug", value: params.slug },
      { key: "visibility", value: params.visibility },
    ],
    // Spaces last 1 year; can be extended by the owner.
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

// ─── Read: all public spaces ───────────────────────────────────────────────────

export async function listPublicSpaces(): Promise<Space[]> {
  const result = await publicClient
    .buildQuery()
    .where([eq("type", "space"), eq("visibility", "public")])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.map(entityToSpace);
}

// ─── Read: spaces owned by a wallet ───────────────────────────────────────────

export async function listSpacesByOwner(owner: string): Promise<Space[]> {
  const result = await publicClient
    .buildQuery()
    .where([eq("type", "space"), eq("owner", owner)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return result.entities.map(entityToSpace);
}

// ─── Read: single space by slug ───────────────────────────────────────────────

export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  const result = await publicClient
    .buildQuery()
    .where([eq("type", "space"), eq("slug", slug)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (result.entities.length === 0) return null;
  return entityToSpace(result.entities[0]);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function entityToSpace(entity: Entity): Space {
  const attrs: Record<string, string> = {};
  for (const a of entity.attributes ?? []) {
    attrs[a.key] = String(a.value);
  }

  // Entity.toJson() decodes the Uint8Array payload via bytesToString + JSON.parse.
  let payload: { name?: string; description?: string } = {};
  try {
    payload = entity.toJson() as { name?: string; description?: string };
  } catch { /* leave empty if payload unset */ }

  return {
    entityKey: entity.key,
    name: payload.name ?? "",
    description: payload.description ?? "",
    slug: attrs["slug"] ?? "",
    owner: attrs["owner"] ?? "",
    visibility: (attrs["visibility"] ?? "public") as "public" | "private",
  };
}
