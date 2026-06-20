import { notFound } from "next/navigation";

import { AdaptiveImage } from "../../../../components/adaptive-image";
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
    title: `${prompt.title} | Prompt Gallery`,
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
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-text-muted">{prompt.tool}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text">{prompt.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-text-muted">
          {prompt.category ? <span>{prompt.category}</span> : null}
          <span>Language: {prompt.language.toUpperCase()}</span>
          <span>Published: {new Date(prompt.publishedAt).toLocaleDateString()}</span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {prompt.images.map((image, idx) => (
          <div key={`${image.url}-${idx}`} className="overflow-hidden rounded-card border border-border bg-surface">
            <AdaptiveImage
              src={image.url}
              alt={image.alt || prompt.title}
              className="h-auto w-full"
              fallbackClassName="aspect-[4/5] w-full bg-surface-muted"
              {...(image.width ? { width: image.width } : {})}
              {...(image.height ? { height: image.height } : {})}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Prompt</h2>
          <PromptCopy text={prompt.promptText} />
        </div>
        <pre className="overflow-x-auto rounded-xl bg-surface-muted p-4 text-sm" style={{ fontFamily: "var(--font-geist-mono)" }}>
          <code>{prompt.promptText}</code>
        </pre>
      </section>

      {prompt.templateArguments.length > 0 ? (
        <PromptRemix promptText={prompt.promptText} argumentsList={prompt.templateArguments} />
      ) : null}

      <section className="space-y-1 text-sm text-text-muted">
        <p>
          Author: {prompt.author.url ? <a className="underline" href={prompt.author.url}>{prompt.author.name}</a> : prompt.author.name}
        </p>
        <p>
          Source: <a className="underline" href={prompt.source.url}>{prompt.source.label}</a>
        </p>
        <a
          href={prompt.externalUrl}
          className="inline-flex rounded-xl border border-border bg-surface px-3 py-2 font-medium text-text transition hover:border-accent hover:text-accent"
        >
          Open in YouMind
        </a>
      </section>
    </article>
  );
}

