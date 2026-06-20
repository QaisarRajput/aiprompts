import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { YouMindAwesomeListAdapter } from "../adapters/youmind-awesome-list.js";

describe("YouMindAwesomeListAdapter", () => {
  it("parses prompts from README fixture", async () => {
    const fixturePath = join(
      process.cwd(),
      "etl",
      "__tests__",
      "fixtures",
      "youmind-readme-sample.md"
    );
    const markdown = await readFile(fixturePath, "utf8");

    const adapter = new YouMindAwesomeListAdapter({
      sourceId: "gpt-image-2",
      tool: "GPT Image 2"
    });

    const result = adapter.parse(markdown);
    expect(result.skipped).toHaveLength(0);
    expect(result.taxonomy).toContain("Profile / Avatar");
    expect(result.prompts).toHaveLength(2);

    const first = result.prompts[0];
    expect(first?.externalId).toBe("26257");
    expect(first?.featured).toBe(true);
    expect(first?.templateArguments).toHaveLength(1);

    const second = result.prompts[1];
    expect(second?.promptFormat).toBe("json");
    expect(second?.category).toBe("Social Media Post");
  });

  it("parses seedance-style fixtures without adapter changes", async () => {
    const fixturePath = join(
      process.cwd(),
      "etl",
      "__tests__",
      "fixtures",
      "youmind-seedance-sample.md"
    );
    const markdown = await readFile(fixturePath, "utf8");

    const adapter = new YouMindAwesomeListAdapter({
      sourceId: "seedance-2",
      tool: "Seedance 2"
    });

    const result = adapter.parse(markdown);
    expect(result.skipped).toHaveLength(0);
    expect(result.prompts).toHaveLength(1);

    const first = result.prompts[0];
    expect(first?.externalId).toBe("1402");
    expect(first?.featured).toBe(true);
    expect(first?.templateArguments).toHaveLength(1);
    expect(first?.sourceId).toBe("seedance-2");
  });
});
