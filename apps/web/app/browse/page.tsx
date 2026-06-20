import { Suspense } from "react";
import Link from "next/link";

import { BrowseGallery } from "../../components/browse-gallery";
import { getAllPrompts, getSourcesSummary } from "../../lib/data";

export default async function BrowseAllPage(): Promise<JSX.Element> {
  const [summary, prompts] = await Promise.all([getSourcesSummary(), getAllPrompts()]);

  const taxonomy = [...new Set(prompts.map((prompt) => prompt.category).filter(Boolean))] as string[];
  const sourceOptions = summary.sources.map((source) => ({ id: source.id, label: source.tool }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight text-text">All Tools</h1>
        <p className="mt-1 text-sm text-text-muted">
          {summary.sources.length} tools, {prompts.length} prompts indexed
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.sources.map((source) => (
            <Link
              key={source.id}
              href={`/browse/${source.id}`}
              className="rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-muted transition hover:border-accent hover:text-accent"
            >
              {source.tool}
            </Link>
          ))}
        </div>
      </section>

      <Suspense
        fallback={<div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted">Loading gallery...</div>}
      >
        <BrowseGallery
          sourceId="combined"
          prompts={prompts}
          taxonomy={taxonomy}
          sourceOptions={sourceOptions}
        />
      </Suspense>
    </div>
  );
}
