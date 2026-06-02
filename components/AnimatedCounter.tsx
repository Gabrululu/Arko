"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired) return;

    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    const suffix = value.replace(/[0-9.]/g, "");
    const obj = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () => {
        setFired(true);
        gsap.to(obj, {
          val: numeric,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            if (el) el.textContent = Math.round(obj.val).toLocaleString() + suffix;
          },
        });
      },
    });
  }, [value, fired]);

  return (
    <div className="text-center">
      <span
        ref={ref}
        className="block font-serif text-[clamp(2.5rem,5vw,4rem)] text-[#F5F0E8] leading-none"
      >
        0
      </span>
      <span className="block text-[10px] uppercase tracking-[0.25em] text-[#9a8870] mt-2 font-mono">
        {label}
      </span>
    </div>
  );
}
