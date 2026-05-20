"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateSchema = exports.FlightStatusFilterSchema = exports.PaginationSchema = void 0;
// ── schemas/index.ts ──────────────────────────────────────────────
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
exports.PaginationSchema = zod_1.z.object({
    limit: zod_1.z
        .number()
        .int()
        .min(1)
        .max(constants_js_1.MAX_LIMIT)
        .default(constants_js_1.DEFAULT_LIMIT)
        .describe(`Results per page (1–${constants_js_1.MAX_LIMIT}, default ${constants_js_1.DEFAULT_LIMIT})`),
    offset: zod_1.z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Number of results to skip for pagination (default 0)"),
});
exports.FlightStatusFilterSchema = zod_1.z.object({
    status: zod_1.z
        .enum(["scheduled", "active", "landed", "cancelled", "incident", "diverted"])
        .optional()
        .describe("Filter by flight status: scheduled | active | landed | cancelled | incident | diverted"),
});
exports.DateSchema = zod_1.z.object({
    flight_date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
        .optional()
        .describe("Date filter in YYYY-MM-DD format (defaults to today)"),
});
//# sourceMappingURL=index.js.map