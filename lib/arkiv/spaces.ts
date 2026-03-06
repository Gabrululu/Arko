/**
 * Space entity helpers for Arko.
 */

import { publicClient } from "./client";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity } from "@arkiv-network/sdk";

export interface Space {
  entityKey: string;
  name: string;
  description: string;
  slug: string;
  owner: string;
  visibility: "public" | "private";
  expiresAt?: Date;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSpace( 
  walletClient: any,
  params: {
    name: string;
    description: string;
    slug: string;
    visibility: "public" | "private";
    owner: string;
  }
): Promise<string> {  
  const normalizedOwner = params.owner.toLowerCase();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({ 
      name: params.name, 
      description: params.description 
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "space" },
      { key: "owner", value: normalizedOwner },
      { key: "slug", value: params.slug },
      { key: "visibility", value: params.visibility },
    ],
    
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

// ─── Read: all public spaces ───────────────────────────────────────────────────

export async function listPublicSpaces(): Promise<Space[]> {
  try {
    const result = await publicClient
      .buildQuery()
      .where([
        eq("type", "space"), 
        eq("visibility", "public")
      ])
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    return result.entities.map(entityToSpace);
  } catch (error) {
    console.error("Error listing public spaces from Arkiv:", error);
    return [];
  }
}

// ─── Read: spaces owned by a wallet ───────────────────────────────────────────

export async function listSpacesByOwner(owner: string): Promise<Space[]> {
  if (!owner) return [];
  
  try {
    const result = await publicClient
      .buildQuery()
      .where([
        eq("type", "space"), 
        eq("owner", owner.toLowerCase())
      ])
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    return result.entities.map(entityToSpace);
  } catch (error) {
    console.error("Error listing owner spaces:", error);
    return [];
  }
}

// ─── Renew ───────────────────────────────────────────────────────────────────

export async function renewSpace(
  walletClient: any,
  spaceId: string
): Promise<string> {
  // Obtener la entidad existente
  const result = await publicClient
    .buildQuery()
    .where([eq("entityKey", spaceId)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (!result.entities || result.entities.length === 0) {
    throw new Error("Space not found");
  }

  const entity = result.entities[0];
  const attrs: Record<string, string> = {};
  if (entity.attributes) {
    for (const a of entity.attributes) {
      attrs[a.key] = String(a.value);
    }
  }

  const payload = entity.toJson();

  // Crear nueva entidad con mismo payload y atributos, pero nuevo TTL
  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: entity.attributes || [],
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  try {
    const result = await publicClient
      .buildQuery()
      .where([
        eq("type", "space"), 
        eq("slug", slug)
      ])
      .withAttributes(true)
      .withPayload(true)
      .fetch();

    if (!result.entities || result.entities.length === 0) return null;
    return entityToSpace(result.entities[0]);
  } catch (error) {
    console.error(`Error fetching space by slug (${slug}):`, error);
    return null;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function entityToSpace(entity: Entity): Space {
  const attrs: Record<string, string> = {};
  
  // Mapeamos atributos on-chain a un objeto plano
  if (entity.attributes) {
    for (const a of entity.attributes) {
      attrs[a.key] = String(a.value);
    }
  }
  
  let payload: { name?: string; description?: string } = {};
  try {    
    payload = entity.toJson() as { name?: string; description?: string };
  } catch (e) {
    console.warn("Could not parse payload for entity:", entity.key);
  }

  return {
    entityKey: entity.key,
    name: payload.name || "Untitled Space",
    description: payload.description || "",
    slug: attrs["slug"] || "",
    owner: attrs["owner"] || "0x0",
    visibility: (attrs["visibility"] || "public") as "public" | "private",
    expiresAt: entity.expiresAt,
  };
}