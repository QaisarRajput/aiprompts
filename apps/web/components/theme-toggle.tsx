"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "aiprompts-theme";

function currentTheme(): Theme {
  const root = document.documentElement;
  return root.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const toggle = (): void => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggle}
      className="h-11 min-w-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-text shadow-card transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? "Sun" : "Moon"}
    </button>
  );
}
