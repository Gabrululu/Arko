export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet"
  | "numbered"
  | "todo"
  | "code"
  | "quote"
  | "callout"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;      // todo
  language?: string;      // code
  emoji?: string;         // callout
  indent?: number;        // bullet/numbered nesting
}

export interface DocPayload {
  title: string;
  icon?: string;
  cover?: string;
  blocks: Block[];
  // legacy markdown support
  content?: string;
}

export function createBlock(type: BlockType, content = ""): Block {
  return { id: crypto.randomUUID(), type, content };
}

export function isLegacyPayload(payload: unknown): payload is { title: string; content: string } {
  return typeof payload === "object" && payload !== null && "content" in payload && !("blocks" in payload);
}

export function migrateToBlocks(payload: { title: string; content: string }): DocPayload {
  const paragraphs = payload.content.split("\n\n").filter(Boolean);
  const blocks: Block[] = paragraphs.map((text) => {
    if (text.startsWith("# ")) return createBlock("heading1", text.slice(2));
    if (text.startsWith("## ")) return createBlock("heading2", text.slice(3));
    if (text.startsWith("### ")) return createBlock("heading3", text.slice(4));
    if (text.startsWith("- ") || text.startsWith("* ")) return createBlock("bullet", text.slice(2));
    if (text.startsWith("> ")) return createBlock("quote", text.slice(2));
    if (text.startsWith("```")) return createBlock("code", text.replace(/```\w*\n?/g, "").trim());
    return createBlock("paragraph", text);
  });
  return { title: payload.title, blocks: blocks.length ? blocks : [createBlock("paragraph")] };
}

export const BLOCK_LABELS: Record<BlockType, { label: string; icon: string; desc: string }> = {
  paragraph:  { label: "Text",        icon: "¶",  desc: "Plain text paragraph" },
  heading1:   { label: "Heading 1",   icon: "H1", desc: "Big section heading" },
  heading2:   { label: "Heading 2",   icon: "H2", desc: "Medium heading" },
  heading3:   { label: "Heading 3",   icon: "H3", desc: "Small heading" },
  bullet:     { label: "Bullet list", icon: "•",  desc: "Bulleted list item" },
  numbered:   { label: "Numbered",    icon: "1.", desc: "Numbered list item" },
  todo:       { label: "To-do",       icon: "☐",  desc: "Checkbox task" },
  code:       { label: "Code",        icon: "</>", desc: "Code block" },
  quote:      { label: "Quote",       icon: "❝",  desc: "Blockquote" },
  callout:    { label: "Callout",     icon: "💡", desc: "Highlighted callout box" },
  divider:    { label: "Divider",     icon: "—",  desc: "Horizontal separator" },
};
