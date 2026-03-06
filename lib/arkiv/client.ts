/**
 * Arkiv client setup for Arko.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type WalletClient as ArkivWalletClient,
} from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";

const KAOLIN_ID = kaolin.id;

// ─── Public (read-only) client ───────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
});

// ─── Signing client factory (browser wallet) ─────────────────────────────────
export async function createSigningClient(viemWalletClient: any): Promise<ArkivWalletClient> {
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
    transport: custom(viemWalletClient.transport),
    account: account,
  });

  return arkivWallet as any;
}

// ─── Signing client factory (private key — para scripts/testing) ──────────────
export function createSigningClientFromKey(privateKeyAccount: any): ArkivWalletClient {
  const client = createWalletClient({
    chain: kaolin,
    transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
    account: privateKeyAccount,
  });
  
  return client as any;
}