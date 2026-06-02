"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100, my = -100;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      gsap.to(dot, { x: mx, y: my, duration: 0.1, ease: "power2.out" });
      gsap.to(ring, { x: mx, y: my, duration: 0.35, ease: "power2.out" });
    };

    const enterLink = () => {
      gsap.to(ring, { scale: 1.8, opacity: 0.6, duration: 0.25 });
      gsap.to(dot, { scale: 0, duration: 0.2 });
    };

    const leaveLink = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25 });
      gsap.to(dot, { scale: 1, duration: 0.2 });
    };

    window.addEventListener("mousemove", move);

    const links = document.querySelectorAll("a, button");
    links.forEach((el) => {
      el.addEventListener("mouseenter", enterLink);
      el.addEventListener("mouseleave", leaveLink);
    });

    // Observe new interactive elements
    const observer = new MutationObserver(() => {
      document.querySelectorAll("a, button").forEach((el) => {
        el.removeEventListener("mouseenter", enterLink);
        el.removeEventListener("mouseleave", leaveLink);
        el.addEventListener("mouseenter", enterLink);
        el.addEventListener("mouseleave", leaveLink);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998] hidden md:block"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="w-2 h-2 rounded-full bg-[#fffcf6] mix-blend-difference" />
      </div>
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[99997] hidden md:block"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="w-8 h-8 rounded-full border border-[#fffcf6]/50 mix-blend-difference" />
      </div>
    </>
  );
}
