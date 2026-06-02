"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { listSpacesByOwner, type Space } from "@/lib/arkiv/spaces";
import { listDocsInSpace, type Doc } from "@/lib/arkiv/docs";
import { Search, FileText, FolderOpen, ArrowRight } from "lucide-react";
import { gsap } from "gsap";

interface Result {
  id: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [docs, setDocs] = useState<{ doc: Doc; spaceName: string; spaceSlug: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { address } = useAccount();

  // Load data once opened
  useEffect(() => {
    if (!open || loaded || !address) return;
    async function load() {
      const mySpaces = await listSpacesByOwner(address!).catch(() => []);
      setSpaces(mySpaces);
      const allDocs: typeof docs = [];
      await Promise.all(
        mySpaces.map(async (s) => {
          const spaceDocs = await listDocsInSpace(s.entityKey).catch(() => []);
          spaceDocs.forEach((d) => allDocs.push({ doc: d, spaceName: s.name, spaceSlug: s.slug }));
        })
      );
      setDocs(allDocs);
      setLoaded(true);
    }
    load();
  }, [open, loaded, address]);

  // Filter
  useEffect(() => {
    const q = query.toLowerCase();
    const spaceResults: Result[] = spaces
      .filter((s) => s.name.toLowerCase().includes(q) || s.slug.includes(q))
      .slice(0, 4)
      .map((s) => ({
        id: `space-${s.entityKey}`,
        label: s.name,
        sub: `/docs/${s.slug}`,
        icon: <FolderOpen size={14} className="text-[#ad9a6f]" />,
        href: `/docs/${s.slug}`,
      }));

    const docResults: Result[] = docs
      .filter(
        ({ doc, spaceName }) =>
          doc.title.toLowerCase().includes(q) ||
          doc.slug.includes(q) ||
          spaceName.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(({ doc, spaceName, spaceSlug }) => ({
        id: `doc-${doc.entityKey}`,
        label: doc.title,
        sub: `${spaceName} · v${doc.version}`,
        icon: <FileText size={14} className="text-[#ad9a6f]" />,
        href: `/docs/${spaceSlug}/${doc.slug}`,
      }));

    setResults([...spaceResults, ...docResults]);
    setActive(0);
  }, [query, spaces, docs]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter" && results[active]) {
        router.push(results[active].href);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, active, router]);

  // Custom event from Sidebar
  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-command-palette", handler);
    return () => document.removeEventListener("open-command-palette", handler);
  }, []);

  // Focus input
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [open]);

  // Animate
  useEffect(() => {
    if (!panelRef.current || !backdropRef.current) return;
    if (open) {
      gsap.set(panelRef.current, { scale: 0.96, opacity: 0, y: -8 });
      gsap.to(panelRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.15 });
    } else {
      gsap.to(panelRef.current, { scale: 0.96, opacity: 0, y: -8, duration: 0.15, ease: "power2.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.15 });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99990] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        style={{ opacity: 0 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-xl bg-[#fcfcfc] border border-[#d4c9b0] rounded-2xl shadow-2xl overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e0d9cc]">
          <Search size={16} className="text-[#ad9a6f] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spaces, docs…"
            className="flex-1 bg-transparent text-[#615050] placeholder-[#c4b89a] outline-none text-sm"
          />
          <kbd className="text-[10px] font-mono bg-[#f0ebe0] px-1.5 py-0.5 rounded text-[#ad9a6f]">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {!loaded && address && (
            <p className="px-4 py-3 text-sm text-[#ad9a6f] italic">Loading…</p>
          )}
          {loaded && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-[#ad9a6f] text-center">No results for &ldquo;{query}&rdquo;</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => { router.push(r.href); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === active ? "bg-[#f5f1e8]" : "hover:bg-[#faf7f2]"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-[#f0ebe0] border border-[#d4c9b0] flex items-center justify-center flex-shrink-0">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#615050] font-medium truncate">{r.label}</p>
                {r.sub && <p className="text-[11px] text-[#ad9a6f] font-mono">{r.sub}</p>}
              </div>
              <ArrowRight size={12} className="text-[#c4b89a] flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e0d9cc] px-4 py-2 flex items-center gap-4 text-[10px] text-[#ad9a6f]">
          <span><kbd className="font-mono bg-[#f0ebe0] px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-[#f0ebe0] px-1 rounded">↵</kbd> open</span>
          <span><kbd className="font-mono bg-[#f0ebe0] px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
