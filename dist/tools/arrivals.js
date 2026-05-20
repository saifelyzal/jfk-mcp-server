"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerArrivalsTools = registerArrivalsTools;
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
const aerodatabox_js_1 = require("../services/aerodatabox.js");
const ArrivalsInputSchema = zod_1.z.object({
    airline_iata: zod_1.z.string().length(2).toUpperCase().optional()
        .describe("Filter by airline IATA code, e.g. 'AA' for American Airlines"),
    flight_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional()
        .describe("Date in YYYY-MM-DD format. Defaults to a 12-hour window from now."),
    limit: zod_1.z.number().int().min(1).max(50).default(10)
        .describe("Results to return (1–50, default 10)"),
    offset: zod_1.z.number().int().min(0).default(0)
        .describe("Pagination offset (default 0)"),
}).strict();
function registerArrivalsTools(server) {
    server.registerTool("jfk_get_arrivals", {
        title: "JFK Arrivals",
        description: `Retrieve arriving flights at JFK (John F. Kennedy International Airport).

Returns scheduled, estimated, and actual arrival times, gate/terminal info, delay data, and flight status.

Args:
  - flight_date (string): YYYY-MM-DD date. Omit for current/upcoming arrivals.
  - airline_iata (string): Two-letter airline code e.g. "AA", "DL", "B6"
  - limit (number): Results per page, 1–50 (default 10)
  - offset (number): Pagination offset (default 0)

Returns JSON array each with: flight_iata, airline, status, origin_iata, origin_name,
scheduled/estimated/actual arrival times, arrival_terminal, arrival_gate, arrival_delay_min, aircraft_model.

Examples:
  - "Flights arriving at JFK today?" → no filters
  - "Delta arrivals at JFK?" → airline_iata="DL"
  - "JFK arrivals on April 20?" → flight_date="2026-04-20"`,
        inputSchema: ArrivalsInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (params) => {
        try {
            const { from, to } = (0, aerodatabox_js_1.buildWindow)(params.flight_date);
            const flights = await (0, aerodatabox_js_1.fetchFids)(constants_js_1.JFK_ICAO, from, to, "Arrival", params.airline_iata);
            const paged = flights.slice(params.offset, params.offset + params.limit);
            if (paged.length === 0) {
                return {
                    content: [{ type: "text", text: "No arriving flights found at JFK matching the given filters." }],
                };
            }
            const summaries = paged.map(aerodatabox_js_1.normaliseFlight);
            const output = {
                airport: "JFK – John F. Kennedy International",
                window: { from, to },
                total: flights.length,
                returned: paged.length,
                offset: params.offset,
                flights: summaries,
            };
            let text = `## JFK Arrivals (${paged.length} of ${flights.length}) · ${from} → ${to}\n\n`;
            text += summaries.map(aerodatabox_js_1.formatFlightMarkdown).join("\n\n");
            if (text.length > constants_js_1.CHARACTER_LIMIT)
                text = text.slice(0, constants_js_1.CHARACTER_LIMIT) + "\n\n…(truncated)";
            return { content: [{ type: "text", text }], structuredContent: output };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `Error fetching JFK arrivals: ${msg}` }], isError: true };
        }
    });
}
//# sourceMappingURL=arrivals.js.map