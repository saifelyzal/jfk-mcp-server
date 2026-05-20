import { z } from "zod";
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const FlightStatusFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["scheduled", "active", "landed", "cancelled", "incident", "diverted"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "active" | "landed" | "cancelled" | "incident" | "diverted" | undefined;
}, {
    status?: "scheduled" | "active" | "landed" | "cancelled" | "incident" | "diverted" | undefined;
}>;
export declare const DateSchema: z.ZodObject<{
    flight_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    flight_date?: string | undefined;
}, {
    flight_date?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map