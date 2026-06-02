"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

const PANELS = 10;

export function ShutterReveal({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const doneRef = useRef(false);

  // useLayoutEffect runs synchronously before paint — returning visitors
  // never see a flash of the overlay.
  useLayoutEffect(() => {
    if (sessionStorage.getItem("arko-intro-done")) {
      doneRef.current = true;
      if (overlayRef.current) overlayRef.current.style.display = "none";
    }
  }, []);

  useEffect(() => {
    if (doneRef.current) return;

    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];

    gsap.to(panels, {
      yPercent: -105,
      duration: 0.8,
      ease: "power2.inOut",
      stagger: 0.055,
      delay: 0.3,
      onComplete: () => {
        if (overlayRef.current) overlayRef.current.style.display = "none";
        sessionStorage.setItem("arko-intro-done", "1");
      },
    });
  }, []);

  return (
    <>
      {children}

      {/* Fixed overlay — sits on top of everything, panels are horizontal slats */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: PANELS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { panelRefs.current[i] = el; }}
            style={{
              position: "absolute",
              left: 0,
              // +2px prevents hairline gaps between slats
              top: `calc(${(i / PANELS) * 100}% - 1px)`,
              width: "100%",
              height: `calc(${100 / PANELS}% + 2px)`,
              backgroundColor: i % 2 === 0 ? "#1f1303" : "#241604",
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </>
  );
}
