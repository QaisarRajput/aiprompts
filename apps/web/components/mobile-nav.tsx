"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav({
  categories
}: {
  categories: string[];
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);

  return (
    <>
      {/* Burger button */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:border-accent hover:text-accent lg:hidden"
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="fixed left-0 right-0 top-0 z-50 flex flex-col gap-1 border-b border-border bg-surface p-4 pt-5 shadow-xl lg:hidden">
            {/* Close row */}
            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-accent"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Link href="/browse" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-muted">
              Browse All
            </Link>
            <Link href="/browse/gpt-image-2" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text">
              GPT Image
            </Link>
            <Link href="/browse/seedance-2" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text">
              Seedance
            </Link>

            {categories.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-widest text-text-muted">Categories</p>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/browse?category=${encodeURIComponent(cat)}`}
                    onClick={close}
                    className="rounded-xl px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
                  >
                    {cat}
                  </Link>
                ))}
              </>
            )}

            <div className="my-1 border-t border-border" />
            <a
              href="https://buymeacoffee.com/aipromptshub"
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-400"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </>
      )}
    </>
  );
}
