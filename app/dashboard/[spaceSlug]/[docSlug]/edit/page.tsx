"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { createSigningClient } from "@/lib/arkiv/client";
import { getSpaceBySlug, type Space } from "@/lib/arkiv/spaces";
import { getLatestDoc, saveDoc, getNextVersion, type Doc } from "@/lib/arkiv/docs";
import { useCanEdit } from "@/hooks/useCanEdit";
import { BlockEditor } from "@/components/BlockEditor";
import { type Block, type DocPayload, createBlock, isLegacyPayload, migrateToBlocks } from "@/lib/blocks";
import Link from "next/link";
import { gsap } from "gsap";
import { Check, Clock, Globe, Lock, Smile } from "lucide-react";

const COVER_PRESETS = [
  "linear-gradient(135deg,#1f1303 0%,#3a2f22 100%)",
  "linear-gradient(135deg,#1a1508 0%,#ad9a6f 100%)",
  "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
  "linear-gradient(135deg,#200122 0%,#6f0000 100%)",
  "linear-gradient(135deg,#11998e 0%,#38ef7d 100%)",
  "linear-gradient(135deg,#141e30 0%,#243b55 100%)",
];

const ICON_PRESETS = ["📝","📖","🔒","⚡","🌿","🔬","🎯","💡","🧩","🚀","🌐","🔑"];

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const pageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleSkipSyncRef = useRef(false);

  const spaceSlug = params.spaceSlug as string;
  const docSlug = params.docSlug as string;
  const isNew = docSlug === "new";

  const [space, setSpace] = useState<Space | null>(null);
  const [existing, setExisting] = useState<Doc | null>(null);
  const [nextVersion, setNextVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Document state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(isNew ? "" : docSlug);
  const [icon, setIcon] = useState("📝");
  const [cover, setCover] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([createBlock("paragraph")]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { allowed: canEdit, loading: permissionsLoading } = useCanEdit(
    space?.entityKey || "",
    space?.owner || ""
  );

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const s = await getSpaceBySlug(spaceSlug);
        if (!s) { setLoadError(`Space "${spaceSlug}" not found.`); return; }
        setSpace(s);
        const nv = isNew ? 1 : await getNextVersion(s.entityKey, docSlug);
        setNextVersion(nv);
        if (!isNew) {
          const doc = await getLatestDoc(s.entityKey, docSlug);
          if (doc) {
            setExisting(doc);
            setTitle(doc.title);
            setSlug(doc.slug);
            setIcon(doc.icon ?? "📝");
            setCover(doc.cover ?? null);
            // Migrate or load blocks
            const raw = doc.payload;
            if (raw && typeof raw === "object" && "blocks" in raw) {
              setBlocks((raw as DocPayload).blocks);
            } else if (isLegacyPayload(raw)) {
              setBlocks(migrateToBlocks(raw).blocks);
            } else if (doc.content) {
              setBlocks(migrateToBlocks({ title: doc.title, content: doc.content }).blocks);
            }
          }
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, spaceSlug, docSlug, isNew]);

  // Sync title into the DOM only on external changes (initial load).
  // While the user types, titleSkipSyncRef prevents the cursor from resetting.
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el || titleSkipSyncRef.current) {
      titleSkipSyncRef.current = false;
      return;
    }
    if (el.textContent !== title) {
      el.textContent = title;
    }
  }, [title]);

  // Page entrance animation
  useEffect(() => {
    if (!pageRef.current || loading) return;
    gsap.fromTo(pageRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
  }, [loading]);

  const handleTitleChange = (val: string) => {
    titleSkipSyncRef.current = true; // prevent DOM clobber while user types
    setTitle(val);
    if (isNew) {
      setSlug(
        val.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const doSave = useCallback(
    async (status: "draft" | "published") => {
      if (!isConnected || !address || !space || !walletClient) return;
      if (!title.trim()) { setSaveError("Title is required."); return; }
      setSaving(true);
      setSaveError(null);
      try {
        const targetSlug = slug.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const versionToUse = await getNextVersion(space.entityKey, targetSlug);
        const payload: DocPayload = { title: title.trim(), icon, cover: cover ?? undefined, blocks };
        const arkivClient = await createSigningClient(walletClient);
        await saveDoc(arkivClient, {
          title: title.trim(),
          content: blocks.map((b) => b.content).join("\n"),
          slug: targetSlug,
          spaceId: space.entityKey,
          version: versionToUse,
          author: address,
          status,
          icon,
          cover: cover ?? undefined,
          payloadOverride: payload,
        });
        setLastSaved(new Date());
        if (status === "published") {
          router.push(`/docs/${spaceSlug}/${targetSlug}`);
        } else if (isNew) {
          router.replace(`/dashboard/${spaceSlug}/${targetSlug}/edit`);
          setNextVersion(versionToUse + 1);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed.");
      } finally {
        setSaving(false);
      }
    },
    [address, blocks, cover, icon, isConnected, isNew, router, slug, space, spaceSlug, title, walletClient]
  );

  // Auto-save draft every 30s when content changes
  const handleBlocksChange = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      if (!isNew && canEdit) {
        const t = setTimeout(() => doSave("draft"), 30000);
        setAutoSaveTimer(t);
      }
    },
    [autoSaveTimer, canEdit, doSave, isNew]
  );

  useEffect(() => () => { if (autoSaveTimer) clearTimeout(autoSaveTimer); }, [autoSaveTimer]);

  if (!mounted || loading || permissionsLoading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-16 animate-pulse space-y-6">
        <div className="h-12 w-3/4 bg-[#ede8dc] dark:bg-[#2e2410] rounded-xl" />
        <div className="space-y-3">
          {[77, 84, 91, 98].map((w, i) => <div key={i} className="h-5 bg-[#ede8dc] dark:bg-[#2e2410] rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="text-4xl mb-4">🔐</div>
        <p className="text-[#615050] dark:text-[#f5f0e8] font-semibold">Connect your wallet to edit.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <p className="text-red-500 text-sm mb-3">{loadError}</p>
        <Link href="/dashboard" className="text-[#ad9a6f] text-xs hover:underline">← Back</Link>
      </div>
    );
  }

  if (!space) return null;

  return (
    <div ref={pageRef} className="flex flex-col min-h-[calc(100vh-64px)]">

      {/* ── Cover ──────────────────────────────────────────────────────────────── */}
      {cover ? (
        <div
          className="w-full h-40 relative group"
          style={{ background: cover }}
        >
          <div className="absolute inset-0 flex items-end justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <button
                onClick={() => setShowCoverPicker((s) => !s)}
                className="px-3 py-1.5 bg-black/30 backdrop-blur text-white text-xs rounded-lg hover:bg-black/50 transition-colors"
              >
                Change cover
              </button>
              <button
                onClick={() => setCover(null)}
                className="px-3 py-1.5 bg-black/30 backdrop-blur text-white text-xs rounded-lg hover:bg-black/50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Page content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-8 md:px-16 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#ad9a6f] dark:text-[#c4a97a] mb-8">
          <Link href="/dashboard" className="hover:text-[#615050] dark:hover:text-[#f5f0e8] transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/dashboard/${spaceSlug}`} className="hover:text-[#615050] dark:hover:text-[#f5f0e8] transition-colors">{space.name}</Link>
          <span>/</span>
          <span className="text-[#615050] dark:text-[#f5f0e8]">{isNew ? "New page" : (existing?.title || docSlug)}</span>
        </nav>

        {/* Access denied */}
        {!canEdit && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
            <Lock size={14} />
            Read-only — you don&apos;t have edit access to this space.
          </div>
        )}

        {/* Icon row */}
        <div className="relative flex items-center gap-3 mb-2 group">
          <button
            onClick={() => setShowIconPicker((s) => !s)}
            className="text-5xl hover:scale-105 transition-transform cursor-pointer"
            title="Change icon"
          >
            {icon}
          </button>

          {/* Icon picker */}
          {showIconPicker && (
            <div className="absolute top-14 left-0 z-50 bg-white dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] rounded-2xl shadow-xl p-3 flex flex-wrap gap-2 w-64">
              {ICON_PRESETS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setIcon(e); setShowIconPicker(false); }}
                  className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#f5f1e8] dark:hover:bg-[#2e2410] transition-colors"
                >
                  {e}
                </button>
              ))}
              <input
                type="text"
                placeholder="Or type an emoji…"
                className="w-full mt-1 px-2 py-1 text-sm border border-[#d4c9b0] dark:border-[#3a3020] rounded-lg outline-none focus:border-[#ad9a6f] text-[#615050] dark:text-[#f5f0e8] bg-transparent"
                onChange={(e) => { if (e.target.value) setIcon(e.target.value); }}
              />
            </div>
          )}

          {/* Cover/actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            {!cover && (
              <button
                onClick={() => setShowCoverPicker((s) => !s)}
                className="flex items-center gap-1 text-xs text-[#ad9a6f] dark:text-[#c4a97a] hover:text-[#615050] dark:hover:text-[#f5f0e8] border border-[#d4c9b0] dark:border-[#3a3020] px-2.5 py-1 rounded-lg transition-colors"
              >
                <Globe size={11} /> Add cover
              </button>
            )}
            <button
              onClick={() => setShowIconPicker((s) => !s)}
              className="flex items-center gap-1 text-xs text-[#ad9a6f] dark:text-[#c4a97a] hover:text-[#615050] dark:hover:text-[#f5f0e8] border border-[#d4c9b0] dark:border-[#3a3020] px-2.5 py-1 rounded-lg transition-colors"
            >
              <Smile size={11} /> Change icon
            </button>
          </div>
        </div>

        {/* Cover picker */}
        {showCoverPicker && (
          <div className="mb-4 p-3 bg-[#f5f1e8] dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] rounded-xl flex flex-wrap gap-2">
            {COVER_PRESETS.map((g, i) => (
              <button
                key={i}
                onClick={() => { setCover(g); setShowCoverPicker(false); }}
                className="w-16 h-10 rounded-lg border-2 border-transparent hover:border-[#ad9a6f] dark:hover:border-[#c4a97a] transition-all"
                style={{ background: g }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <div
          ref={titleRef}
          contentEditable={canEdit}
          suppressContentEditableWarning
          data-placeholder="Untitled"
          onInput={(e) => handleTitleChange(e.currentTarget.textContent ?? "")}
          className="text-4xl md:text-5xl font-serif text-[#1a1508] dark:text-[#f5f0e8] font-bold leading-tight mb-1
                     outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#b0a088] dark:empty:before:text-[#4a3d2a]
                     break-words"
        />

        {/* Slug */}
        <div className="flex items-center gap-2 mb-8 mt-2">
          <p className="text-[11px] font-mono text-[#8a7a6a] dark:text-[#6a5f52]">
            /docs/{spaceSlug}/{slug || "untitled"}
          </p>
          {isNew && (
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="custom-slug"
              className="text-[11px] font-mono text-[#ad9a6f] dark:text-[#c4a97a] border-b border-dashed border-[#d4c9b0] dark:border-[#3a3020] outline-none bg-transparent focus:border-[#ad9a6f] dark:focus:border-[#c4a97a] px-1"
            />
          )}
          <span className="text-[10px] text-[#8a7a6a] dark:text-[#6a5f52] font-mono">· v{nextVersion}</span>
          {existing && (
            <Link
              href={`/docs/${spaceSlug}/${existing.slug}/history`}
              className="text-[10px] text-[#ad9a6f] dark:text-[#c4a97a] hover:underline ml-auto flex items-center gap-1"
            >
              <Clock size={10} /> History
            </Link>
          )}
        </div>

        {/* Divider */}
        <hr className="border-[#e0d9cc] dark:border-[#2e2818] mb-6" />

        {/* Block editor */}
        <div className="min-h-[400px] pb-32">
          {canEdit ? (
            <BlockEditor blocks={blocks} onChange={handleBlocksChange} />
          ) : (
            <BlockEditor blocks={blocks} onChange={() => {}} readOnly />
          )}
        </div>
      </div>

      {/* ── Save toolbar (sticky bottom) ───────────────────────────────────────── */}
      {canEdit && (
        <div className="sticky bottom-0 z-30 border-t border-[#d4c9b0] dark:border-[#2e2818] bg-[#fcfcfc]/90 dark:bg-[#191209]/90 backdrop-blur-md px-8 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-[#ad9a6f] dark:text-[#c4a97a]">
              {saving && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-[#ad9a6f]/30 border-t-[#ad9a6f] rounded-full animate-spin" />
                  Saving…
                </span>
              )}
              {lastSaved && !saving && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check size={12} /> Saved
                </span>
              )}
              {saveError && <span className="text-red-500 dark:text-red-400">{saveError}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => doSave("draft")}
                disabled={saving}
                className="px-4 py-2 text-xs border border-[#d4c9b0] dark:border-[#3a3020] rounded-xl text-[#776a6a] dark:text-[#9a8870]
                           hover:border-[#ad9a6f] dark:hover:border-[#c4a97a] hover:text-[#615050] dark:hover:text-[#f5f0e8] disabled:opacity-40 transition-all"
              >
                Save draft
              </button>
              <button
                onClick={() => doSave("published")}
                disabled={saving}
                className="px-5 py-2 text-xs bg-[#615050] dark:bg-[#3a2f22] hover:bg-[#4a3d3d] dark:hover:bg-[#4a3d2a] text-white rounded-xl
                           disabled:opacity-40 transition-all font-medium flex items-center gap-2"
              >
                {saving ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Globe size={12} />
                )}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
