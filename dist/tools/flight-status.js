"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFlightStatusTools = registerFlightStatusTools;
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
const aviationstack_js_1 = require("../services/aviationstack.js");
const index_js_1 = require("../schemas/index.js");
const FlightStatusInputSchema = zod_1.z
    .object({
    flight_iata: zod_1.z
        .string()
        .min(3)
        .max(7)
        .toUpperCase()
        .describe("IATA flight number, e.g. 'AA100', 'DL405', 'B61234'. Must include airline prefix."),
})
    .merge(index_js_1.DateSchema)
    .strict();
function registerFlightStatusTools(server) {
    server.registerTool("jfk_get_flight_status", {
        title: "JFK Flight Status",
        description: `Get the real-time status of a specific flight by IATA flight number.

Use this when you know the flight number and want full status details including live position, delays, gate changes, and on/off-block times.

Args:
  - flight_iata (string, required): IATA flight number, e.g. "AA100", "DL405", "B61234"
  - flight_date (string, optional): Date in YYYY-MM-DD format (defaults to today)

Returns a detailed flight object with:
  - flight_iata, airline, status (scheduled | active | landed | cancelled | incident | diverted)
  - origin_iata, origin_name, destination_iata, destination_name
  - scheduled/estimated/actual departure & arrival timestamps
  - departure_terminal, departure_gate
  - arrival_terminal, arrival_gate
  - departure_delay_min, arrival_delay_min
  - aircraft_iata
  - live position data (latitude, longitude, altitude, speed) when airborne

Error cases:
  - "Flight not found" → flight number may be wrong or flight not yet in system
  - "No flights found for <code>" → check the date; day-before or next-day flights need explicit flight_date

Example use cases:
  - "Is AA100 on time today?" → flight_iata="AA100"
  - "What gate is DL405 departing from?" → flight_iata="DL405"
  - "Where is B61234 right now?" → flight_iata="B61234" (live data if airborne)`,
        inputSchema: FlightStatusInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (params) => {
        try {
            const query = {
                flight_iata: params.flight_iata,
                limit: 5,
                offset: 0,
            };
            if (params.flight_date)
                query["flight_date"] = params.flight_date;
            const data = await (0, aviationstack_js_1.fetchFlights)("flights", query);
            if (data.data.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No flights found for flight number "${params.flight_iata}". ` +
                                `Double-check the IATA code (e.g. "AA100") or specify a flight_date.`,
                        },
                    ],
                };
            }
            // Prefer the exact flight if multiple results
            const best = data.data.find((f) => f.flight.iata?.toUpperCase() === params.flight_iata.toUpperCase()) ?? data.data[0];
            const summary = (0, aviationstack_js_1.normaliseFlight)(best);
            // Build live-position block if available
            let liveBlock = "";
            if (best.live && !best.live.is_ground) {
                const l = best.live;
                liveBlock = [
                    "",
                    "### Live Position",
                    `  Lat/Lon  : ${l.latitude?.toFixed(4)}, ${l.longitude?.toFixed(4)}`,
                    `  Altitude : ${l.altitude} ft`,
                    `  Speed    : ${l.speed_horizontal} km/h`,
                    `  Updated  : ${l.updated}`,
                ].join("\n");
            }
            let text = `## Flight Status — ${summary.flight_iata}\n\n` +
                (0, aviationstack_js_1.formatFlightMarkdown)(summary) +
                liveBlock;
            if (text.length > constants_js_1.CHARACTER_LIMIT) {
                text = text.slice(0, constants_js_1.CHARACTER_LIMIT) + "\n\n…(truncated)";
            }
            return {
                content: [{ type: "text", text }],
                structuredContent: { flight: summary, live: best.live ?? null },
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching status for flight ${params.flight_iata}: ${msg}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=flight-status.js.map