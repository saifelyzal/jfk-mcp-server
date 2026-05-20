"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeparturesTools = registerDeparturesTools;
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
const aerodatabox_js_1 = require("../services/aerodatabox.js");
const DeparturesInputSchema = zod_1.z.object({
    airline_iata: zod_1.z.string().length(2).toUpperCase().optional()
        .describe("Filter by airline IATA code, e.g. 'B6' for JetBlue"),
    flight_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional()
        .describe("Date in YYYY-MM-DD format. Defaults to a 12-hour window from now."),
    limit: zod_1.z.number().int().min(1).max(50).default(10)
        .describe("Results to return (1–50, default 10)"),
    offset: zod_1.z.number().int().min(0).default(0)
        .describe("Pagination offset (default 0)"),
}).strict();
function registerDeparturesTools(server) {
    server.registerTool("jfk_get_departures", {
        title: "JFK Departures",
        description: `Retrieve departing flights from JFK (John F. Kennedy International Airport).

Returns scheduled, estimated, and actual departure times, gate/terminal info, delay data, and flight status.

Args:
  - flight_date (string): YYYY-MM-DD date. Omit for current/upcoming departures.
  - airline_iata (string): Two-letter airline code e.g. "B6", "AA", "DL"
  - limit (number): Results per page, 1–50 (default 10)
  - offset (number): Pagination offset (default 0)

Returns JSON array each with: flight_iata, airline, status, destination_iata, destination_name,
scheduled/estimated/actual departure times, departure_terminal, departure_gate, departure_delay_min, aircraft_model.

Examples:
  - "JetBlue departures from JFK?" → airline_iata="B6"
  - "Cancelled JFK departures today?" → use status filter on results
  - "JFK departures on April 15?" → flight_date="2026-04-15"`,
        inputSchema: DeparturesInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (params) => {
        try {
            const { from, to } = (0, aerodatabox_js_1.buildWindow)(params.flight_date);
            const flights = await (0, aerodatabox_js_1.fetchFids)(constants_js_1.JFK_ICAO, from, to, "Departure", params.airline_iata);
            const paged = flights.slice(params.offset, params.offset + params.limit);
            if (paged.length === 0) {
                return {
                    content: [{ type: "text", text: "No departing flights found from JFK matching the given filters." }],
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
            let text = `## JFK Departures (${paged.length} of ${flights.length}) · ${from} → ${to}\n\n`;
            text += summaries.map(aerodatabox_js_1.formatFlightMarkdown).join("\n\n");
            if (text.length > constants_js_1.CHARACTER_LIMIT)
                text = text.slice(0, constants_js_1.CHARACTER_LIMIT) + "\n\n…(truncated)";
            return { content: [{ type: "text", text }], structuredContent: output };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `Error fetching JFK departures: ${msg}` }], isError: true };
        }
    });
}
//# sourceMappingURL=departures.js.map