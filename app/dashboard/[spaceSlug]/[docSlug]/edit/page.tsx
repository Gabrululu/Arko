"use client";

/**
 * Doc editor — /dashboard/[spaceSlug]/[docSlug]/edit
 *
 * Handles both creating a new doc (docSlug = "new") and editing an existing one.
 * On save, it ALWAYS creates a new Arkiv entity — never updates. The version
 * number is incremented from the current highest version for this slug.
 *
 * Core invariant: every save → new entity → version N+1.
 * Never call updateEntity. This is what gives Arko immutable version history.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { Editor } from "@/components/Editor";
import { createSigningClient } from "@/lib/arkiv/client";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { getLatestDoc, saveDoc, getNextVersion, type Doc } from "@/lib/arkiv/docs";
import { canEditSpace } from "@/lib/arkiv/collaborators";
import Link from "next/link";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const spaceSlug = params.spaceSlug as string;
  const docSlug = params.docSlug as string;
  const isNew = docSlug === "new";

  // ── Data state ────────────────────────────────────────────────────────
  const [space, setSpace] = useState<Space | null>(null);
  const [existing, setExisting] = useState<Doc | null>(null);
  const [nextVersion, setNextVersion] = useState<number>(1);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(isNew ? "" : docSlug);
  const [content, setContent] = useState("");

  // ── Save state ────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Load space + existing doc + permissions ────────────────────────────
  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        if (!s) { setLoadError(`Space "${spaceSlug}" not found.`); return; }
        setSpace(s);

        const [allowed, nv] = await Promise.all([
          canEditSpace(s.entityKey, address!, s.owner),
          isNew ? Promise.resolve(1) : getNextVersion(s.entityKey, docSlug),
        ]);
        setCanEdit(allowed);
        setNextVersion(nv);

        if (!isNew) {
          const doc = await getLatestDoc(s.entityKey, docSlug);
          if (doc) {
            setExisting(doc);
            setTitle(doc.title);
            setContent(doc.content);
            setSlug(doc.slug);
          }
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load editor.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, spaceSlug, docSlug, isNew]);

  // ── Auto-generate slug from title (new docs only) ─────────────────────
  function handleTitleChange(val: string) {
    setTitle(val);
    if (isNew) {
      setSlug(
        val
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave(status: "draft" | "published") {
    if (!walletClient || !address || !space) return;
    if (!title.trim()) { setSaveError("Title is required."); return; }
    if (!slug.trim()) { setSaveError("Slug is required."); return; }

    setSaving(true);
    setSaveError(null);
    try {
      const targetSlug = slug.trim();
      // Recalculate next version for the final slug in case user changed it
      const versionToUse = await getNextVersion(space.entityKey, targetSlug);
      setNextVersion(versionToUse);

      const arkivClient = createSigningClient(walletClient);
      await saveDoc(arkivClient, {
        title: title.trim(),
        content,
        slug: targetSlug,
        spaceId: space.entityKey,
        version: versionToUse,
        author: address,
        status,
      });

      if (status === "published") {
        // After publishing, go to the live doc.
        router.push(`/docs/${spaceSlug}/${targetSlug}`);
      } else {
        // For drafts: update URL if slug changed from "new"
        if (isNew) {
          router.replace(`/dashboard/${spaceSlug}/${targetSlug}/edit`);
        }
        // Refresh the next version number
        setNextVersion(versionToUse + 1);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl mb-4">
          🔐
        </div>
        <p className="text-white font-semibold">Connect your wallet to edit docs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse max-w-4xl">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-10 bg-slate-800 rounded-lg" />
          <div className="h-10 bg-slate-800 rounded-lg" />
        </div>
        <div className="h-[520px] bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 space-y-2">
        <p className="text-red-400 text-sm">{loadError}</p>
        <Link href="/dashboard" className="text-indigo-400 text-xs hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!space) return null;

  if (!canEdit) {
    return (
      <div className="py-8 space-y-2">
        <p className="text-red-400 text-sm">
          You don&apos;t have permission to edit &ldquo;{space.name}&rdquo;.
        </p>
        <p className="text-slate-600 text-xs">
          Ask the space owner ({space.owner.slice(0, 6)}…{space.owner.slice(-4)}) to add you as a collaborator.
        </p>
        <Link href="/dashboard" className="text-indigo-400 text-xs hover:underline block mt-2">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/${spaceSlug}`} className="hover:text-white transition-colors">
          {space.name}
        </Link>
        <span>/</span>
        <span className="text-slate-300">
          {isNew ? "New doc" : (existing?.title || docSlug)}
        </span>
      </nav>

      {/* ── Version badge ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 bg-indigo-950 border border-indigo-800/60 text-indigo-400 text-xs font-mono rounded-lg">
          Creating version {nextVersion}
        </span>
        {existing && (
          <span className="text-slate-600 text-xs">
            Latest on-chain: v{existing.version} · block {existing.blockNumber.toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Metadata fields ────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Getting Started"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Slug
            <span className="ml-2 font-mono text-slate-600 font-normal">
              /docs/{spaceSlug}/{slug || "…"}
            </span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="getting-started"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Markdown editor ────────────────────────────────────────────── */}
      <Editor value={content} onChange={setContent} height={520} />

      {/* ── Immutability note ──────────────────────────────────────────── */}
      <p className="text-xs text-slate-600">
        Each save creates a new immutable Arkiv entity. Publishing redirects to the live doc.
        Drafts stay here for further editing.
      </p>

      {saveError && (
        <p className="text-red-400 text-sm">{saveError}</p>
      )}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="px-5 py-2.5 text-sm text-slate-300 border border-slate-700 rounded-lg hover:border-slate-500 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={saving}
          className="px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing…
            </>
          ) : (
            "Publish"
          )}
        </button>
        {existing && (
          <Link
            href={`/docs/${spaceSlug}/${existing.slug}/history`}
            className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Version history →
          </Link>
        )}
      </div>
    </div>
  );
}
