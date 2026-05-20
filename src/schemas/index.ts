// ── schemas/index.ts ─────────────────────────────────────────────
// Kept for backward compat; main schemas now inline in each tool
import { z } from "zod";

export const DateSchema = z.object({
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    .describe("Date in YYYY-MM-DD format"),
});

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0),
});
