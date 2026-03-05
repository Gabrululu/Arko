/**
 * Collaborator entity helpers.
 *
 * Collaborators are stored as Arkiv entities with a 90-day TTL — access is
 * time-limited and renewable, which aligns with how we think about team
 * membership: grant access, revoke by not renewing.
 *
 * Roles:
 *   - "editor": can create/save docs in the space
 *   - "viewer": placeholder for future read-gating on private spaces
 *
 * Checking access: query type="collaborator" && spaceId=X && wallet=address.
 * If any entity is returned (and not expired), the wallet has that role.
 * Expiry is enforced by Arkiv — expired entities are excluded from queries.
 */

import { publicClient } from "./client";
import { ExpirationTime } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import type { Entity, WalletArkivClient } from "@arkiv-network/sdk";

export interface Collaborator {
  entityKey: string;
  spaceId: string;
  wallet: string;
  role: "editor" | "viewer";
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function addCollaborator(
  walletClient: WalletArkivClient,
  params: {
    spaceId: string;
    wallet: string;
    role: "editor" | "viewer";
  }
): Promise<string> {
  const { entityKey } = await walletClient.createEntity({
    // Payload is intentionally empty — all meaningful data lives in attributes
    // for queryability. Arkiv queries filter on attributes, not payload content.
    payload: new Uint8Array(0),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "collaborator" },
      { key: "spaceId", value: params.spaceId },
      { key: "wallet", value: params.wallet.toLowerCase() },
      { key: "role", value: params.role },
    ],
    // 90-day TTL — time-limited access, renewable by the space owner.
    expiresIn: ExpirationTime.fromDays(90),
  });

  return entityKey;
}

// ─── Read: check if a wallet can edit a space ─────────────────────────────────
// Returns true if there is a non-expired collaborator or owner record.

export async function canEditSpace(
  spaceId: string,
  wallet: string,
  ownerAddress: string
): Promise<boolean> {
  // Space owner always has full access.
  if (wallet.toLowerCase() === ownerAddress.toLowerCase()) return true;

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
}

// ─── Read: list all collaborators for a space ─────────────────────────────────

export async function listCollaborators(spaceId: string): Promise<Collaborator[]> {
  const result = await publicClient
    .buildQuery()
    .where([eq("type", "collaborator"), eq("spaceId", spaceId)])
    .withAttributes(true)
    .fetch();

  return result.entities.map((entity: Entity) => {
    const attrs: Record<string, string> = {};
    for (const a of entity.attributes ?? []) {
      attrs[a.key] = String(a.value);
    }
    return {
      entityKey: entity.key,
      spaceId: attrs["spaceId"] ?? "",
      wallet: attrs["wallet"] ?? "",
      role: (attrs["role"] ?? "viewer") as "editor" | "viewer",
    };
  });
}
