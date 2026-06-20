"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { NormalizedPrompt } from "@aiprompts/schema";

import { PromptCard } from "./prompt-card";

const PAGE_SIZE = 30;
const SAVED_KEY = "aiprompts-saved";

type SearchWorkerResult = {
  type: "results";
  payload: {
    ids: string[];
  };
};

function toggleParam(params: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(params);
  const current = next.get(key);
  if (current === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
}

export function BrowseGallery({
  sourceId,
  prompts,
  taxonomy,
  sourceOptions = []
}: {
  sourceId: string;
  prompts: NormalizedPrompt[];
  taxonomy: string[];
  sourceOptions?: Array<{ id: string; label: string }>;
}): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState("");
  const [searchReady, setSearchReady] = useState(false);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);

  const category = searchParams.get("category");
  const lang = searchParams.get("lang");
  const featured = searchParams.get("featured") === "true";
  const raycast = searchParams.get("raycast") === "true";
  const savedOnly = searchParams.get("saved") === "true";
  const sourceFilter = searchParams.get("source");

  // Load saved IDs from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      setSavedIds(new Set(parsed));
    } catch {
      // Ignore malformed local state.
    }
  }, []);

  // "/" shortcut to focus search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Search worker
  useEffect(() => {
    if (workerRef.current) return;
    const worker = new Worker(new URL("../workers/search.worker.ts", import.meta.url), {
      type: "module"
    });
    worker.onmessage = (event: MessageEvent<SearchWorkerResult>) => {
      if (event.data.type === "results") {
        setSearchIds(event.data.payload.ids);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const languages = useMemo(
    () => [...new Set(prompts.map((p) => p.language.toLowerCase()))].sort(),
    [prompts]
  );

  const baseFiltered = useMemo(
    () =>
      prompts.filter((p) => {
        if (category && p.category !== category) return false;
        if (lang && p.language.toLowerCase() !== lang.toLowerCase()) return false;
        if (featured && !p.featured) return false;
        if (raycast && !p.raycastFriendly) return false;
        if (savedOnly && !savedIds.has(p.id)) return false;
        if (sourceFilter && p.sourceId !== sourceFilter) return false;
        return true;
      }),
    [prompts, category, lang, featured, raycast, savedOnly, sourceFilter, savedIds]
  );

  const fallbackSearchFiltered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return baseFiltered;
    return baseFiltered.filter((p) => {
      const haystack = `${p.title}\n${p.description}\n${p.promptText}\n${p.category ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [baseFiltered, searchValue]);

  const filtered = useMemo(() => {
    const q = searchValue.trim();
    if (!q) return baseFiltered;
    if (!searchReady || !searchIds) return fallbackSearchFiltered;
    const set = new Set(baseFiltered.map((p) => p.id));
    const byId = new Map(baseFiltered.map((p) => [p.id, p]));
    return searchIds
      .filter((id) => set.has(id))
      .map((id) => byId.get(id))
      .filter((item): item is NormalizedPrompt => Boolean(item));
  }, [baseFiltered, searchIds, searchReady, searchValue, fallbackSearchFiltered]);

  const filteredKey = useMemo(() => filtered.map((p) => p.id).join("|"), [filtered]);

  // Paginated infinite query — just slices the already-filtered array
  const promptsQuery = useInfiniteQuery({
    queryKey: ["browse-chunks", filteredKey],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const start = Number(pageParam);
      return filtered.slice(start, start + PAGE_SIZE);
    },
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((acc, p) => acc + p.length, 0);
      return loaded < filtered.length ? loaded : undefined;
    }
  });

  const visiblePrompts = useMemo(
    () => promptsQuery.data?.pages.flat() ?? filtered.slice(0, PAGE_SIZE),
    [promptsQuery.data, filtered]
  );

  // IntersectionObserver sentinel for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && promptsQuery.hasNextPage && !promptsQuery.isFetchingNextPage) {
          void promptsQuery.fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [promptsQuery]);

  const toggleSaved = (id: string): void => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const ensureSearchIndexLoaded = async (): Promise<void> => {
    if (searchReady || !workerRef.current) return;
    const response = await fetch(`/search-index/${sourceId}.json`);
    if (!response.ok) return;
    const payload = (await response.json()) as { index: unknown };
    workerRef.current.postMessage({ type: "init", payload: { index: payload.index } });
    setSearchReady(true);
  };

  const onSearchChange = (value: string): void => {
    setSearchValue(value);
    workerRef.current?.postMessage({ type: "query", payload: { query: value } });
  };

  const updateQuery = (params: URLSearchParams): void => {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            value={searchValue}
            onFocus={() => { void ensureSearchIndexLoaded(); }}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search prompts… (press / to focus)"
            className="w-full rounded-xl border border-border bg-bg px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none sm:max-w-sm"
          />
          <span className="text-xs text-text-muted">{filtered.length.toLocaleString()} results</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {sourceOptions.length > 1 &&
            sourceOptions.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "source", source.id))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  sourceFilter === source.id
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {source.label}
              </button>
            ))}

          {[
            { label: "⭐ Featured", key: "featured", value: "true", active: featured },
            { label: "⚡ Raycast", key: "raycast", value: "true", active: raycast },
            { label: "♥ Saved", key: "saved", value: "true", active: savedOnly }
          ].map(({ label, key, value, active }) => (
            <button
              key={key}
              type="button"
              onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), key, value))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {label}
            </button>
          ))}

          {taxonomy.slice(0, 12).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "category", label))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === label
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {label}
            </button>
          ))}

          {languages.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "lang", code))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                lang === code
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}

          <button
            type="button"
            onClick={() => updateQuery(new URLSearchParams())}
            className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition hover:border-accent hover:text-accent"
          >
            Clear all
          </button>
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-12 text-center shadow-card">
          <p className="text-2xl">😶</p>
          <p className="mt-2 text-base font-semibold text-text">Nothing here yet</p>
          <p className="mt-1 text-sm text-text-muted">Try clearing a filter or searching something else.</p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {visiblePrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isSaved={savedIds.has(prompt.id)}
                onToggleSaved={toggleSaved}
                highlightQuery={searchValue}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {promptsQuery.isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading more…
              </div>
            ) : promptsQuery.hasNextPage ? (
              <div className="h-1 w-1" aria-hidden="true" />
            ) : (
              <p className="text-xs text-text-muted">
                Showing all {visiblePrompts.length.toLocaleString()} prompts ✓
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

