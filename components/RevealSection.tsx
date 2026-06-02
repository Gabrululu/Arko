"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "clip";
}

export function RevealSection({
  children,
  className,
  delay = 0,
  from = "bottom",
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fromVars: gsap.TweenVars =
      from === "clip"
        ? { clipPath: "inset(0 0 100% 0)", opacity: 1 }
        : from === "left"
        ? { opacity: 0, x: -40 }
        : from === "right"
        ? { opacity: 0, x: 40 }
        : { opacity: 0, y: 32 };

    const toVars: gsap.TweenVars =
      from === "clip"
        ? { clipPath: "inset(0 0 0% 0)", opacity: 1 }
        : from === "left" || from === "right"
        ? { opacity: 1, x: 0 }
        : { opacity: 1, y: 0 };

    if (from === "clip") gsap.set(el, { clipPath: "inset(0 0 100% 0)", opacity: 1 });

    const ctx = gsap.context(() => {
      gsap.fromTo(el, fromVars, {
        ...toVars,
        duration: 0.95,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
