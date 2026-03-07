/**
 * Wagmi v2 configuration for Arko.
 *
 * We register the Kaolin testnet chain (from @arkiv-network/sdk/chains) so
 * wagmi knows how to connect wallets to it. MetaMask / injected wallets will
 * be prompted to switch to Kaolin when a write operation is triggered.
 */

import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { kaolin } from "@arkiv-network/sdk/chains";

export const wagmiConfig = createConfig({
  chains: [kaolin],
  connectors: [
    // MetaMask connector (recomendado)
    metaMask(),
    // Generic injected connector (fallback para otras wallets)
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
