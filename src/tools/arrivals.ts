// ── tools/arrivals.ts ────────────────────────────────────────────
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JFK_IATA, CHARACTER_LIMIT } from "../constants.js";
import {
  fetchFlights,
  normaliseFlight,
  formatFlightMarkdown,
} from "../services/aviationstack.js";
import {
  PaginationSchema,
  FlightStatusFilterSchema,
  DateSchema,
} from "../schemas/index.js";

const ArrivalsInputSchema = z
  .object({
    airline_iata: z
      .string()
      .length(2)
      .toUpperCase()
      .optional()
      .describe("Filter by airline IATA code, e.g. 'AA' for American Airlines"),
  })
  .merge(FlightStatusFilterSchema)
  .merge(DateSchema)
  .merge(PaginationSchema)
  .strict();

type ArrivalsInput = z.infer<typeof ArrivalsInputSchema>;

export function registerArrivalsTools(server: McpServer): void {
  server.registerTool(
    "jfk_get_arrivals",
    {
      title: "JFK Arrivals",
      description: `Retrieve a list of arriving flights at JFK (John F. Kennedy International Airport).

Returns scheduled, estimated, and actual arrival times, gate/terminal info, delay data, and live flight status.

Args:
  - limit (number): Results per page, 1–50 (default 10)
  - offset (number): Pagination offset (default 0)
  - status (string): Filter by status — scheduled | active | landed | cancelled | incident | diverted
  - flight_date (string): Date in YYYY-MM-DD format (defaults to today)
  - airline_iata (string): Two-letter airline code, e.g. "AA", "DL", "UA"

Returns JSON array of arrival objects, each with:
  - flight_iata, airline, status
  - origin_iata, origin_name
  - scheduled_arrival, estimated_arrival, actual_arrival
  - arrival_terminal, arrival_gate, arrival_delay_min
  - aircraft_iata

Example use cases:
  - "What flights are arriving at JFK today?" → call with no filters
  - "Show me Delta arrivals at JFK" → airline_iata="DL"
  - "Which JFK arrivals are delayed?" → status="active" then check delay fields
  - "JFK arrivals for 2025-07-04" → flight_date="2025-07-04"`,
      inputSchema: ArrivalsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ArrivalsInput) => {
      try {
        const query: Record<string, string | number | undefined> = {
          arr_iata: JFK_IATA,
          limit: params.limit,
          offset: params.offset,
        };
        if (params.status) query["flight_status"] = params.status;
        if (params.flight_date) query["flight_date"] = params.flight_date;
        if (params.airline_iata) query["airline_iata"] = params.airline_iata;

        const data = await fetchFlights("flights", query);
        const flights = data.data.map(normaliseFlight);

        if (flights.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No arriving flights found at JFK matching the given filters.",
              },
            ],
          };
        }

        const output = {
          airport: "JFK – John F. Kennedy International",
          pagination: data.pagination,
          flights,
        };

        // Build human-readable text
        let text = `## JFK Arrivals (${flights.length} of ${data.pagination.total})\n\n`;
        text += flights.map(formatFlightMarkdown).join("\n\n");
        if (text.length > CHARACTER_LIMIT) {
          text = text.slice(0, CHARACTER_LIMIT) + "\n\n…(truncated)";
        }

        return {
          content: [{ type: "text", text }],
          structuredContent: output,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching JFK arrivals: ${msg}` }],
          isError: true,
        };
      }
    }
  );
}
