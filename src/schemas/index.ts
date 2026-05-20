// ── schemas/index.ts ──────────────────────────────────────────────
import { z } from "zod";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../constants.js";

export const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .describe(`Results per page (1–${MAX_LIMIT}, default ${DEFAULT_LIMIT})`),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip for pagination (default 0)"),
});

export const FlightStatusFilterSchema = z.object({
  status: z
    .enum(["scheduled", "active", "landed", "cancelled", "incident", "diverted"])
    .optional()
    .describe(
      "Filter by flight status: scheduled | active | landed | cancelled | incident | diverted"
    ),
});

export const DateSchema = z.object({
  flight_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional()
    .describe("Date filter in YYYY-MM-DD format (defaults to today)"),
});
