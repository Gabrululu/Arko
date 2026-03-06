"use client";

import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { createSigningClient } from "@/lib/arkiv/client";
import { addCollaborator, listCollaborators, type Collaborator } from "@/lib/arkiv/collaborators";

export function CollaboratorsManager({ spaceId }: { spaceId: string }) {
  const { data: walletClient } = useWalletClient();
  const [address, setAddress] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Cargar lista actual
  useEffect(() => {
    listCollaborators(spaceId).then((list) => {
      setCollaborators(list);
      setFetching(false);
    });
  }, [spaceId]);

  async function handleAdd() {
    if (!walletClient || !address.startsWith("0x")) return;
    setLoading(true);
    setToast("Requesting signature...");
    try {
      const arkivClient = await createSigningClient(walletClient);
      setToast("Broadcasting to Kaolin...");
      await addCollaborator(arkivClient, {
        spaceId,
        wallet: address,
        role: "editor"
      });
      setToast("Confirmed! Collaborator added.");
      setAddress("");      
      const newList = await listCollaborators(spaceId);
      setCollaborators(newList);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast("Error: Failed to add collaborator.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#d4c9b0] bg-[#f5f1e8] p-6 space-y-6">
      {toast && (
        <div className="bg-[#615050] text-white px-3 py-2 rounded-lg text-sm">
          {toast}
        </div>
      )}
      <div>
        <h3 className="font-serif italic text-lg text-[#615050]">Access Control</h3>
        <p className="text-[10px] uppercase tracking-widest text-[#ad9a6f] font-bold">On-chain Permissions</p>
      </div>

      <div className="flex gap-2">
        <input 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x... address"
          className="flex-1 rounded-lg border border-[#c4b89a] bg-[#ede8dc] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#ad9a6f] text-[#615050] placeholder-[#ad9a6f]/50"
          disabled={loading}
        />
        <button 
          onClick={handleAdd}
          disabled={loading || !address}
          className="bg-[#615050] hover:bg-[#4a3d3d] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg disabled:opacity-50 transition-all shadow-sm"
        >
          {loading ? "Signing..." : "Add Editor"}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase text-[#776a6a]">Current Editors</p>
        {fetching ? (
          <div className="h-10 bg-[#ede8dc] animate-pulse rounded-lg" />
        ) : collaborators.length === 0 ? (
          <p className="text-xs text-[#ad9a6f] italic">No editors added yet.</p>
        ) : (
          collaborators.map(c => (
            <div key={c.entityKey} className="flex justify-between items-center bg-[#ede8dc] p-2 rounded-lg border border-[#c4b89a]">
              <span className="text-xs font-mono text-[#615050]">{c.wallet}</span>
              <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{c.role}</span>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-[#d4c9b0]/50">
        <p className="text-[9px] text-[#776a6a] leading-relaxed">
          Arko uses time-limited access (90 days). Once expired, the collaborator entity is ignored by the network until renewed by the owner.
        </p>
      </div>
    </div>
  );
}