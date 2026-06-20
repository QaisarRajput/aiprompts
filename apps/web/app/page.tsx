import Image from "next/image";
import Link from "next/link";

import { PromptCard } from "../components/prompt-card";
import { getAllCategories, getSourcePrompts, getSourcesSummary } from "../lib/data";

// Per-category real image from actual prompt data
const CATEGORY_IMAGE: Record<string, string> = {
  "Profile / Avatar": "https://cms-assets.youmind.com/media/1781945791709_yke27a_HLOU7nHaEAATN0N.jpg",
  "Social Media Post": "https://cms-assets.youmind.com/media/1781945755630_003w7z_HLPgLLib0AEvvH5.jpg",
  "YouTube Thumbnail": "https://cms-assets.youmind.com/media/1781945772460_0fiyww_HLL9x3JaYAAy5sP.jpg",
  "Product Marketing": "https://cms-assets.youmind.com/media/1781945784333_8mb29g_HLN14ULbAAAgipv.jpg",
  "E-commerce Main Image": "https://cms-assets.youmind.com/media/1781861758599_8n8q40_HLEKpeEakAAgSwz.jpg",
  "Game Asset": "https://cms-assets.youmind.com/media/1781945780864_d4x28z_HLNo55raYAAMi94.jpg",
  "Comic / Storyboard": "https://cms-assets.youmind.com/media/1781945747932_n2r6tp_HLMwOnhbMAACA5Z.jpg",
  "Infographic / Edu Visual": "https://cms-assets.youmind.com/media/1781945776128_12jpda_HLPcMsjbAAAV56v.jpg"
};

const CATEGORY_TAGLINE: Record<string, string> = {
  "Profile / Avatar": "Stand out, always",
  "Social Media Post": "Content that pops",
  "YouTube Thumbnail": "Click-worthy every time",
  "Product Marketing": "Sell the vibe",
  "E-commerce Main Image": "Make them add to cart",
  "Game Asset": "Level up your assets",
  "Comic / Storyboard": "Tell your story visually",
  "Infographic / Edu Visual": "Make learning beautiful"
};

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default async function HomePage(): Promise<JSX.Element> {
  const summary = await getSourcesSummary();
  const sourceId = summary.sources[0]?.id;
  const [prompts, categories] = await Promise.all([
    sourceId ? getSourcePrompts(sourceId) : Promise.resolve([]),
    getAllCategories()
  ]);
  const featured = prompts.filter((item) => item.featured).slice(0, 8);
  const featuredOrLatest = (featured.length > 0 ? featured : prompts).slice(0, 10);
  const totalPrompts = summary.sources.reduce((acc, item) => acc + item.totalPrompts, 0);

  return (
    <div className="space-y-12">
      {/* Hero — banner.png faded on right */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card min-h-[340px] sm:min-h-[400px]">
        {/* Banner image — fills right side */}
        <div className="absolute inset-0">
          <Image
            src={`${assetBase}/banner.webp`}
            alt=""
            fill
            className="object-cover object-right"
            priority
            aria-hidden
          />
          {/* Gradient: opaque surface left → transparent right */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 from-[30%] via-[55%] to-surface/5" />
          {/* Subtle top/bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface/30 via-transparent to-surface/30" />
        </div>

        {/* Text content — left side */}
        <div className="relative z-10 max-w-xl p-8 sm:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            ✨ Updated daily
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text sm:text-5xl">
            The prompts everyone&apos;s<br />
            <span className="text-accent">lowkey obsessed</span> with.
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Your go-to spot for the most viral AI image prompts. Browse, copy, remix — no creative block, no excuses.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/browse"
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-contrast shadow-md transition hover:brightness-95 active:scale-95"
            >
              Start exploring →
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface/70 backdrop-blur-sm px-4 py-2.5 text-sm text-text-muted">
              <span className="text-base">🔥</span>
              {totalPrompts.toLocaleString()} prompts &amp; counting
            </span>
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      {categories.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-text">Browse Categories</h2>
            <Link href="/browse" className="text-sm font-medium text-accent transition hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const imgUrl = CATEGORY_IMAGE[cat];
              const tagline = CATEGORY_TAGLINE[cat] ?? "Explore prompts";
              return (
                <Link
                  key={cat}
                  href={`/browse?category=${encodeURIComponent(cat)}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3] transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                >
                  {/* Real background image */}
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-surface-muted" />
                  )}
                  {/* Dark gradient scrim for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold leading-tight text-white drop-shadow">{cat}</p>
                    <p className="mt-0.5 text-xs text-white/70">{tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Trending strip */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-text">🌟 Trending right now</h2>
          <Link href="/browse" className="text-sm font-medium text-accent transition hover:underline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {featuredOrLatest.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </section>

      {/* Promo band */}
      <section className="rounded-2xl border border-border bg-surface-muted p-6 text-center">
        <p className="text-sm font-medium text-text-muted">Follow us for daily drops 👇</p>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm font-semibold text-text-muted">
          <a href="https://instagram.com/aipromptshub" target="_blank" rel="noopener noreferrer" className="transition hover:text-accent">Instagram</a>
          <a href="https://tiktok.com/@aipromptshub" target="_blank" rel="noopener noreferrer" className="transition hover:text-accent">TikTok</a>
          <a href="https://x.com/aipromptshub" target="_blank" rel="noopener noreferrer" className="transition hover:text-accent">X / Twitter</a>
          <a href="https://facebook.com/aipromptshub" target="_blank" rel="noopener noreferrer" className="transition hover:text-accent">Facebook</a>
        </div>
      </section>
    </div>
  );
}

