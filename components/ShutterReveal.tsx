"use client";

import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from "react";
import { gsap } from "gsap";

const BAR_COUNT = 22;
const BAR_HEIGHT = `${(100 / BAR_COUNT + 0.15).toFixed(4)}vh`;

export function ShutterReveal({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
 
  useLayoutEffect(() => {
    const hasPlayed = sessionStorage.getItem("arko-shutter");
    if (!hasPlayed) {
      setShouldRender(true);
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible || !overlayRef.current) return;

    const bars = overlayRef.current.querySelectorAll(".shutter-bar");

    const ctx = gsap.context(() => {
      gsap.to(bars, {
        y: "-120vh",
        duration: 0.88,
        ease: "power3.in",
        stagger: {
          each: 0.038,
          from: "start",
        },
        delay: 0.18,
        onComplete: () => {
          sessionStorage.setItem("arko-shutter", "1");
          setIsVisible(false);
          setShouldRender(false);
        },
      });
    }, overlayRef);

    return () => ctx.revert(); 
  }, [isVisible]);

 
  const renderBars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }).map((_, i) => (
      <div
        key={i}
        className="shutter-bar w-full"
        style={{ 
          height: BAR_HEIGHT, 
          backgroundColor: "#1a1508",
          willChange: "transform" 
        }}
      />
    ));
  }, []);

  return (
    <>
      {shouldRender && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[200] pointer-events-none flex flex-col"
          style={{ visibility: isVisible ? 'visible' : 'hidden' }}
          aria-hidden="true"
        >
          {renderBars}
        </div>
      )}
      {/* Si el error de 'keychainify-checked' persiste, el problema está 
          en los componentes dentro de {children}. 
      */}
      <div suppressHydrationWarning>
        {children}
      </div>
    </>
  );
}