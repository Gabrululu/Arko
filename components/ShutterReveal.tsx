"use client"

import { useEffect, useRef } from "react"

export function ShutterReveal({ children }: { children: React.ReactNode }) {
  const curtainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const curtain = curtainRef.current
    if (!curtain) return

    // Skip if already played this session
    if (sessionStorage.getItem("arko-intro-done")) {
      curtain.style.display = "none"
      return
    }

    // Start: curtain covers full screen
    curtain.style.transform = "translateY(0%)"
    curtain.style.visibility = "visible"

    // After brief pause, animate curtain upward
    const t = setTimeout(() => {
      curtain.style.transition = "transform 1.6s cubic-bezier(0.76, 0, 0.24, 1)"
      curtain.style.transform = "translateY(-100%)"

      // After animation ends, remove from DOM
      const t2 = setTimeout(() => {
        curtain.style.display = "none"
        sessionStorage.setItem("arko-intro-done", "1")
      }, 1700)

      return () => clearTimeout(t2)
    }, 300)

    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {children}

      {/* Single solid curtain panel — slides up on load */}
      <div
        ref={curtainRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#1f1303",
          zIndex: 99999,
          visibility: "hidden",
          transform: "translateY(0%)",
          willChange: "transform",
          pointerEvents: "none",
        }}
      />
    </>
  )
}
