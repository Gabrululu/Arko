"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider, deserialize, cookieToInitialState } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi/config";

export function Providers({ 
  children, 
  cookie 
}: { 
  children: ReactNode;
  cookie?: string | null; 
}) {  
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {            
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  const initialState = cookie ? cookieToInitialState(wagmiConfig, cookie) : undefined;

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {/* Si usas RainbowKit o ConnectKit, sus proveedores irían aquí 
            envolviendo a {children} 
        */}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}