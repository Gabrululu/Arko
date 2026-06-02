"use client";

import { useState, useLayoutEffect, type ReactNode } from "react";
import { ThemeContext, type Theme } from "@/hooks/useTheme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Runs before paint — reads persisted preference and applies it instantly.
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("arko-theme") as Theme | null;
      const resolved: Theme = stored === "dark" ? "dark" : "light";
      setTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    } catch {
      // localStorage unavailable (private browsing, SSR mismatch) — stay light
    }
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("arko-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
