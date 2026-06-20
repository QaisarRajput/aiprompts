import type { TemplateArgument } from "@aiprompts/schema";

const ARGUMENT_REGEX = /\{argument\s+name="([^"]+)"\s+default="((?:[^"\\]|\\.)*)"\}/g;

export function extractTemplateArguments(promptText: string): TemplateArgument[] {
  const dedupe = new Map<string, TemplateArgument>();

  for (const match of promptText.matchAll(ARGUMENT_REGEX)) {
    const name = match[1]?.trim();
    if (!name) {
      continue;
    }

    const defaultValue = (match[2] ?? "").replaceAll('\\"', '"');
    if (!dedupe.has(name)) {
      dedupe.set(name, { name, default: defaultValue });
    }
  }

  return [...dedupe.values()];
}
