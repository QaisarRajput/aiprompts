"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { NormalizedPrompt } from "@aiprompts/schema";

import { PromptCard } from "./prompt-card";

const PAGE_SIZE = 24;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState("");
  const [searchReady, setSearchReady] = useState(false);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [columnCount, setColumnCount] = useState(2);

  const category = searchParams.get("category");
  const lang = searchParams.get("lang");
  const featured = searchParams.get("featured") === "true";
  const raycast = searchParams.get("raycast") === "true";
  const savedOnly = searchParams.get("saved") === "true";
  const sourceFilter = searchParams.get("source");

  useEffect(() => {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[];
      setSavedIds(new Set(parsed));
    } catch {
      // Ignore malformed local state.
    }
  }, []);

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

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width >= 1536) {
        setColumnCount(6);
      } else if (width >= 1280) {
        setColumnCount(5);
      } else if (width >= 1024) {
        setColumnCount(4);
      } else if (width >= 640) {
        setColumnCount(3);
      } else {
        setColumnCount(2);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      return;
    }
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
    () => [...new Set(prompts.map((prompt) => prompt.language.toLowerCase()))].sort(),
    [prompts]
  );

  const baseFiltered = useMemo(
    () =>
      prompts.filter((prompt) => {
        if (category && prompt.category !== category) {
          return false;
        }
        if (lang && prompt.language.toLowerCase() !== lang.toLowerCase()) {
          return false;
        }
        if (featured && !prompt.featured) {
          return false;
        }
        if (raycast && !prompt.raycastFriendly) {
          return false;
        }
        if (savedOnly && !savedIds.has(prompt.id)) {
          return false;
        }
        if (sourceFilter && prompt.sourceId !== sourceFilter) {
          return false;
        }
        return true;
      }),
    [prompts, category, lang, featured, raycast, savedOnly, sourceFilter, savedIds]
  );

  const fallbackSearchFiltered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) {
      return baseFiltered;
    }
    return baseFiltered.filter((prompt) => {
      const haystack = `${prompt.title}\n${prompt.description}\n${prompt.promptText}\n${prompt.category ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [baseFiltered, searchValue]);

  const filtered = useMemo(() => {
    const q = searchValue.trim();
    if (!q) {
      return baseFiltered;
    }

    if (!searchReady || !searchIds) {
      return fallbackSearchFiltered;
    }

    const set = new Set(baseFiltered.map((prompt) => prompt.id));
    const byId = new Map(baseFiltered.map((prompt) => [prompt.id, prompt]));

    const ordered = searchIds
      .filter((id) => set.has(id))
      .map((id) => byId.get(id))
      .filter((item): item is NormalizedPrompt => Boolean(item));

    return ordered;
  }, [baseFiltered, searchIds, searchReady, searchValue, fallbackSearchFiltered]);

  const filteredKey = useMemo(() => filtered.map((item) => item.id).join("|"), [filtered]);

  const promptsQuery = useInfiniteQuery({
    queryKey: ["browse-chunks", filteredKey],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const start = Number(pageParam);
      return filtered.slice(start, start + PAGE_SIZE);
    },
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((acc, page) => acc + page.length, 0);
      return loaded < filtered.length ? loaded : undefined;
    }
  });

  const visiblePrompts = useMemo(
    () => promptsQuery.data?.pages.flat() ?? filtered.slice(0, PAGE_SIZE),
    [promptsQuery.data, filtered]
  );

  const rows = useMemo(() => {
    const out: NormalizedPrompt[][] = [];
    for (let i = 0; i < visiblePrompts.length; i += columnCount) {
      out.push(visiblePrompts.slice(i, i + columnCount));
    }
    return out;
  }, [visiblePrompts, columnCount]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 420,
    overscan: 4
  });

  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    const last = items[items.length - 1];
    if (!last) {
      return;
    }
    if (last.index >= rows.length - 2 && promptsQuery.hasNextPage && !promptsQuery.isFetchingNextPage) {
      void promptsQuery.fetchNextPage();
    }
  }, [rowVirtualizer, rows.length, promptsQuery]);

  const toggleSaved = (id: string): void => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const ensureSearchIndexLoaded = async (): Promise<void> => {
    if (searchReady || !workerRef.current) {
      return;
    }

    const response = await fetch(`/search-index/${sourceId}.json`);
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { index: unknown };
    workerRef.current.postMessage({ type: "init", payload: { index: payload.index } });
    setSearchReady(true);
  };

  const onSearchChange = (value: string): void => {
    setSearchValue(value);
    if (!workerRef.current) {
      return;
    }
    workerRef.current.postMessage({ type: "query", payload: { query: value } });
  };

  const updateQuery = (params: URLSearchParams): void => {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            value={searchValue}
            onFocus={() => {
              void ensureSearchIndexLoaded();
            }}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search prompts (/ to focus)"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted sm:max-w-md"
          />
          <span className="text-xs text-text-muted">{filtered.length} results</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sourceOptions.length > 1 ? (
            <>
              {sourceOptions.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() =>
                    updateQuery(toggleParam(new URLSearchParams(searchParams), "source", source.id))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    sourceFilter === source.id
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </>
          ) : null}

          <button
            type="button"
            onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "featured", "true"))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              featured
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
            }`}
          >
            Featured
          </button>
          <button
            type="button"
            onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "raycast", "true"))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              raycast
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
            }`}
          >
            Raycast
          </button>
          <button
            type="button"
            onClick={() => updateQuery(toggleParam(new URLSearchParams(searchParams), "saved", "true"))}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              savedOnly
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border bg-surface-muted text-text-muted hover:border-accent hover:text-accent"
            }`}
          >
            Saved
          </button>

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

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-base font-medium text-text">No prompts match this filter set.</p>
          <p className="mt-1 text-sm text-text-muted">Try clearing one or more filters.</p>
        </section>
      ) : (
        <section
          ref={containerRef}
          className="max-h-[78vh] overflow-auto rounded-2xl border border-border bg-surface p-2 shadow-card"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative"
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) {
                return null;
              }
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className={`grid gap-3 p-1 ${
                    columnCount >= 6
                      ? "grid-cols-6"
                      : columnCount === 5
                        ? "grid-cols-5"
                        : columnCount === 4
                          ? "grid-cols-4"
                          : columnCount === 3
                            ? "grid-cols-3"
                            : "grid-cols-2"
                  }`}
                >
                  {row.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isSaved={savedIds.has(prompt.id)}
                      onToggleSaved={toggleSaved}
                      highlightQuery={searchValue}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          {promptsQuery.isFetchingNextPage ? (
            <div className="p-3 text-center text-sm text-text-muted">Loading more...</div>
          ) : null}
        </section>
      )}
    </div>
  );
}
