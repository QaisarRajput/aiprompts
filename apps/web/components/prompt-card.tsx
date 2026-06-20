"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { NormalizedPrompt } from "@aiprompts/schema";

import { AdaptiveImage } from "./adaptive-image";

function highlightText(text: string, query?: string): ReactNode {
  if (!query?.trim()) {
    return text;
  }

  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) {
    return text;
  }

  const end = idx + q.length;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent/20 px-0.5 text-current">{text.slice(idx, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function PromptCard({
  prompt,
  isSaved = false,
  onToggleSaved,
  highlightQuery
}: {
  prompt: NormalizedPrompt;
  isSaved?: boolean;
  onToggleSaved?: (id: string) => void;
  highlightQuery?: string;
}): JSX.Element {
  const hero = prompt.images[0];
  return (
    <article className="group relative overflow-hidden rounded-card border border-border bg-surface shadow-card transition hover:-translate-y-0.5">
      <Link href={`/prompt/${prompt.sourceId}/${prompt.externalId}`} className="block">
        <div className="relative bg-surface-muted">
          {hero ? (
            <AdaptiveImage
              src={hero.url}
              alt={hero.alt || prompt.title}
              className="h-auto w-full object-cover"
              fallbackClassName="aspect-[4/5] w-full bg-surface-muted"
              {...(hero.width ? { width: hero.width } : {})}
              {...(hero.height ? { height: hero.height } : {})}
            />
          ) : (
            <div className="aspect-[4/5] w-full" aria-hidden="true" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 transition group-hover:opacity-100">
            <p className="line-clamp-2 text-sm font-semibold">{highlightText(prompt.title, highlightQuery)}</p>
            {prompt.category ? (
              <p className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-xs">{prompt.category}</p>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-text">{highlightText(prompt.title, highlightQuery)}</p>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-text-muted">{prompt.language.toUpperCase()}</span>
          {onToggleSaved ? (
            <button
              type="button"
              onClick={() => onToggleSaved(prompt.id)}
              aria-label={isSaved ? "Remove from saved" : "Save prompt"}
              className={`rounded-full border px-2 py-1 text-xs font-medium transition ${
                isSaved
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

