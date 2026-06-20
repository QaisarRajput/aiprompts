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
    <article className="group relative overflow-hidden rounded-2xl bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Full-bleed image */}
      <Link href={`/prompt/${prompt.sourceId}/${prompt.externalId}`} className="block">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
          {hero ? (
            <AdaptiveImage
              src={hero.url}
              alt={hero.alt || prompt.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              fallbackClassName="absolute inset-0 flex items-center justify-center bg-surface-muted"
              {...(hero.width ? { width: hero.width } : {})}
              {...(hero.height ? { height: hero.height } : {})}
            />
          ) : (
            <div className="absolute inset-0 bg-surface-muted" aria-hidden="true" />
          )}

          {/* Permanent bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Title + tags always visible at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow">
              {highlightText(prompt.title, highlightQuery)}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {prompt.category ? (
                <span className="inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                  {prompt.category}
                </span>
              ) : null}
              {prompt.featured ? (
                <span className="inline-flex rounded-full bg-accent/80 px-2 py-0.5 text-[10px] font-medium text-white">
                  ✨ Featured
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {/* Save button — top right, visible on hover */}
      {onToggleSaved ? (
        <button
          type="button"
          onClick={() => onToggleSaved(prompt.id)}
          aria-label={isSaved ? "Remove from saved" : "Save prompt"}
          className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow transition ${
            isSaved
              ? "bg-accent text-white opacity-100"
              : "bg-black/40 text-white/80 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-accent/80"
          }`}
        >
          {isSaved ? "♥" : "♡"}
        </button>
      ) : null}
    </article>
  );
}

