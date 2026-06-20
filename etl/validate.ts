import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { NormalizedPromptSchema, SourceMetaSchema, SourcesJsonSchema } from "@aiprompts/schema";

const DATA_ROOT = join(process.cwd(), "data");

async function main(): Promise<void> {
  const summaryRaw = await readFile(join(DATA_ROOT, "sources.json"), "utf8");
  SourcesJsonSchema.parse(JSON.parse(summaryRaw));

  const sourceDirs = await readdir(DATA_ROOT, { withFileTypes: true });
  for (const dirent of sourceDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const sourceDir = join(DATA_ROOT, dirent.name);
    const metaRaw = await readFile(join(sourceDir, "meta.json"), "utf8");
    SourceMetaSchema.parse(JSON.parse(metaRaw));

    const chunksDir = join(sourceDir, "chunks");
    const chunks = (await readdir(chunksDir)).filter((name) => name.endsWith(".json"));

    for (const chunk of chunks) {
      const chunkRaw = await readFile(join(chunksDir, chunk), "utf8");
      const records = JSON.parse(chunkRaw) as unknown[];
      for (const record of records) {
        NormalizedPromptSchema.parse(record);
      }
    }
  }

  console.log("[validate] OK");
}

void main();
