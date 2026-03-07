"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, useChainId, useSwitchChain, useBalance, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { createSigningClient } from "@/lib/arkiv/client";
import { createSpace } from "@/lib/arkiv/spaces";
import { kaolin } from "@arkiv-network/sdk/chains";

const KAOLIN_CHAIN_ID = kaolin.id;

export function CreateSpaceButton() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
    chainId: KAOLIN_CHAIN_ID,
  });
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    visibility: "public" as "public" | "private",
  });

  useEffect(() => { setMounted(true); }, []);

  const isWrongNetwork = mounted && isConnected && chainId !== KAOLIN_CHAIN_ID;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
        

    if (isWrongNetwork && switchChain) {      
      switchChain({ chainId: KAOLIN_CHAIN_ID });
      return;
    }

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    // Obtener walletClient si no está disponible
    const clientToUse = walletClient;
    if (!clientToUse) {
      // Mostrar mensaje con opción de reconectar
      setError("wallet_reconnect");
      return;
    }

    // Verificar que esté en la red correcta
    if (chainId !== KAOLIN_CHAIN_ID) {
      // Intentar cambiar automáticamente a Kaolin
      if (switchChain) {
        try {
          await switchChain({ chainId: KAOLIN_CHAIN_ID });
          // Esperar un poco para que se complete el cambio
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Verificar de nuevo
          if (chainId !== KAOLIN_CHAIN_ID) {
            setError(`Please switch to Kaolin testnet (current: ${chainId}, required: ${KAOLIN_CHAIN_ID})`);
            return;
          }
        } catch {
          setError(`Failed to switch to Kaolin testnet. Please switch manually.`);
          return;
        }
      } else {
        setError(`Please switch to Kaolin testnet (current: ${chainId}, required: ${KAOLIN_CHAIN_ID})`);
        return;
      }
    }

    // Verificar balance mínimo para gas
    if (!balance || balance.value === BigInt(0)) {
      setError("No Kaolin ETH balance found. Please get testnet ETH from a faucet first.");
      return;
    }

    // Verificar que tenga al menos 0.001 ETH para gas
    const minBalance = BigInt("1000000000000000"); // 0.001 ETH in wei
    if (balance.value < minBalance) {
      const balanceInEth = Number(balance.value) / 1e18;
      setError(`Insufficient Kaolin ETH. You have ${balanceInEth.toFixed(6)} ETH, need at least 0.001 ETH for gas.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {      
      console.log("Creating space with:", { address, chainId, form });
      
      // 1. IMPORTANTE: Ahora usamos 'await' porque el cliente valida la red asíncronamente
      const arkivClient = await createSigningClient(clientToUse);
      
      // 2. Creación de la entidad en Kaolin
      await createSpace(arkivClient, { ...form, owner: address });

      // 3. Éxito: limpieza y redirección
      setOpen(false);
      setForm({ name: "", description: "", slug: "", visibility: "public" });
      
      router.push(`/dashboard/${form.slug}/new/edit`);
      router.refresh();
    } catch (err: unknown) {
      console.error("Space creation error:", err);
      const error = err as { message?: string; code?: number } | undefined;
      const msg = error?.message?.toLowerCase() || "";
      const code = error?.code;
      
      if (msg.includes("rejected") || code === 4001) {
        setError("Transaction rejected in wallet.");
      } else if (msg.includes("network") || msg.includes("chain")) {
        setError("Network mismatch. Please switch to Kaolin testnet.");
      } else if (msg.includes("insufficient") || msg.includes("balance") || msg.includes("gas")) {
        setError("Insufficient Kaolin ETH for gas fees. Please get testnet ETH from a faucet.");
      } else if (msg.includes("nonce") || msg.includes("replacement")) {
        setError("Transaction conflict. Please try again in a few seconds.");
      } else {
        setError(`Transaction failed: ${error?.message || "Unknown error"}. Make sure you have Kaolin ETH for gas.`);
      }
    } finally {
      setLoading(false);
    }
  }
  
  if (!mounted) return <div className="h-10 w-32 bg-[#ede8dc] rounded-lg animate-pulse" />;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-[#615050] hover:bg-[#776a6a] text-white text-sm font-medium rounded-lg transition-all shadow-sm"
      >
        + Create space
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4">
          {/* Backdrop - bloqueado si está firmando */}
          <div 
            className="absolute inset-0 bg-[#1a1508]/70 backdrop-blur-sm" 
            onClick={() => !loading && setOpen(false)} 
          />
          
          <div className="relative w-full max-w-md bg-[#f5f1e8] border border-[#d4c9b0] rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden flex flex-col items-center justify-center mt-8">
            {/* Indicador de proceso de firma */}
            {loading && (
              <div className="absolute inset-0 bg-[#f5f1e8]/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#ad9a6f]/20 border-t-[#615050] rounded-full animate-spin mb-3" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#615050]">Confirming on Kaolin...</p>
              </div>
            )}

            <div className="w-full text-center">
              <h2 className="text-xl font-serif text-[#615050] italic">Sovereign Space</h2>
              <p className="text-[#776a6a] text-xs">This will create a permanent entity on-chain.</p>
              
              {/* Balance de Kaolin ETH */}
              {balance && (
                <div className="mt-3 p-3 bg-[#ede8dc] rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#ad9a6f] mb-1">Kaolin ETH Balance</p>
                  <p className="text-sm font-mono text-[#615050]">{(Number(balance.value) / 1e18).toFixed(6)} ETH</p>
                  {balance.value < BigInt("1000000000000000") && (
                    <p className="text-[9px] text-amber-600 mt-1">⚠️ Need at least 0.001 ETH for gas</p>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#ad9a6f]">Name</label>
                <input
                  type="text"
                  placeholder="My Protocol"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(f => ({ 
                      ...f, 
                      name: val,                       
                      slug: val.toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-") 
                    }));
                  }}
                  className="w-full px-4 py-3 bg-[#ede8dc] border border-[#c4b89a] rounded-xl text-sm focus:outline-none focus:border-[#ad9a6f] transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {isWrongNetwork && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-center">
                  <p className="text-amber-800 text-xs font-medium flex items-center gap-2 justify-center">
                    <span>⚠️</span> Red Kaolin requerida (ID: {KAOLIN_CHAIN_ID})
                  </p>
                  <button 
                    type="button"
                    onClick={() => switchChain?.({ chainId: KAOLIN_CHAIN_ID })}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors"
                  >
                    Switch to Kaolin
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
                  {error === "wallet_reconnect" ? (
                    <div className="space-y-2">
                      <p className="text-red-600 text-[11px] font-mono leading-tight">
                        Wallet connection needs refresh. Please reconnect:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          disconnect();
                          setError(null);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-widest font-bold rounded"
                      >
                        Reconnect Wallet
                      </button>
                    </div>
                  ) : (
                    <p className="text-red-600 text-[11px] font-mono leading-tight">{error}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#d4c9b0] justify-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="py-3 px-6 text-xs font-bold uppercase tracking-widest text-[#776a6a] hover:text-[#615050] transition-colors rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isWrongNetwork}
                  className="py-3 px-6 bg-[#615050] hover:bg-[#4a3d3d] text-white rounded-xl disabled:opacity-50 text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-[#615050]/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Signing..." : "Confirm & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}