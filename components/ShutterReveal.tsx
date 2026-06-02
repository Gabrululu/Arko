"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const PANELS = 5;

export function ShutterReveal({ children }: { children: React.ReactNode }) {
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem("arko-intro-done")) {
      panelRefs.current.forEach((p) => { if (p) p.style.display = "none"; });
      return;
    }

    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];

    gsap.set(panels, { yPercent: 0, visibility: "visible" });

    gsap.to(panels, {
      yPercent: -105,
      duration: 1.1,
      ease: "power4.inOut",
      stagger: 0.07,
      delay: 0.25,
      onComplete: () => {
        panels.forEach((p) => { p.style.display = "none"; });
        sessionStorage.setItem("arko-intro-done", "1");
      },
    });
  }, []);

  return (
    <>
      {children}

      {Array.from({ length: PANELS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { panelRefs.current[i] = el; }}
          style={{
            position: "fixed",
            top: 0,
            left: `${(i / PANELS) * 100}%`,
            width: `${100 / PANELS}%`,
            height: "100%",
            backgroundColor: i % 2 === 0 ? "#1f1303" : "#2a1c05",
            zIndex: 99999,
            visibility: "hidden",
            willChange: "transform",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
