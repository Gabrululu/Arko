/**
 * Wagmi v2 configuration for Arko.
 *
 * We register the Braga testnet chain so wagmi knows how to connect wallets
 * to it. MetaMask / injected wallets will be prompted to switch to Braga
 * when a write operation is triggered.
 */

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { braga } from "@/lib/chains";

export const wagmiConfig = createConfig({
  chains: [braga],
  connectors: [
    injected(),
  ],
  transports: {
    [braga.id]: http("https://braga.hoodi.arkiv.network/rpc"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
