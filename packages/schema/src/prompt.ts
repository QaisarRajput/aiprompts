import { z } from "zod";

export const PromptImageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional()
});

export const TemplateArgumentSchema = z.object({
  name: z.string().min(1),
  default: z.string()
});

export const PromptAuthorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional()
});

export const PromptSourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url()
});

export const NormalizedPromptSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  tool: z.string().min(1),
  externalId: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1).nullable(),
  description: z.string(),
  promptText: z.string().min(1),
  promptFormat: z.enum(["json", "text"]),
  templateArguments: z.array(TemplateArgumentSchema),
  raycastFriendly: z.boolean(),
  featured: z.boolean(),
  language: z.string().min(1),
  images: z.array(PromptImageSchema).min(1),
  author: PromptAuthorSchema,
  source: PromptSourceSchema,
  publishedAt: z.string().datetime({ offset: true }),
  externalUrl: z.string().url(),
  contentHash: z.string().regex(/^[a-f0-9]{40}$/i)
});

export const NormalizedPromptInputSchema = NormalizedPromptSchema.omit({
  contentHash: true
});

export type PromptImage = z.infer<typeof PromptImageSchema>;
export type TemplateArgument = z.infer<typeof TemplateArgumentSchema>;
export type PromptAuthor = z.infer<typeof PromptAuthorSchema>;
export type PromptSource = z.infer<typeof PromptSourceSchema>;
export type NormalizedPrompt = z.infer<typeof NormalizedPromptSchema>;
export type NormalizedPromptInput = z.infer<typeof NormalizedPromptInputSchema>;
