/**
 * Wagmi v2 configuration for Arko.
 *
 * We register the Kaolin testnet chain (from @arkiv-network/sdk/chains) so
 * wagmi knows how to connect wallets to it. MetaMask / injected wallets will
 * be prompted to switch to Kaolin when a write operation is triggered.
 */

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { kaolin } from "@arkiv-network/sdk/chains";

export const wagmiConfig = createConfig({
  chains: [kaolin],
  connectors: [
    // Use the generic injected connector which supports MetaMask, Rabby,
    // Coinbase Wallet, and any EIP-1193 compatible wallet.
    injected(),
  ],
  transports: {
    [kaolin.id]: http("https://kaolin.hoodi.arkiv.network/rpc"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
