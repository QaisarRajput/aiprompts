import type { NormalizedPrompt } from "@aiprompts/schema";

export type ParseSkip = {
  title: string;
  reason: string;
};

export type SourceAdapterResult = {
  prompts: NormalizedPrompt[];
  taxonomy: string[];
  skipped: ParseSkip[];
};

export interface SourceAdapter {
  parse(readmeMarkdown: string): SourceAdapterResult;
}
