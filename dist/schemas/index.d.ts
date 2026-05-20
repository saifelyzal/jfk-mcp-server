import { z } from "zod";
export declare const DateSchema: z.ZodObject<{
    flight_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    flight_date?: string | undefined;
}, {
    flight_date?: string | undefined;
}>;
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
//# sourceMappingURL=index.d.ts.map