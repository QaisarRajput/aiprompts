import { Suspense } from "react";
import { notFound } from "next/navigation";

import { BrowseGallery } from "../../../components/browse-gallery";
import { getSourceMeta, getSourcePrompts, getSourcesSummary } from "../../../lib/data";

export async function generateStaticParams(): Promise<Array<{ source: string }>> {
  const summary = await getSourcesSummary();
  return summary.sources.map((item) => ({ source: item.id }));
}

export default async function BrowseBySourcePage({
  params
}: {
  params: Promise<{ source: string }>;
}): Promise<JSX.Element> {
  const sourceId = (await params).source;

  try {
    const [meta, prompts] = await Promise.all([getSourceMeta(sourceId), getSourcePrompts(sourceId)]);

    // Derive real categories from prompt data (meta.taxonomy may be empty)
    const taxonomy = [...new Set(prompts.map((p) => p.category).filter(Boolean))] as string[];

    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight text-text">{meta.tool}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {meta.counts.total} prompts, {meta.counts.featured} featured, {taxonomy.length} categories
          </p>
        </section>

        <Suspense
          fallback={<div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted">Loading gallery...</div>}
        >
          <BrowseGallery sourceId={sourceId} prompts={prompts} taxonomy={taxonomy} />
        </Suspense>
      </div>
    );
  } catch {
    notFound();
  }
}

