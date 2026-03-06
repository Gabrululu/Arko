"use client";

/**
 * Markdown editor wrapper around @uiw/react-md-editor.
 *
 * react-md-editor requires "use client" and cannot be used in Server
 * Components. This wrapper also handles the dynamic import needed to avoid
 * SSR issues with the CodeMirror editor under the hood.
 */

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

// Dynamic import avoids window-related errors during SSR.
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  disabled?: boolean;
}

export function Editor({ value, onChange, height = 500, disabled = false }: EditorProps) {
  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? "")}
        height={height}
        preview="live"
        style={{ background: "transparent" }}
        readOnly={disabled}
      />
    </div>
  );
}
