"use client";

/**
 * CreateSpaceButton — modal form for space creation.
 *
 * After the space entity is created on Arkiv, we redirect to the new-doc
 * editor so the user immediately starts writing. The slug from the form
 * becomes part of the URL.
 */

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useRouter } from "next/navigation";
import { createSigningClient } from "@/lib/arkiv/client";
import { createSpace } from "@/lib/arkiv/spaces";

export function CreateSpaceButton() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    visibility: "public" as "public" | "private",
  });

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      // Auto-generate slug from name: lowercase, spaces→hyphens, strip non-alphanumeric
      slug: name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
  }

  function reset() {
    setForm({ name: "", description: "", slug: "", visibility: "public" });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletClient || !address) {
      setError("Wallet not connected.");
      return;
    }
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const arkivClient = createSigningClient(walletClient);
      await createSpace(arkivClient, { ...form, owner: address });
      setOpen(false);
      reset();
      // Go straight to the new-doc editor so the user can start writing.
      router.push(`/dashboard/${form.slug}/new/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <button
        disabled
        title="Connect your wallet first"
        className="px-5 py-2.5 bg-indigo-600/40 text-white/40 text-sm font-medium rounded-lg cursor-not-allowed select-none"
      >
        Create space
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        + Create space
      </button>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setOpen(false); reset(); }}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">New space</h2>
              <p className="text-slate-500 text-xs mt-1">
                Owned by{" "}
                <span className="font-mono text-indigo-400">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
                {" "}· stored on Arkiv, expires in 365 days
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Space name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Protocol Docs"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Slug
                  <span className="ml-2 font-mono text-slate-600 font-normal">
                    /docs/{form.slug || "…"}
                  </span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="my-protocol"
                  required
                  pattern="[a-z0-9][a-z0-9-]*"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Description <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="A short description of this space…"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Visibility
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, visibility: e.target.value as "public" | "private" }))
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="public">Public — listed on the homepage</option>
                  <option value="private">Private — hidden from public listing</option>
                </select>
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset(); }}
                  className="flex-1 px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-lg hover:border-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create space"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
