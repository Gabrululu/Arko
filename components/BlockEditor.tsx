"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  KeyboardEvent,
} from "react";
import { type Block, type BlockType, createBlock, BLOCK_LABELS } from "@/lib/blocks";

// ── Slash command menu ─────────────────────────────────────────────────────────

const SLASH_ITEMS: BlockType[] = [
  "paragraph","heading1","heading2","heading3",
  "bullet","numbered","todo","code","quote","callout","divider",
];

interface SlashMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

function SlashMenu({ query, position, onSelect, onClose }: SlashMenuProps) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = SLASH_ITEMS.filter((t) =>
    BLOCK_LABELS[t].label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setActive(0); }, [query]);

  // Scroll active item into view inside the list container
  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); if (filtered[active]) onSelect(filtered[active]); }
      if (e.key === "Escape")    { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, filtered, onSelect, onClose]);

  if (!filtered.length) return null;

  return (
    <div
      style={{ top: position.top, left: position.left }}
      className="fixed z-[9999] w-64 bg-white dark:bg-[#1e1508] border border-[#e0d9cc] dark:border-[#3a3020] rounded-xl shadow-2xl shadow-black/10 overflow-hidden"
    >
      {/* Header — fijo, no scrollea */}
      <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#ad9a6f] dark:text-[#c4a97a] font-bold border-b border-[#f0ebe0] dark:border-[#2e2818]">
        Blocks
      </p>

      {/* Lista scrolleable — máximo 5 ítems visibles */}
      <div ref={listRef} className="overflow-y-auto max-h-[260px] py-1">
        {filtered.map((type, i) => {
          const { label, icon, desc } = BLOCK_LABELS[type];
          return (
            <button
              key={type}
              ref={(el) => { itemRefs.current[i] = el; }}
              onMouseDown={(e) => { e.preventDefault(); onSelect(type); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                i === active ? "bg-[#f5f1e8] dark:bg-[#2a2010]" : "hover:bg-[#faf7f2] dark:hover:bg-[#251c0a]"
              }`}
            >
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#f0ebe0] dark:bg-[#2e2410] text-[#615050] dark:text-[#c8b898] text-xs font-bold flex-shrink-0">
                {icon}
              </span>
              <div>
                <p className="text-sm text-[#615050] dark:text-[#f5f0e8] font-medium leading-none mb-0.5">{label}</p>
                <p className="text-[10px] text-[#ad9a6f] dark:text-[#c4a97a]">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Single block renderer / editor ────────────────────────────────────────────

interface BlockItemProps {
  block: Block;
  index: number;
  isFocused: boolean;
  onChange: (id: string, partial: Partial<Block>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>, id: string) => void;
  onFocus: (id: string) => void;
  onSlash: (id: string, rect: DOMRect) => void;
}

function BlockItem({ block, index, isFocused, onChange, onKeyDown, onFocus, onSlash }: BlockItemProps) {
  const ref = useRef<HTMLDivElement & HTMLTextAreaElement & HTMLInputElement>(null);
  // Prevents clobbering the cursor when the user is actively typing.
  // Set to true in handleInput, cleared after the layout effect runs.
  const skipDomSyncRef = useRef(false);

  // Sync block.content → DOM only when the change comes from outside (e.g. initial
  // load, undo). When the user types, skipDomSyncRef prevents the innerHTML reset
  // that would destroy the cursor position.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || skipDomSyncRef.current) {
      skipDomSyncRef.current = false;
      return;
    }
    if (el.contentEditable === "true" && el.textContent !== block.content) {
      el.textContent = block.content;
    }
  }, [block.content]);

  useEffect(() => {
    if (isFocused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      // Move caret to end
      if (ref.current.contentEditable === "true") {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    skipDomSyncRef.current = true; // block the layout effect from resetting innerHTML
    const text = (e.currentTarget.textContent ?? "").replace(/​/g, "");
    // Detect "/" at start
    if (text === "/") {
      const rect = e.currentTarget.getBoundingClientRect();
      onSlash(block.id, rect);
    }
    onChange(block.id, { content: text });
  };

  const baseDiv =
    "w-full outline-none break-words whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-[#b0a088] empty:before:pointer-events-none";

  if (block.type === "divider") {
    return (
      <div className="py-4 cursor-default group" onClick={() => onFocus(block.id)}>
        <hr className="border-[#d4c9b0] group-hover:border-[#ad9a6f] transition-colors" />
      </div>
    );
  }

  if (block.type === "todo") {
    return (
      <div className="flex items-start gap-2.5 py-0.5 group">
        <input
          type="checkbox"
          checked={block.checked ?? false}
          onChange={(e) => onChange(block.id, { checked: e.target.checked })}
          className="mt-1 w-4 h-4 rounded border-[#c4b89a] text-[#615050] cursor-pointer accent-[#615050]"
        />
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="To-do…"
          onInput={handleInput}
          onKeyDown={(e) => onKeyDown(e, block.id)}
          onFocus={() => onFocus(block.id)}
          className={`${baseDiv} text-[#615050] ${block.checked ? "line-through text-[#ad9a6f]" : ""}`}
        />
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="relative rounded-xl bg-[#1a1508] dark:bg-[#141008] border border-[#2a2318] dark:border-[#2e2818] my-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2318] dark:border-[#2e2818]">
          <span className="text-[10px] font-mono text-[#6a5f52] dark:text-[#5a5040] uppercase tracking-wider">code</span>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2a2318] dark:bg-[#2e2818]" />
            <span className="w-3 h-3 rounded-full bg-[#2a2318] dark:bg-[#2e2818]" />
            <span className="w-3 h-3 rounded-full bg-[#2a2318] dark:bg-[#2e2818]" />
          </div>
        </div>
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          value={block.content}
          onChange={(e) => onChange(block.id, { content: e.target.value })}
          onFocus={() => onFocus(block.id)}
          placeholder="// code here…"
          rows={Math.max(3, block.content.split("\n").length + 1)}
          className="w-full bg-transparent px-4 py-3 text-sm font-mono text-[#F5F0E8] outline-none resize-none placeholder-[#4a4030]"
          spellCheck={false}
        />
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <div className="flex gap-3 py-0.5">
        <div className="w-1 flex-shrink-0 rounded-full bg-[#ad9a6f]" />
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Quote…"
          onInput={handleInput}
          onKeyDown={(e) => onKeyDown(e, block.id)}
          onFocus={() => onFocus(block.id)}
          className={`${baseDiv} text-[#776a6a] italic text-lg`}
        />
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="flex gap-3 p-4 rounded-xl bg-[#f5f1e8] dark:bg-[#251c0a] border border-[#d4c9b0] dark:border-[#3a3020] my-1">
        <span className="text-xl flex-shrink-0">{block.emoji ?? "💡"}</span>
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write a callout…"
          onInput={handleInput}
          onKeyDown={(e) => onKeyDown(e, block.id)}
          onFocus={() => onFocus(block.id)}
          className={`${baseDiv} text-[#615050]`}
        />
      </div>
    );
  }

  const styleMap: Record<string, string> = {
    heading1: "text-3xl font-bold text-[#1a1508] dark:text-[#f5f0e8] font-serif mt-6",
    heading2: "text-2xl font-semibold text-[#2a1c05] dark:text-[#e8e0d0] font-serif mt-5",
    heading3: "text-xl font-semibold text-[#3a2f22] dark:text-[#d8d0c0] font-serif mt-4",
    bullet:   "text-[#615050] dark:text-[#c8b898]",
    numbered: "text-[#615050] dark:text-[#c8b898]",
    paragraph: "text-[#615050] dark:text-[#c8b898] leading-relaxed",
  };

  const placeholders: Record<string, string> = {
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bullet:   "List item…",
    numbered: "List item…",
    paragraph: index === 0 ? "Write something, or type '/' for commands…" : "Type '/' for commands…",
  };

  const prefix =
    block.type === "bullet" ? (
      <span className="mr-2 text-[#ad9a6f] dark:text-[#c4a97a] flex-shrink-0">•</span>
    ) : block.type === "numbered" ? (
      <span className="mr-2 text-[#ad9a6f] dark:text-[#c4a97a] flex-shrink-0 font-mono text-sm">{index + 1}.</span>
    ) : null;

  return (
    <div className={`flex items-start py-0.5 ${block.indent ? `pl-${Math.min(block.indent * 6, 24)}` : ""}`}>
      {prefix}
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholders[block.type] ?? "…"}
        onInput={handleInput}
        onKeyDown={(e) => onKeyDown(e, block.id)}
        onFocus={() => onFocus(block.id)}
        className={`${baseDiv} ${styleMap[block.type] ?? "text-[#615050]"}`}
      />
    </div>
  );
}

// ── Main BlockEditor ───────────────────────────────────────────────────────────

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  readOnly?: boolean;
}

export function BlockEditor({ blocks, onChange, readOnly = false }: BlockEditorProps) {
  const [focusedId, setFocusedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [slashMenu, setSlashMenu] = useState<{
    blockId: string;
    position: { top: number; left: number };
    query: string;
  } | null>(null);

  const update = useCallback(
    (id: string, partial: Partial<Block>) => {
      onChange(blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)));
    },
    [blocks, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, id: string) => {
      const idx = blocks.findIndex((b) => b.id === id);
      const block = blocks[idx];

      // Close slash menu on any navigation key
      if (slashMenu && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape")) {
        return; // handled by SlashMenu
      }

      if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
        e.preventDefault();
        const newBlock = createBlock("paragraph");
        const next = [...blocks];
        next.splice(idx + 1, 0, newBlock);
        onChange(next);
        setFocusedId(newBlock.id);
        setSlashMenu(null);
      }

      if (e.key === "Backspace") {
        const el = e.currentTarget as HTMLElement;
        const text = el.textContent ?? "";
        if (text === "" || text === "/") {
          if (blocks.length > 1) {
            e.preventDefault();
            const next = blocks.filter((b) => b.id !== id);
            onChange(next);
            const prevId = blocks[Math.max(0, idx - 1)]?.id;
            setFocusedId(prevId ?? next[0]?.id ?? null);
          }
          setSlashMenu(null);
        } else {
          setSlashMenu(null);
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (block.type === "bullet" || block.type === "numbered") {
          update(id, { indent: Math.min((block.indent ?? 0) + (e.shiftKey ? -1 : 1), 4) });
        }
      }

      // Arrow up/down between blocks
      if (e.key === "ArrowUp" && idx > 0) {
        const sel = window.getSelection();
        if (sel?.anchorOffset === 0) {
          e.preventDefault();
          setFocusedId(blocks[idx - 1].id);
        }
      }
      if (e.key === "ArrowDown" && idx < blocks.length - 1) {
        setFocusedId(blocks[idx + 1].id);
      }
    },
    [blocks, onChange, slashMenu, update]
  );

  const handleSlash = useCallback((id: string, rect: DOMRect) => {
    setSlashMenu({
      blockId: id,
      position: { top: rect.bottom + 4, left: rect.left },
      query: "",
    });
  }, []);

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      if (!slashMenu) return;
      const { blockId } = slashMenu;
      onChange(
        blocks.map((b) =>
          b.id === blockId ? { ...b, type, content: "", checked: false } : b
        )
      );
      setSlashMenu(null);
      setFocusedId(blockId);
    },
    [blocks, onChange, slashMenu]
  );

  // Update slash query as user types after "/"
  useEffect(() => {
    if (!slashMenu) return;
    const block = blocks.find((b) => b.id === slashMenu.blockId);
    if (!block) { setSlashMenu(null); return; }
    const text = block.content;
    if (!text.startsWith("/")) { setSlashMenu(null); return; }
    setSlashMenu((prev) => prev ? { ...prev, query: text.slice(1) } : null);
  }, [blocks, slashMenu]);

  if (readOnly) {
    return (
      <div className="space-y-1">
        {blocks.map((block, i) => (
          <ReadOnlyBlock key={block.id} block={block} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative space-y-1">
      {blocks.map((block, i) => (
        <BlockItem
          key={block.id}
          block={block}
          index={i}
          isFocused={focusedId === block.id}
          onChange={update}
          onKeyDown={handleKeyDown}
          onFocus={setFocusedId}
          onSlash={handleSlash}
        />
      ))}

      {slashMenu && (
        <SlashMenu
          query={slashMenu.query}
          position={slashMenu.position}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}

      {/* Add block button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          const newBlock = createBlock("paragraph");
          onChange([...blocks, newBlock]);
          setFocusedId(newBlock.id);
        }}
        className="w-full mt-2 py-2 text-left text-[#8a7a6a] dark:text-[#6a5f52] text-sm hover:text-[#ad9a6f] dark:hover:text-[#c4a97a] transition-colors flex items-center gap-2 group"
      >
        <span className="w-5 h-5 rounded border border-[#d4c9b0] dark:border-[#3a3020] group-hover:border-[#ad9a6f] dark:group-hover:border-[#c4a97a] flex items-center justify-center text-xs transition-colors">+</span>
        <span className="text-xs">Add a block</span>
      </button>
    </div>
  );
}

// ── Read-only block renderer ───────────────────────────────────────────────────

function ReadOnlyBlock({ block, index }: { block: Block; index: number }) {
  if (block.type === "divider") return <hr className="border-[#d4c9b0] my-4" />;

  if (block.type === "heading1")
    return <h1 className="text-3xl font-bold text-[#1a1508] font-serif mt-8 mb-2">{block.content}</h1>;
  if (block.type === "heading2")
    return <h2 className="text-2xl font-semibold text-[#2a1c05] font-serif mt-6 mb-2">{block.content}</h2>;
  if (block.type === "heading3")
    return <h3 className="text-xl font-semibold text-[#3a2f22] font-serif mt-5 mb-1">{block.content}</h3>;

  if (block.type === "bullet")
    return (
      <div className="flex gap-2 py-0.5" style={{ paddingLeft: `${(block.indent ?? 0) * 1.5}rem` }}>
        <span className="text-[#ad9a6f] mt-[2px]">•</span>
        <p className="text-[#615050] leading-relaxed">{block.content}</p>
      </div>
    );

  if (block.type === "numbered")
    return (
      <div className="flex gap-2 py-0.5" style={{ paddingLeft: `${(block.indent ?? 0) * 1.5}rem` }}>
        <span className="text-[#ad9a6f] font-mono text-sm min-w-[1.5rem]">{index + 1}.</span>
        <p className="text-[#615050] leading-relaxed">{block.content}</p>
      </div>
    );

  if (block.type === "todo")
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        <input type="checkbox" checked={block.checked} readOnly className="mt-1 w-4 h-4 accent-[#615050]" />
        <p className={`text-[#615050] ${block.checked ? "line-through text-[#ad9a6f]" : ""}`}>{block.content}</p>
      </div>
    );

  if (block.type === "code")
    return (
      <div className="rounded-xl bg-[#1a1508] border border-[#2a2318] my-3 overflow-hidden">
        <div className="px-4 py-2 border-b border-[#2a2318] flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#3a2f22]" />
          <span className="w-3 h-3 rounded-full bg-[#3a2f22]" />
          <span className="w-3 h-3 rounded-full bg-[#3a2f22]" />
        </div>
        <pre className="px-4 py-3 text-sm font-mono text-[#F5F0E8] overflow-x-auto whitespace-pre">{block.content}</pre>
      </div>
    );

  if (block.type === "quote")
    return (
      <div className="flex gap-3 py-1 my-2">
        <div className="w-1 flex-shrink-0 rounded-full bg-[#ad9a6f]" />
        <p className="text-[#776a6a] italic text-lg">{block.content}</p>
      </div>
    );

  if (block.type === "callout")
    return (
      <div className="flex gap-3 p-4 rounded-xl bg-[#f5f1e8] border border-[#d4c9b0] my-2">
        <span className="text-xl">{block.emoji ?? "💡"}</span>
        <p className="text-[#615050]">{block.content}</p>
      </div>
    );

  return <p className="text-[#615050] leading-relaxed py-0.5">{block.content}</p>;
}
