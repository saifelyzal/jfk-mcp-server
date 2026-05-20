"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFlightStatusTools = registerFlightStatusTools;
const zod_1 = require("zod");
const constants_js_1 = require("../constants.js");
const aerodatabox_js_1 = require("../services/aerodatabox.js");
const FlightStatusInputSchema = zod_1.z.object({
    flight_iata: zod_1.z.string().min(3).max(7).toUpperCase()
        .describe("IATA flight number e.g. 'AA100', 'DL405', 'B61234'. Must include airline prefix."),
    flight_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional()
        .describe("Date in YYYY-MM-DD format (defaults to today)"),
}).strict();
function registerFlightStatusTools(server) {
    server.registerTool("jfk_get_flight_status", {
        title: "JFK Flight Status",
        description: `Get real-time status of a specific flight by IATA flight number.

Returns full status including live position when airborne, delays, gate/terminal, and on/off-block times.

Args:
  - flight_iata (string, required): IATA flight number e.g. "AA100", "DL405", "B61234"
  - flight_date (string, optional): YYYY-MM-DD (defaults to today)

Returns: flight_iata, airline, status, origin/destination, scheduled/estimated/actual
departure & arrival times, terminal, gate, delay_min, aircraft info, and live GPS data if airborne.

Examples:
  - "Is AA100 on time?" → flight_iata="AA100"
  - "Where is DL1 right now?" → flight_iata="DL1"
  - "What gate does B6415 depart from?" → flight_iata="B6415"`,
        inputSchema: FlightStatusInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (params) => {
        try {
            const results = await (0, aerodatabox_js_1.fetchFlightStatus)(params.flight_iata, params.flight_date);
            if (!results.length) {
                return {
                    content: [{
                            type: "text",
                            text: `No flights found for "${params.flight_iata}". Check the IATA code or try a specific flight_date.`,
                        }],
                };
            }
            const flight = results[0];
            const summary = (0, aerodatabox_js_1.normaliseFlight)(flight);
            // Live position block
            let liveBlock = "";
            if (flight.live && flight.live.speed && !flight.live.speed.isGround) {
                const l = flight.live;
                liveBlock = [
                    "",
                    "### Live Position",
                    `  Lat/Lon  : ${l.latitude?.toFixed(4)}, ${l.longitude?.toFixed(4)}`,
                    `  Altitude : ${l.altitude?.feet} ft`,
                    `  Speed    : ${l.speed?.horizontal} km/h`,
                    `  Updated  : ${l.updated}`,
                ].join("\n");
            }
            let text = `## Flight Status — ${summary.flight_iata}\n\n` +
                (0, aerodatabox_js_1.formatFlightMarkdown)(summary) + liveBlock;
            if (results.length > 1) {
                text += `\n\n_${results.length - 1} additional codeshare/leg(s) found for this flight number._`;
            }
            if (text.length > constants_js_1.CHARACTER_LIMIT)
                text = text.slice(0, constants_js_1.CHARACTER_LIMIT) + "\n\n…(truncated)";
            return {
                content: [{ type: "text", text }],
                structuredContent: { flight: summary, live: flight.live ?? null, total_results: results.length },
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error fetching status for ${params.flight_iata}: ${msg}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=flight-status.js.map