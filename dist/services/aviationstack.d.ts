import type { AviationStackResponse, Flight, FlightSummary } from "../types.js";
interface QueryParams {
    [key: string]: string | number | undefined;
}
export declare function fetchFlights(endpoint: "flights", params: QueryParams): Promise<AviationStackResponse>;
export declare function normaliseFlight(f: Flight): FlightSummary;
export declare function formatFlightMarkdown(s: FlightSummary): string;
export {};
//# sourceMappingURL=aviationstack.d.ts.map