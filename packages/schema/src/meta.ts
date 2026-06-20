import { z } from "zod";

const CountBreakdownSchema = z.object({
  total: z.number().int().nonnegative(),
  featured: z.number().int().nonnegative(),
  byCategory: z.record(z.number().int().nonnegative()),
  byLanguage: z.record(z.number().int().nonnegative())
});

export const SourceMetaSchema = z.object({
  sourceId: z.string().min(1),
  tool: z.string().min(1),
  taxonomy: z.array(z.string().min(1)),
  counts: CountBreakdownSchema,
  staleRetainedCount: z.number().int().nonnegative().optional(),
  lastSyncedAt: z.string().datetime({ offset: true })
});

export const SourcesJsonItemSchema = z.object({
  id: z.string().min(1),
  tool: z.string().min(1),
  lastSyncedAt: z.string().datetime({ offset: true }),
  totalPrompts: z.number().int().nonnegative(),
  featuredPrompts: z.number().int().nonnegative()
});

export const SourcesJsonSchema = z.object({
  version: z.literal(1),
  sources: z.array(SourcesJsonItemSchema)
});

export type SourceMeta = z.infer<typeof SourceMetaSchema>;
export type SourcesJsonItem = z.infer<typeof SourcesJsonItemSchema>;
export type SourcesJson = z.infer<typeof SourcesJsonSchema>;
