import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import MiniSearch from "minisearch";

import { NormalizedPromptSchema, type NormalizedPrompt } from "@aiprompts/schema";

const DATA_ROOT = join(process.cwd(), "data");

async function loadSourcePrompts(sourceId: string): Promise<NormalizedPrompt[]> {
  const chunksDir = join(DATA_ROOT, sourceId, "chunks");
  const files = (await readdir(chunksDir)).filter((name) => name.endsWith(".json")).sort();
  const items: NormalizedPrompt[] = [];

  for (const file of files) {
    const records = JSON.parse(await readFile(join(chunksDir, file), "utf8")) as unknown[];
    for (const record of records) {
      items.push(NormalizedPromptSchema.parse(record));
    }
  }

  return items;
}

async function main(): Promise<void> {
  const sourceDirs = await readdir(DATA_ROOT, { withFileTypes: true });
  const combined: NormalizedPrompt[] = [];

  for (const dirent of sourceDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const sourceId = dirent.name;
    const chunksDir = join(DATA_ROOT, sourceId, "chunks");
    try {
      await readdir(chunksDir);
    } catch {
      continue;
    }

    const prompts = await loadSourcePrompts(sourceId);
    combined.push(...prompts);
    const miniSearch = new MiniSearch({
      fields: ["title", "description", "promptText", "category", "tool", "language"],
      storeFields: ["id", "externalId", "title", "category", "language", "featured", "images"],
      idField: "id",
      searchOptions: {
        boost: {
          title: 5,
          category: 3
        },
        fuzzy: 0.15,
        prefix: true
      }
    });

    miniSearch.addAll(prompts);

    const indexPayload = {
      sourceId,
      generatedAt: new Date().toISOString(),
      documentCount: prompts.length,
      index: miniSearch.toJSON()
    };

    await writeFile(
      join(DATA_ROOT, sourceId, "search-index.json"),
      `${JSON.stringify(indexPayload, null, 2)}\n`,
      "utf8"
    );
    console.log(`[index] ${sourceId}: ${prompts.length} prompts indexed`);
  }

  if (combined.length > 0) {
    const miniSearch = new MiniSearch({
      fields: ["title", "description", "promptText", "category", "tool", "language", "sourceId"],
      storeFields: ["id", "externalId", "title", "category", "language", "featured", "images", "sourceId"],
      idField: "id",
      searchOptions: {
        boost: {
          title: 5,
          category: 3,
          tool: 2,
          sourceId: 2
        },
        fuzzy: 0.15,
        prefix: true
      }
    });

    miniSearch.addAll(combined);
    const combinedPayload = {
      sourceId: "combined",
      generatedAt: new Date().toISOString(),
      documentCount: combined.length,
      index: miniSearch.toJSON()
    };

    await writeFile(
      join(DATA_ROOT, "search-index.combined.json"),
      `${JSON.stringify(combinedPayload, null, 2)}\n`,
      "utf8"
    );
    console.log(`[index] combined: ${combined.length} prompts indexed`);
  }
}

void main();
