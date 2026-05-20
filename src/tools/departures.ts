// ── tools/departures.ts ──────────────────────────────────────────
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

const DeparturesInputSchema = z
  .object({
    airline_iata: z
      .string()
      .length(2)
      .toUpperCase()
      .optional()
      .describe("Filter by airline IATA code, e.g. 'B6' for JetBlue"),
  })
  .merge(FlightStatusFilterSchema)
  .merge(DateSchema)
  .merge(PaginationSchema)
  .strict();

type DeparturesInput = z.infer<typeof DeparturesInputSchema>;

export function registerDeparturesTools(server: McpServer): void {
  server.registerTool(
    "jfk_get_departures",
    {
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
    },
    async (params: DeparturesInput) => {
      try {
        const query: Record<string, string | number | undefined> = {
          dep_iata: JFK_IATA,
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
          content: [
            { type: "text", text: `Error fetching JFK departures: ${msg}` },
          ],
          isError: true,
        };
      }
    }
  );
}
