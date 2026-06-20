import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type NormalizedPrompt, NormalizedPromptSchema } from "@aiprompts/schema";

import { sources, type SourceConfig } from "./sources.config.js";

const DATA_ROOT = join(process.cwd(), "data");
const CHUNK_SIZE = 150;
const SAFETY_WINDOW = 20;

type ExistingSourceData = {
  all: NormalizedPrompt[];
  byId: Map<string, NormalizedPrompt>;
  byHash: Map<string, string>;
};

async function fetchReadme(config: SourceConfig): Promise<string> {
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/refs/heads/${config.branch}/${config.readmePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function readJsonFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

async function loadExistingSourceData(sourceId: string): Promise<ExistingSourceData> {
  const sourceDir = join(DATA_ROOT, sourceId);
  const chunksDir = join(sourceDir, "chunks");

  try {
    const names = (await readdir(chunksDir)).filter((name) => name.endsWith(".json")).sort();
    const all: NormalizedPrompt[] = [];

    for (const name of names) {
      const chunkPath = join(chunksDir, name);
      const records = await readJsonFile<unknown[]>(chunkPath);
      for (const record of records) {
        all.push(NormalizedPromptSchema.parse(record));
      }
    }

    return {
      all,
      byId: new Map(all.map((item) => [item.externalId, item])),
      byHash: new Map(all.map((item) => [item.externalId, item.contentHash]))
    };
  } catch {
    return {
      all: [],
      byId: new Map(),
      byHash: new Map()
    };
  }
}

function toChunks(items: NormalizedPrompt[]): NormalizedPrompt[][] {
  const chunks: NormalizedPrompt[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

function summarizeCounts(prompts: NormalizedPrompt[]): {
  total: number;
  featured: number;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  let featured = 0;

  for (const prompt of prompts) {
    if (prompt.featured) {
      featured += 1;
    }

    if (prompt.category) {
      byCategory[prompt.category] = (byCategory[prompt.category] ?? 0) + 1;
    }
    byLanguage[prompt.language] = (byLanguage[prompt.language] ?? 0) + 1;
  }

  return {
    total: prompts.length,
    featured,
    byCategory,
    byLanguage
  };
}

async function writeSourceData(
  config: SourceConfig,
  prompts: NormalizedPrompt[],
  taxonomy: string[],
  staleRetainedCount: number
): Promise<void> {
  const sourceDir = join(DATA_ROOT, config.id);
  const chunksDir = join(sourceDir, "chunks");

  await mkdir(chunksDir, { recursive: true });

  const chunkFiles = (await readdir(chunksDir).catch(() => [])).filter((name) => name.endsWith(".json"));
  for (const file of chunkFiles) {
    await unlink(join(chunksDir, file));
  }

  const chunks = toChunks(prompts);
  for (let i = 0; i < chunks.length; i += 1) {
    const fileName = `${String(i).padStart(4, "0")}.json`;
    await writeFile(join(chunksDir, fileName), `${JSON.stringify(chunks[i], null, 2)}\n`, "utf8");
  }

  const meta = {
    sourceId: config.id,
    tool: config.tool,
    taxonomy,
    counts: summarizeCounts(prompts),
    staleRetainedCount,
    lastSyncedAt: new Date().toISOString()
  };

  await writeFile(join(sourceDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
}

async function writeSourcesSummary(
  sourceStats: Array<{ id: string; tool: string; lastSyncedAt: string; totalPrompts: number; featuredPrompts: number }>
): Promise<void> {
  await mkdir(DATA_ROOT, { recursive: true });

  const summary = {
    version: 1,
    sources: sourceStats
  };

  await writeFile(join(DATA_ROOT, "sources.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

async function readOverrides(): Promise<{ blocklistExternalIds: string[] }> {
  try {
    return await readJsonFile<{ blocklistExternalIds: string[] }>(join(DATA_ROOT, "overrides.json"));
  } catch {
    return { blocklistExternalIds: [] };
  }
}

function applyBlocklist(prompts: NormalizedPrompt[], blocklistExternalIds: string[]): NormalizedPrompt[] {
  const blocked = new Set(blocklistExternalIds);
  return prompts.filter((prompt) => !blocked.has(prompt.externalId));
}

export async function syncSource(config: SourceConfig): Promise<{
  sourceId: string;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  staleRetainedCount: number;
  total: number;
  skipped: number;
}> {
  const existing = await loadExistingSourceData(config.id);
  const markdown = await fetchReadme(config);
  const parsed = config.adapter.parse(markdown);
  if (parsed.prompts.length <= 130) {
    console.log(
      `[sync] ${config.id}: upstream README snapshot is bounded (about 120 visible prompts); incremental accumulation handles long-term growth`
    );
  }

  const knownIds = new Set(existing.byId.keys());
  const nextOrdered: NormalizedPrompt[] = [];
  let seenUnchanged = 0;
  let shouldStop = false;
  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const prompt of parsed.prompts) {
    if (shouldStop) {
      break;
    }

    const existingHash = existing.byHash.get(prompt.externalId);
    if (!knownIds.has(prompt.externalId)) {
      nextOrdered.push(prompt);
      newCount += 1;
      seenUnchanged = 0;
      continue;
    }

    if (existingHash === prompt.contentHash) {
      unchangedCount += 1;
      seenUnchanged += 1;
      if (seenUnchanged >= SAFETY_WINDOW) {
        shouldStop = true;
      }
      continue;
    }

    nextOrdered.push(prompt);
    updatedCount += 1;
    seenUnchanged = 0;
  }

  const touched = new Set(nextOrdered.map((item) => item.externalId));
  const snapshotIds = new Set(parsed.prompts.map((item) => item.externalId));
  const merged: NormalizedPrompt[] = [
    ...nextOrdered,
    ...existing.all.filter((item) => !touched.has(item.externalId))
  ];
  const staleRetainedCount = existing.all.filter((item) => !snapshotIds.has(item.externalId)).length;

  const overrides = await readOverrides();
  const blockedMerged = applyBlocklist(merged, overrides.blocklistExternalIds);
  const finalPrompts = blockedMerged;

  if (newCount > 0 || updatedCount > 0 || existing.all.length === 0) {
    await writeSourceData(config, finalPrompts, parsed.taxonomy, staleRetainedCount);
  }

  return {
    sourceId: config.id,
    newCount,
    updatedCount,
    unchangedCount,
    staleRetainedCount,
    total: finalPrompts.length,
    skipped: parsed.skipped.length
  };
}

async function main(): Promise<void> {
  const stats = [] as Array<{
    id: string;
    tool: string;
    lastSyncedAt: string;
    totalPrompts: number;
    featuredPrompts: number;
  }>;

  for (const source of sources) {
    try {
      const result = await syncSource(source);
      const sourceMetaPath = join(DATA_ROOT, source.id, "meta.json");
      const sourceMeta = await readJsonFile<{
        counts: { featured: number; total: number };
        lastSyncedAt: string;
      }>(sourceMetaPath);

      stats.push({
        id: source.id,
        tool: source.tool,
        lastSyncedAt: sourceMeta.lastSyncedAt,
        totalPrompts: sourceMeta.counts.total,
        featuredPrompts: sourceMeta.counts.featured
      });

      console.log(
        `[sync] ${source.id}: new=${result.newCount}, updated=${result.updatedCount}, unchanged=${result.unchangedCount}, staleRetained=${result.staleRetainedCount}, total=${result.total}, skipped=${result.skipped}`
      );
    } catch (error) {
      console.warn(
        `[sync] ${source.id}: failed (${error instanceof Error ? error.message : "unknown error"}), continuing with other sources`
      );
    }
  }

  await writeSourcesSummary(stats);
}

void main();
