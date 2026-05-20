"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeparturesTools = registerDeparturesTools;
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
const aviationstack_js_1 = require("../services/aviationstack.js");
const index_js_1 = require("../schemas/index.js");
const DeparturesInputSchema = zod_1.z
    .object({
    airline_iata: zod_1.z
        .string()
        .length(2)
        .toUpperCase()
        .optional()
        .describe("Filter by airline IATA code, e.g. 'B6' for JetBlue"),
})
    .merge(index_js_1.FlightStatusFilterSchema)
    .merge(index_js_1.DateSchema)
    .merge(index_js_1.PaginationSchema)
    .strict();
function registerDeparturesTools(server) {
    server.registerTool("jfk_get_departures", {
        title: "JFK Departures",
        description: `Retrieve a list of departing flights from JFK (John F. Kennedy International Airport).

Returns scheduled, estimated, and actual departure times, gate/terminal info, delay data, and live flight status.

Args:
  - limit (number): Results per page, 1–50 (default 10)
  - offset (number): Pagination offset (default 0)
  - status (string): Filter by status — scheduled | active | landed | cancelled | incident | diverted
  - flight_date (string): Date in YYYY-MM-DD format (defaults to today)
  - airline_iata (string): Two-letter airline code, e.g. "B6", "AA", "DL"

Returns JSON array of departure objects, each with:
  - flight_iata, airline, status
  - destination_iata, destination_name
  - scheduled_departure, estimated_departure, actual_departure
  - departure_terminal, departure_gate, departure_delay_min
  - aircraft_iata

Example use cases:
  - "What flights are leaving JFK today?" → no filters
  - "Show me JetBlue departures from JFK" → airline_iata="B6"
  - "Are any JFK departures cancelled?" → status="cancelled"
  - "JFK departure board for 2025-12-25" → flight_date="2025-12-25"`,
        inputSchema: DeparturesInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (params) => {
        try {
            const query = {
                dep_iata: constants_js_1.JFK_IATA,
                limit: params.limit,
                offset: params.offset,
            };
            if (params.status)
                query["flight_status"] = params.status;
            if (params.flight_date)
                query["flight_date"] = params.flight_date;
            if (params.airline_iata)
                query["airline_iata"] = params.airline_iata;
            const data = await (0, aviationstack_js_1.fetchFlights)("flights", query);
            const flights = data.data.map(aviationstack_js_1.normaliseFlight);
            if (flights.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No departing flights found from JFK matching the given filters.",
                        },
                    ],
                };
            }
            const output = {
                airport: "JFK – John F. Kennedy International",
                pagination: data.pagination,
                flights,
            };
            let text = `## JFK Departures (${flights.length} of ${data.pagination.total})\n\n`;
            text += flights.map(aviationstack_js_1.formatFlightMarkdown).join("\n\n");
            if (text.length > constants_js_1.CHARACTER_LIMIT) {
                text = text.slice(0, constants_js_1.CHARACTER_LIMIT) + "\n\n…(truncated)";
            }
            return {
                content: [{ type: "text", text }],
                structuredContent: output,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    { type: "text", text: `Error fetching JFK departures: ${msg}` },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=departures.js.map