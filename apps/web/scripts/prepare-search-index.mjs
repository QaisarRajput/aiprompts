import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..", "..");
const dataRoot = join(repoRoot, "data");
const targetDir = join(webRoot, "public", "search-index");

await mkdir(targetDir, { recursive: true });

const entries = await readdir(dataRoot, { withFileTypes: true });
for (const dirent of entries) {
  if (!dirent.isDirectory()) {
    continue;
  }

  const sourceId = dirent.name;
  const sourceFile = join(dataRoot, sourceId, "search-index.json");
  const targetFile = join(targetDir, `${sourceId}.json`);

  try {
    await cp(sourceFile, targetFile);
    console.log(`[search-index] copied ${sourceId}`);
  } catch {
    // Ignore sources without search-index.json.
  }
}

try {
  await cp(join(dataRoot, "search-index.combined.json"), join(targetDir, "combined.json"));
  console.log("[search-index] copied combined");
} catch {
  // Ignore if combined index is not generated yet.
}
