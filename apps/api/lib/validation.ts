import { z } from "zod";

export const opportunitiesSchema = z.object({
  size: z.number().int().min(1).max(20).optional().default(10),
  keywords: z.string().optional(),
  language: z.string().optional(),
  fluency: z
    .enum(["basic", "conversational", "fully-fluent", "native", "fluent"])
    .optional(),
  currency: z.string().optional(),
  periodicity: z.enum(["hourly", "monthly", "yearly"]).optional(),
});

export type OpportunitiesRequest = z.infer<typeof opportunitiesSchema>;
