/**
 * Arkiv client setup for Arko.
 *
 * Two clients are used throughout this app:
 *
 * - publicClient: read-only, no wallet needed — used for all data queries
 *   (listing spaces, reading docs, version history, collaborator checks).
 *   Safe to use in Server Components.
 *
 * - createSigningClient: factory that takes a viem WalletClient from wagmi and
 *   wraps it with Arkiv's wallet actions — used for all write operations
 *   (createEntity). Called per-operation so it always uses the current signer.
 *
 * ── Why custom(viemWalletClient.transport), not http()? ──────────────────────
 *
 * For browser wallets (MetaMask, Rabby, etc.), the account type is "json-rpc".
 * A json-rpc account signs by calling `eth_sendTransaction` through the wallet's
 * own EIP-1193 provider — NOT through an HTTP endpoint.
 *
 * If we used `http(rpcUrl)` here, viem would send the raw unsigned transaction
 * to the Arkiv RPC node, which can't sign on the user's behalf. The wallet
 * would never show a confirmation popup.
 *
 * By passing `custom(viemWalletClient.transport)`, we proxy all requests through
 * the wagmi wallet's transport (which wraps window.ethereum). This means:
 *   - sendTransaction → MetaMask popup, user signs ✓
 *   - waitForTransactionReceipt → via window.ethereum (eth_getTransactionReceipt) ✓
 *   - call → via window.ethereum (eth_call) ✓
 *
 * The read side (publicClient) continues to use the Arkiv HTTP RPC for
 * Arkiv-specific methods like arkiv_query that MetaMask doesn't know about.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type WalletClient,
} from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";

// ─── Public (read-only) client ───────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
});

// ─── Signing client factory (browser wallet) ─────────────────────────────────
// Accepts a viem WalletClient (from wagmi's useWalletClient) and returns an
// Arkiv WalletClient that routes transactions through the browser wallet.
export function createSigningClient(viemWalletClient: WalletClient) {
  return createWalletClient({
    chain: kaolin,
    // custom() treats the wagmi transport as an EIP-1193 provider.
    // This ensures sendTransaction goes through MetaMask (or other injected wallet)
    // rather than being sent unsigned to the HTTP RPC.
    transport: custom(viemWalletClient.transport),
    account: viemWalletClient.account!,
  });
}

// ─── Signing client factory (private key — for scripts/testing) ──────────────
// Used in scripts/test-arkiv.ts and server-side contexts where you have a key.
export function createSigningClientFromKey(privateKeyAccount: ReturnType<typeof import("@arkiv-network/sdk/accounts")["privateKeyToAccount"]>) {
  return createWalletClient({
    chain: kaolin,
    transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
    account: privateKeyAccount,
  });
}
