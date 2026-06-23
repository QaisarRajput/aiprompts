import { notFound } from "next/navigation";

import { PromptImageViewer } from "../../../../components/prompt-image-viewer";
import { PromptCopy } from "../../../../components/prompt-copy";
import { PromptRemix } from "../../../../components/prompt-remix";
import { getPromptById, getSourcePrompts, getSourcesSummary } from "../../../../lib/data";

export async function generateStaticParams(): Promise<Array<{ source: string; id: string }>> {
  const summary = await getSourcesSummary();
  const all = await Promise.all(
    summary.sources.map(async (source) => {
      const prompts = await getSourcePrompts(source.id);
      return prompts.map((prompt) => ({ source: source.id, id: prompt.externalId }));
    })
  );
  return all.flat();
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<{ title: string; description: string; openGraph: { images: string[] } }> {
  const resolved = await params;
  const prompt = await getPromptById(resolved.source, resolved.id);
  if (!prompt) {
    return {
      title: "Prompt not found",
      description: "Prompt not found",
      openGraph: { images: [] }
    };
  }

  return {
    title: `${prompt.title} | AI Prompts`,
    description: prompt.description,
    openGraph: {
      images: prompt.images[0] ? [prompt.images[0].url] : []
    }
  };
}

export default async function PromptDetailPage({
  params
}: {
  params: Promise<{ source: string; id: string }>;
}): Promise<JSX.Element> {
  const resolved = await params;
  const prompt = await getPromptById(resolved.source, resolved.id);
  if (!prompt) {
    notFound();
  }

  return (
    <article className="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10 lg:items-start">
      {/* Left — images */}
      <PromptImageViewer images={prompt.images} promptTitle={prompt.title} />

      {/* Right — metadata + prompt */}
      <div className="mt-6 space-y-6 lg:mt-0 lg:sticky lg:top-20">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {prompt.category ? (
              <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {prompt.category}
              </span>
            ) : null}
            {prompt.featured ? (
              <span className="inline-flex rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text-muted">
                ✨ Featured
              </span>
            ) : null}
            {prompt.raycastFriendly ? (
              <span className="inline-flex rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text-muted">
                ⚡ Raycast
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{prompt.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
              {prompt.tool}
            </span>
            <span>{prompt.language.toUpperCase()}</span>
            <span>{new Date(prompt.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
        </header>

        {/* Prompt block */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text">Prompt</h2>
            <PromptCopy text={prompt.promptText} />
          </div>
          <pre className="max-h-72 overflow-auto rounded-xl bg-surface-muted p-4 text-sm leading-relaxed" style={{ fontFamily: "var(--font-geist-mono)" }}>
            <code>{prompt.promptText}</code>
          </pre>
        </section>

        {/* Remix */}
        {prompt.templateArguments.length > 0 ? (
          <PromptRemix promptText={prompt.promptText} argumentsList={prompt.templateArguments} />
        ) : null}

        {/* Attribution */}
        <section className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          <h2 className="font-semibold text-text">About</h2>
          <p className="text-text-muted">
            <span className="font-medium text-text">Author: </span>
            {prompt.author.url ? (
              <a className="text-accent underline underline-offset-2" href={prompt.author.url} target="_blank" rel="noopener noreferrer">{prompt.author.name}</a>
            ) : (
              prompt.author.name
            )}
          </p>
          <p className="text-text-muted">
            <span className="font-medium text-text">Source: </span>
            <a className="text-accent underline underline-offset-2" href={prompt.source.url} target="_blank" rel="noopener noreferrer">{prompt.source.label}</a>
          </p>
          <a
            href={prompt.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-95 active:scale-95"
          >
            Open in YouMind →
          </a>
        </section>
      </div>
    </article>
  );
}

