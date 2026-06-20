import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import {
  NormalizedPromptSchema,
  SourceMetaSchema,
  SourcesJsonSchema,
  type NormalizedPrompt,
  type SourceMeta,
  type SourcesJson
} from "@aiprompts/schema";

const DATA_ROOT = join(process.cwd(), "..", "..", "data");

const SOURCE_FILTER = (process.env.NEXT_PUBLIC_SOURCE_FILTER ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function isAllowedSource(sourceId: string): boolean {
  if (SOURCE_FILTER.length === 0) {
    return true;
  }
  return SOURCE_FILTER.includes(sourceId);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function getSourcesSummary(): Promise<SourcesJson> {
  const parsed = await readJson<unknown>(join(DATA_ROOT, "sources.json"));
  const summary = SourcesJsonSchema.parse(parsed);
  return {
    ...summary,
    sources: summary.sources.filter((source) => isAllowedSource(source.id))
  };
}

export async function getSourceMeta(sourceId: string): Promise<SourceMeta> {
  if (!isAllowedSource(sourceId)) {
    throw new Error(`Source not allowed by NEXT_PUBLIC_SOURCE_FILTER: ${sourceId}`);
  }
  const parsed = await readJson<unknown>(join(DATA_ROOT, sourceId, "meta.json"));
  return SourceMetaSchema.parse(parsed);
}

export async function getSourcePrompts(sourceId: string): Promise<NormalizedPrompt[]> {
  if (!isAllowedSource(sourceId)) {
    return [];
  }
  const chunksDir = join(DATA_ROOT, sourceId, "chunks");
  const files = (await readdir(chunksDir)).filter((name) => name.endsWith(".json")).sort();
  const prompts: NormalizedPrompt[] = [];

  for (const file of files) {
    const records = await readJson<unknown[]>(join(chunksDir, file));
    for (const record of records) {
      prompts.push(NormalizedPromptSchema.parse(record));
    }
  }

  return prompts;
}

export async function getPromptById(
  sourceId: string,
  externalId: string
): Promise<NormalizedPrompt | null> {
  const prompts = await getSourcePrompts(sourceId);
  return prompts.find((item) => item.externalId === externalId) ?? null;
}

export async function getAllPrompts(): Promise<NormalizedPrompt[]> {
  const summary = await getSourcesSummary();
  const all = await Promise.all(summary.sources.map(async (source) => getSourcePrompts(source.id)));
  return all.flat();
}
