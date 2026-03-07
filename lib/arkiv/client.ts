/**
 * Arkiv client setup for Arko.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import type { Account, PrivateKeyAccount } from "viem";

const KAOLIN_ID = kaolin.id;

interface WagmiWalletClientLike {
  account?: Account;
  getChainId(): Promise<number>;
  transport: object;
}

export interface ArkivSigningClient {
  createEntity(params: {
    payload: Uint8Array;
    contentType: string;
    attributes: Array<{ key: string; value: string }>;
    expiresIn?: unknown;
  }): Promise<{ entityKey: string }>;
}

// ─── Public (read-only) client ───────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
});

// ─── Signing client factory (browser wallet) ─────────────────────────────────
export async function createSigningClient(viemWalletClient: WagmiWalletClientLike): Promise<ArkivSigningClient> {
  // 1. Verificación de cuenta
  const account = viemWalletClient.account;
  if (!account) {
    throw new Error("WalletClient missing account. Conecta tu billetera primero.");
  }

  // 2. Validación de Red (Seguridad Proactiva)
  const currentChainId = await viemWalletClient.getChainId();

  if (Number(currentChainId) !== KAOLIN_ID) {
    throw new Error(
      `Red incorrecta. Arko requiere Kaolin (ID: ${KAOLIN_ID}). ` +
      `Por favor, cambia de red en tu billetera.`
    );
  }

  // 3. Inicialización del cliente de Arkiv
  const arkivWallet = createWalletClient({
    chain: kaolin,
    transport: custom(viemWalletClient.transport as Parameters<typeof custom>[0]),
    account: account,
  });

  return arkivWallet as unknown as ArkivSigningClient;
}

// ─── Signing client factory (private key — para scripts/testing) ──────────────
export function createSigningClientFromKey(privateKeyAccount: PrivateKeyAccount): ArkivSigningClient {
  const client = createWalletClient({
    chain: kaolin,
    transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
    account: privateKeyAccount,
  });

  return client as unknown as ArkivSigningClient;
}