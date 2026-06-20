import { createHash } from "node:crypto";

import {
  type NormalizedPrompt,
  type NormalizedPromptInput,
  NormalizedPromptInputSchema
} from "./prompt";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const mapped = entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`);
    return `{${mapped.join(",")}}`;
  }

  return JSON.stringify(value);
}

export function computeContentHash(input: NormalizedPromptInput): string {
  const validInput = NormalizedPromptInputSchema.parse(input);
  return createHash("sha1").update(stableStringify(validInput)).digest("hex");
}

export function withContentHash(input: NormalizedPromptInput): NormalizedPrompt {
  return {
    ...input,
    contentHash: computeContentHash(input)
  };
}
