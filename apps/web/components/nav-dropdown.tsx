"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export function NavDropdown({ categories }: { categories: string[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const hide = (): void => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
      >
        Categories
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
        >
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/browse?category=${encodeURIComponent(cat)}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
            >
              <span className="text-base">{CATEGORY_EMOJI[cat] ?? "🎨"}</span>
              {cat}
            </Link>
          ))}
          <div className="mt-1 border-t border-border pt-1">
            <Link
              href="/browse"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
            >
              <span>✨</span>
              Browse all prompts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  "Profile / Avatar": "👤",
  "Social Media Post": "📱",
  "YouTube Thumbnail": "🎬",
  "Product Marketing": "🛍️",
  "E-commerce Main Image": "🛒",
  "Game Asset": "🎮",
  "Comic / Storyboard": "📖",
  "Infographic / Edu Visual": "📊"
};
