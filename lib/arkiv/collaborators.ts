/**
 * Collaborator entity helpers.
 */

import { publicClient } from "./client";
import { ExpirationTime } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity } from "@arkiv-network/sdk";

export interface Collaborator {
  entityKey: string;
  spaceId: string;
  wallet: string;
  role: "editor" | "viewer";
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function addCollaborator(
  walletClient: any, 
  params: {
    spaceId: string;
    wallet: string;
    role: "editor" | "viewer";
  }
): Promise<string> {
  const { entityKey } = await walletClient.createEntity({
    payload: new Uint8Array(0),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "collaborator" },
      { key: "spaceId", value: params.spaceId },
      { key: "wallet", value: params.wallet.toLowerCase() },
      { key: "role", value: params.role },
    ],
        expiresIn: ExpirationTime.fromDays(90),
  });

  return entityKey;
}

// ─── Read: Verificar acceso de edición ────────────────────────────────────────

export async function canEditSpace(
  spaceId: string,
  wallet: string | undefined,
  ownerAddress: string
): Promise<boolean> {
  if (!wallet) return false;
    
  if (wallet.toLowerCase() === ownerAddress.toLowerCase()) return true;

  try {
    const result = await publicClient
      .buildQuery()
      .where([
        eq("type", "collaborator"),
        eq("spaceId", spaceId),
        eq("wallet", wallet.toLowerCase()),
        eq("role", "editor"),
      ])
      .withAttributes(true)
      .fetch();

    return result.entities.length > 0;
  } catch (error) {
    console.error("Error checking permissions on Arkiv:", error);
    return false;
  }
}

// ─── Read: Listar colaboradores de un espacio ─────────────────────────────────

export async function listCollaborators(spaceId: string): Promise<Collaborator[]> {
  try {
    const result = await publicClient
      .buildQuery()
      .where([eq("type", "collaborator"), eq("spaceId", spaceId)])
      .withAttributes(true)
      .fetch();

    return result.entities.map((entity: Entity) => {
      const attrs: Record<string, string> = {};
      if (entity.attributes) {
        for (const a of entity.attributes) {
          attrs[a.key] = String(a.value);
        }
      }
      return {
        entityKey: entity.key,
        spaceId: attrs["spaceId"] ?? "",
        wallet: attrs["wallet"] ?? "",
        role: (attrs["role"] ?? "viewer") as "editor" | "viewer",
      };
    });
  } catch (error) {
    console.error("Error listing collaborators:", error);
    return [];
  }
}