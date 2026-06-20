import Link from "next/link";

import { PromptCard } from "../components/prompt-card";
import { getSourcePrompts, getSourcesSummary } from "../lib/data";

export default async function HomePage(): Promise<JSX.Element> {
  const summary = await getSourcesSummary();
  const sourceId = summary.sources[0]?.id;
  const prompts = sourceId ? await getSourcePrompts(sourceId) : [];
  const featured = prompts.filter((item) => item.featured).slice(0, 8);
  const featuredOrLatest = (featured.length > 0 ? featured : prompts).slice(0, 8);
  const totalPrompts = summary.sources.reduce((acc, item) => acc + item.totalPrompts, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-text-muted">Prompt Gallery</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          A static, high-performance library of image prompts with real upstream data.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-text-muted">
          Browse, inspect, and copy prompts sourced via the ETL pipeline with strict schema validation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={sourceId ? "/browse" : "/"}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition hover:brightness-95"
          >
            Open gallery
          </Link>
          <span className="inline-flex items-center rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-text-muted">
            {totalPrompts} prompts indexed
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-text">Featured Strip</h2>
          <p className="text-sm text-text-muted">{featuredOrLatest.length} items</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredOrLatest.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </section>
    </div>
  );
}
