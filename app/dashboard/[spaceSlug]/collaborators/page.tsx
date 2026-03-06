"use client";

/**
 * Collaborators — /dashboard/[spaceSlug]/collaborators
 *
 * Space owners invite wallet addresses as editors or viewers.
 * Each invite creates a collaborator entity on Arkiv with a 90-day TTL.
 * Arkiv enforces expiry at the protocol level — access auto-expires.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import Link from "next/link";
import { getSpaceBySlug } from "@/lib/arkiv/spaces";
import { listCollaborators, addCollaborator, type Collaborator } from "@/lib/arkiv/collaborators";
import { createSigningClient } from "@/lib/arkiv/client";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CollaboratorsPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const spaceSlug = params.spaceSlug as string;

  const [space, setSpace] = useState<Awaited<ReturnType<typeof getSpaceBySlug>>>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteWallet, setInviteWallet] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function reload(spaceEntityKey: string) {
    const colabs = await listCollaborators(spaceEntityKey);
    setCollaborators(colabs);
  }

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        setSpace(s);
        if (s) await reload(s.entityKey);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load collaborators.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, spaceSlug]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!space) return;
    if (!walletClient) { setInviteError("Wallet client is still loading — please try again."); return; }
    if (!inviteWallet.match(/^0x[0-9a-fA-F]{40}$/)) {
      setInviteError("Enter a valid Ethereum address (0x followed by 40 hex characters).");
      return;
    }

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      const arkivClient = createSigningClient(walletClient);
      await addCollaborator(arkivClient, {
        spaceId: space.entityKey,
        wallet: inviteWallet,
        role: inviteRole,
      });
      setInviteWallet("");
      setInviteSuccess(true);
      await reload(space.entityKey);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to add collaborator.");
    } finally {
      setInviting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-12 h-12 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-[#615050] font-semibold">Connect your wallet to manage collaborators.</p>
      </div>
    );
  }

  const isOwner = address?.toLowerCase() === space?.owner.toLowerCase();

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-6 py-10">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-[#776a6a]">
        <Link href="/dashboard" className="hover:text-[#615050] transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/${spaceSlug}`} className="hover:text-[#615050] transition-colors">
          {space?.name ?? spaceSlug}
        </Link>
        <span>/</span>
        <span className="text-[#615050]">Collaborators</span>
      </nav>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Invite form (owner only) ────────────────────────────────────── */}
      {isOwner && (
        <div className="p-5 bg-[#f5f1e8] border border-[#d4c9b0] rounded-xl space-y-4">
          <div>
            <h2 className="font-semibold text-[#615050] text-sm">Invite collaborator</h2>
            <p className="text-[#776a6a] text-xs mt-1">
              Creates a collaborator entity on Arkiv with a 90-day TTL.
              Re-invite to renew access before expiry.
            </p>
          </div>

          {inviteSuccess && (
            <p className="text-emerald-600 text-xs">✓ Collaborator added successfully.</p>
          )}

          <form onSubmit={handleInvite} className="space-y-3">
            <input
              type="text"
              value={inviteWallet}
              onChange={(e) => { setInviteWallet(e.target.value); setInviteSuccess(false); }}
              placeholder="0x1234…abcd"
              required
              className="w-full px-3 py-2 bg-[#ede8dc] border border-[#c4b89a] rounded-lg text-[#615050] placeholder-[#ad9a6f]/60 text-sm font-mono focus:outline-none focus:border-[#ad9a6f] transition-colors"
            />
            <div className="flex gap-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                className="px-3 py-2 bg-[#ede8dc] border border-[#c4b89a] rounded-lg text-[#615050] text-sm focus:outline-none focus:border-[#ad9a6f] transition-colors"
              >
                <option value="editor">Editor — can create and publish docs</option>
                <option value="viewer">Viewer — read access (future use)</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 text-sm bg-[#615050] hover:bg-[#776a6a] disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {inviting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Add collaborator"
                )}
              </button>
            </div>
            {inviteError && <p className="text-red-500 text-xs">{inviteError}</p>}
          </form>
        </div>
      )}

      {/* ── Collaborator list ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-[#776a6a] uppercase tracking-wider mb-4">
          Access list
        </h2>

        {loading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#f5f1e8] border border-[#d4c9b0] rounded-lg">
                <div className="h-3.5 w-36 bg-[#ede8dc] rounded" />
                <div className="h-5 w-14 bg-[#ede8dc] rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && space && (
          <div className="space-y-2">
            {/* Owner row */}
            <div className="flex items-center justify-between p-3 bg-[#f5f1e8] border border-[#d4c9b0] rounded-lg">
              <span className="font-mono text-sm text-[#615050]" title={space.owner}>
                {truncate(space.owner)}
                {address?.toLowerCase() === space.owner.toLowerCase() && (
                  <span className="ml-2 text-[#ad9a6f]">(you)</span>
                )}
              </span>
              <span className="px-2 py-0.5 text-xs bg-[#f0ebe0] text-[#ad9a6f] border border-[#ad9a6f]/60 rounded font-mono">
                owner
              </span>
            </div>

            {collaborators.map((c) => (
              <div
                key={c.entityKey}
                className="flex items-center justify-between p-3 bg-[#f5f1e8] border border-[#d4c9b0] rounded-lg"
              >
                <span className="font-mono text-sm text-[#615050]" title={c.wallet}>
                  {truncate(c.wallet)}
                  {address?.toLowerCase() === c.wallet.toLowerCase() && (
                    <span className="ml-2 text-[#ad9a6f]">(you)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-mono border ${
                      c.role === "editor"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-[#ede8dc] text-[#776a6a] border-[#d4c9b0]"
                    }`}
                  >
                    {c.role}
                  </span>
                </div>
              </div>
            ))}

            {collaborators.length === 0 && (
              <p className="text-[#776a6a] text-xs py-2">
                No collaborators yet. Only you can edit this space.
              </p>
            )}
          </div>
        )}

        <p className="text-[#ad9a6f] text-xs mt-4">
          ⏱ Collaborator access is valid for 90 days from grant date (Arkiv TTL).
          Arkiv automatically excludes expired entities from queries.
        </p>
      </div>
    </div>
  );
}
