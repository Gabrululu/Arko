"use client"

import { useState } from "react"

interface Props {
  spaceSlug: string
  docSlug: string
  blockNumber: number
  version: number
  isSnapshot?: boolean
}

export function ShareSnapshotButton({
  spaceSlug,
  docSlug,
  blockNumber,
  version,
  isSnapshot = false
}: Props) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = `${window.location.origin}/docs/${spaceSlug}/${docSlug}?atBlock=${blockNumber}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      title={`Share permanent link to ${isSnapshot ? 'this snapshot' : `v${version}`} at block #${blockNumber}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        fontSize: "0.72rem",
        border: "1px solid rgba(255,252,246,0.2)",
        borderRadius: "999px",
        background: "transparent",
        color: copied ? "#4ade80" : "rgba(255,252,246,0.6)",
        cursor: "pointer",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "color 0.2s, border-color 0.2s",
        fontFamily: "monospace",
      }}
    >
      <span>{copied ? "✓" : "⎘"}</span>
      <span>{copied ? "Copied!" : isSnapshot ? "Share snapshot" : `Share v${version}`}</span>
    </button>
  )
}