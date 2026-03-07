"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { listDocsInSpace } from "@/lib/arkiv/docs"
import { getSpaceBySlug } from "@/lib/arkiv/spaces"
import type { Doc } from "@/lib/arkiv/docs"

export default function SearchPage() {
  const { spaceSlug } = useParams<{ spaceSlug: string }>()
  const [query, setQuery] = useState("")
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const space = await getSpaceBySlug(spaceSlug)
        if (!space) return
        const allDocs = await listDocsInSpace(space.entityKey)
        setDocs(allDocs)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [spaceSlug])

  // Filter docs by query — searches title and content
  const results = query.trim().length < 2
    ? []
    : docs.filter(doc => {
        const q = query.toLowerCase()
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.content.toLowerCase().includes(q)
        )
      })

  // Extract a snippet around the first match in content
  function getSnippet(content: string, query: string): string {
    const idx = content.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return content.slice(0, 120) + "…"
    const start = Math.max(0, idx - 60)
    const end = Math.min(content.length, idx + 120)
    return (start > 0 ? "…" : "") + content.slice(start, end) + "…"
  }

  // Highlight matching text in snippet
  function highlight(text: string, query: string): React.ReactNode {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{ background: "rgba(255,252,246,0.2)", color: "#fffcf6", borderRadius: "2px" }}>{part}</mark>
        : part
    )
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "4rem 2rem" }}>

      {/* Search input */}
      <div style={{ marginBottom: "2rem" }}>
        <input
          autoFocus
          type="text"
          placeholder="Search docs…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(255,252,246,0.05)",
            border: "1px solid rgba(255,252,246,0.15)",
            borderRadius: "8px",
            padding: "0.875rem 1.25rem",
            fontSize: "1rem",
            color: "#fffcf6",
            outline: "none",
          }}
        />
        <p style={{
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          color: "rgba(255,252,246,0.3)",
          fontFamily: "monospace",
        }}>
          {loading ? "Loading docs…" : `${docs.length} docs indexed from Arkiv`}
        </p>
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div>
          {results.length === 0 ? (
            <p style={{ color: "rgba(255,252,246,0.4)", fontSize: "0.9rem" }}>
              No results for &quot;{query}&quot;
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {results.map(doc => (
                <li key={doc.entityKey} style={{
                  borderBottom: "1px solid rgba(255,252,246,0.08)",
                  padding: "1.25rem 0",
                }}>
                  <Link
                    href={`/docs/${spaceSlug}/${doc.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <p style={{
                      color: "#fffcf6",
                      fontSize: "1rem",
                      fontWeight: 500,
                      marginBottom: "0.35rem",
                    }}>
                      {highlight(doc.title, query)}
                    </p>
                    <p style={{
                      color: "rgba(255,252,246,0.45)",
                      fontSize: "0.8rem",
                      lineHeight: 1.5,
                      fontFamily: "monospace",
                    }}>
                      {highlight(getSnippet(doc.content, query), query)}
                    </p>
                    <p style={{
                      marginTop: "0.4rem",
                      fontSize: "0.7rem",
                      color: "rgba(255,252,246,0.25)",
                      fontFamily: "monospace",
                    }}>
                      v{doc.version} · block #{doc.blockNumber}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}