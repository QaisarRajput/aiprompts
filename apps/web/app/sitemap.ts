import type { MetadataRoute } from "next";

import { getSourcePrompts, getSourcesSummary } from "../lib/data";

const SITE_URL = "https://aiprompts.hubs.dpdns.org";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const summary = await getSourcesSummary();

  const basePages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: `${SITE_URL}/browse`,
      changeFrequency: "hourly",
      priority: 0.9
    }
  ];

  const browsePages: MetadataRoute.Sitemap = summary.sources.map((source) => ({
    url: `${SITE_URL}/browse/${source.id}`,
    changeFrequency: "hourly",
    priority: 0.8
  }));

  const promptPages = (
    await Promise.all(
      summary.sources.map(async (source) => {
        const prompts = await getSourcePrompts(source.id);
        return prompts.map((prompt) => ({
          url: `${SITE_URL}/prompt/${source.id}/${prompt.externalId}`,
          changeFrequency: "weekly" as const,
          priority: 0.7
        }));
      })
    )
  ).flat();

  return [...basePages, ...browsePages, ...promptPages];
}
