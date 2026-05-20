import type { AdbFlight, AdbFlightStatusItem, FlightSummary } from "../types.js";
/**
 * Build a local datetime string for AeroDataBox.
 * Format expected: "YYYY-MM-DDTHH:mm"  (no TZ suffix — it uses airport local time)
 */
export declare function buildWindow(dateStr: string | undefined, offsetHours?: number, windowHours?: number): {
    from: string;
    to: string;
};
export declare function fetchFids(icao: string, from: string, to: string, direction: "Arrival" | "Departure", airlineIata?: string): Promise<AdbFlight[]>;
export declare function fetchFlightStatus(flightIata: string, dateStr?: string): Promise<AdbFlightStatusItem[]>;
export declare function normaliseFlight(f: AdbFlight): FlightSummary;
export declare function formatFlightMarkdown(s: FlightSummary): string;
//# sourceMappingURL=aerodatabox.d.ts.map