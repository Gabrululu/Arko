"use client"

import { useEffect, useState } from "react"

interface Heading {
  id: string
  text: string
  level: number  // 1, 2, or 3
}

function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split("\n")
  const headings: Heading[] = []

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      // Generate slug same way rehype does
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
      headings.push({ id, text, level })
    }
  }

  return headings
}

export function TableOfContents({ content }: { content: string }) {
  const headings = extractHeadings(content)
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    )

    // Observe all heading elements in the doc
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null // not worth showing for very short docs

  return (
    <nav
      className="toc-sidebar"
      style={{
        position: "sticky",
        top: "6rem",
        maxHeight: "calc(100vh - 8rem)",
        overflowY: "auto",
        paddingLeft: "1.5rem",
        borderLeft: "1px solid rgba(255,252,246,0.1)",
      }}
    >
      <p style={{
        fontSize: "0.7rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,252,246,0.3)",
        marginBottom: "0.75rem",
        fontFamily: "monospace",
      }}>
        On this page
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {headings.map((h) => (
          <li key={h.id} style={{ margin: "0.25rem 0" }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
                setActiveId(h.id)
              }}
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: activeId === h.id
                  ? "#fffcf6"
                  : "rgba(255,252,246,0.4)",
                textDecoration: "none",
                paddingLeft: h.level === 1 ? "0" : h.level === 2 ? "0.75rem" : "1.5rem",
                paddingTop: "0.2rem",
                paddingBottom: "0.2rem",
                borderLeft: activeId === h.id
                  ? "2px solid #fffcf6"
                  : "2px solid transparent",
                marginLeft: "-1px",
                transition: "color 0.15s, border-color 0.15s",
                lineHeight: 1.4,
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}