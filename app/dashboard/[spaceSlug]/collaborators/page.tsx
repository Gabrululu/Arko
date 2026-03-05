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
    if (!walletClient || !space) return;
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
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-white font-semibold">Connect your wallet to manage collaborators.</p>
      </div>
    );
  }

  const isOwner = address?.toLowerCase() === space?.owner.toLowerCase();

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/${spaceSlug}`} className="hover:text-white transition-colors">
          {space?.name ?? spaceSlug}
        </Link>
        <span>/</span>
        <span className="text-slate-300">Collaborators</span>
      </nav>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Invite form (owner only) ────────────────────────────────────── */}
      {isOwner && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div>
            <h2 className="font-semibold text-white text-sm">Invite collaborator</h2>
            <p className="text-slate-600 text-xs mt-1">
              Creates a collaborator entity on Arkiv with a 90-day TTL.
              Re-invite to renew access before expiry.
            </p>
          </div>

          {inviteSuccess && (
            <p className="text-emerald-400 text-xs">✓ Collaborator added successfully.</p>
          )}

          <form onSubmit={handleInvite} className="space-y-3">
            <input
              type="text"
              value={inviteWallet}
              onChange={(e) => { setInviteWallet(e.target.value); setInviteSuccess(false); }}
              placeholder="0x1234…abcd"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <div className="flex gap-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="editor">Editor — can create and publish docs</option>
                <option value="viewer">Viewer — read access (future use)</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
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
            {inviteError && <p className="text-red-400 text-xs">{inviteError}</p>}
          </form>
        </div>
      )}

      {/* ── Collaborator list ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Access list
        </h2>

        {loading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="h-3.5 w-36 bg-slate-800 rounded" />
                <div className="h-5 w-14 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && space && (
          <div className="space-y-2">
            {/* Owner row */}
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="font-mono text-sm text-slate-300" title={space.owner}>
                {truncate(space.owner)}
                {address?.toLowerCase() === space.owner.toLowerCase() && (
                  <span className="ml-2 text-slate-600">(you)</span>
                )}
              </span>
              <span className="px-2 py-0.5 text-xs bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded font-mono">
                owner
              </span>
            </div>

            {collaborators.map((c) => (
              <div
                key={c.entityKey}
                className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <span className="font-mono text-sm text-slate-300" title={c.wallet}>
                  {truncate(c.wallet)}
                  {address?.toLowerCase() === c.wallet.toLowerCase() && (
                    <span className="ml-2 text-slate-600">(you)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-mono border ${
                      c.role === "editor"
                        ? "bg-emerald-950 text-emerald-500 border-emerald-800/60"
                        : "bg-slate-800 text-slate-500 border-slate-700"
                    }`}
                  >
                    {c.role}
                  </span>
                </div>
              </div>
            ))}

            {collaborators.length === 0 && (
              <p className="text-slate-600 text-xs py-2">
                No collaborators yet. Only you can edit this space.
              </p>
            )}
          </div>
        )}

        <p className="text-slate-700 text-xs mt-4">
          ⏱ Collaborator access is valid for 90 days from grant date (Arkiv TTL).
          Arkiv automatically excludes expired entities from queries.
        </p>
      </div>
    </div>
  );
}
