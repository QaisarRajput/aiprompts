import { describe, expect, it } from "vitest";

import {
  NormalizedPromptSchema,
  SourceMetaSchema,
  SourcesJsonSchema,
  computeContentHash,
  withContentHash
} from "./index.js";

const promptInput = {
  id: "gpt-image-2:26257",
  sourceId: "gpt-image-2",
  tool: "GPT Image 2",
  externalId: "26257",
  title: "Luxury Lobby Denim Jumpsuit Portrait",
  category: "Profile / Avatar",
  description: "An editorial portrait in a high-end hotel lobby.",
  promptText: "{\"scene\":\"luxury lobby\"}",
  promptFormat: "json" as const,
  templateArguments: [
    {
      name: "background color",
      default: "soft purple and blue gradient"
    }
  ],
  raycastFriendly: true,
  featured: true,
  language: "en",
  images: [
    {
      url: "https://cms-assets.youmind.com/media/example.jpg",
      alt: "Portrait sample",
      width: 700,
      height: 1024
    }
  ],
  author: {
    name: "Example Author",
    url: "https://x.com/example"
  },
  source: {
    label: "Twitter Post",
    url: "https://x.com/example/status/1"
  },
  publishedAt: "2026-06-20T00:00:00Z",
  externalUrl: "https://youmind.com/gpt-image-2-prompts?id=26257"
};

describe("NormalizedPromptSchema", () => {
  it("accepts a valid prompt", () => {
    const hash = computeContentHash(promptInput);
    const parsed = NormalizedPromptSchema.parse({ ...promptInput, contentHash: hash });

    expect(parsed.externalId).toBe("26257");
    expect(parsed.contentHash).toMatch(/^[a-f0-9]{40}$/);
  });

  it("rejects invalid prompt records", () => {
    const hash = computeContentHash(promptInput);
    const bad = {
      ...promptInput,
      publishedAt: "June 20, 2026",
      images: [],
      contentHash: hash
    };

    expect(() => NormalizedPromptSchema.parse(bad)).toThrow();
  });
});

describe("content hash helper", () => {
  it("is stable for equivalent objects", () => {
    const a = withContentHash(promptInput);
    const b = withContentHash({ ...promptInput, title: "Luxury Lobby Denim Jumpsuit Portrait" });

    expect(a.contentHash).toBe(b.contentHash);
  });

  it("changes when meaningful content changes", () => {
    const a = withContentHash(promptInput);
    const b = withContentHash({ ...promptInput, title: "Different title" });

    expect(a.contentHash).not.toBe(b.contentHash);
  });
});

describe("meta schemas", () => {
  it("validates source meta", () => {
    const parsed = SourceMetaSchema.parse({
      sourceId: "gpt-image-2",
      tool: "GPT Image 2",
      taxonomy: ["Profile / Avatar", "Social Media Post"],
      counts: {
        total: 120,
        featured: 6,
        byCategory: {
          "Profile / Avatar": 40
        },
        byLanguage: {
          en: 110
        }
      },
      lastSyncedAt: "2026-06-20T12:00:00Z"
    });

    expect(parsed.counts.total).toBe(120);
  });

  it("validates sources.json structure", () => {
    const parsed = SourcesJsonSchema.parse({
      version: 1,
      sources: [
        {
          id: "gpt-image-2",
          tool: "GPT Image 2",
          lastSyncedAt: "2026-06-20T12:00:00Z",
          totalPrompts: 120,
          featuredPrompts: 6
        }
      ]
    });

    expect(parsed.sources).toHaveLength(1);
  });
});
