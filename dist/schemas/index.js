"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.DateSchema = void 0;
// ── schemas/index.ts ─────────────────────────────────────────────
// Kept for backward compat; main schemas now inline in each tool
const zod_1 = require("zod");
exports.DateSchema = zod_1.z.object({
    flight_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
        .describe("Date in YYYY-MM-DD format"),
});
exports.PaginationSchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    offset: zod_1.z.number().int().min(0).default(0),
});
//# sourceMappingURL=index.js.map