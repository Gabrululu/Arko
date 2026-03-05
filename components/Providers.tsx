"use client";

/**
 * Client-side providers wrapper.
 * Wagmi and React Query must be initialized on the client — this component
 * wraps them so they can be used inside the server-rendered layout.
 */

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi/config";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient is instantiated in state so it's stable across re-renders
  // but not shared across requests on the server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
