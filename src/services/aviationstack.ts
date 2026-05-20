// ── services/aviationstack.ts ─────────────────────────────────────
// Thin wrapper around the AviationStack REST API.

import axios, { AxiosError } from "axios";
import {
  AVIATIONSTACK_BASE,
  REQUEST_TIMEOUT_MS,
} from "../constants.js";
import type {
  AviationStackResponse,
  Flight,
  FlightSummary,
} from "../types.js";

// ── env ──────────────────────────────────────────────────────────
function getApiKey(): string {
  const key = process.env.AVIATIONSTACK_API_KEY;
  if (!key) {
    throw new Error(
      "AVIATIONSTACK_API_KEY environment variable is not set. " +
        "Get a free key at https://aviationstack.com/signup/free"
    );
  }
  return key;
}

// ── core request ─────────────────────────────────────────────────
interface QueryParams {
  [key: string]: string | number | undefined;
}

export async function fetchFlights(
  endpoint: "flights",
  params: QueryParams
): Promise<AviationStackResponse> {
  const apiKey = getApiKey();
  try {
    const response = await axios.get<AviationStackResponse>(
      `${AVIATIONSTACK_BASE}/${endpoint}`,
      {
        params: { access_key: apiKey, ...params },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
    return response.data;
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const msg = (err.response?.data as { error?: { message?: string } })
        ?.error?.message;
      if (status === 401) {
        throw new Error(
          "Invalid API key. Verify AVIATIONSTACK_API_KEY is correct."
        );
      }
      if (status === 429) {
        throw new Error(
          "Rate limit exceeded. Free tier allows 100 requests/month. Consider upgrading at aviationstack.com."
        );
      }
      throw new Error(
        `AviationStack API error (HTTP ${status ?? "unknown"}): ${msg ?? err.message}`
      );
    }
    throw err;
  }
}

// ── normalisation ────────────────────────────────────────────────
export function normaliseFlight(f: Flight): FlightSummary {
  return {
    flight_iata: f.flight.iata,
    airline: f.airline.name,
    status: f.flight_status,
    origin_iata: f.departure.iata,
    origin_name: f.departure.airport,
    destination_iata: f.arrival.iata,
    destination_name: f.arrival.airport,
    scheduled_departure: f.departure.scheduled,
    actual_departure: f.departure.actual,
    estimated_departure: f.departure.estimated,
    scheduled_arrival: f.arrival.scheduled,
    actual_arrival: f.arrival.actual,
    estimated_arrival: f.arrival.estimated,
    departure_terminal: f.departure.terminal,
    departure_gate: f.departure.gate,
    arrival_terminal: f.arrival.terminal,
    arrival_gate: f.arrival.gate,
    departure_delay_min: f.departure.delay,
    arrival_delay_min: f.arrival.delay,
    aircraft_iata: f.aircraft?.iata ?? null,
  };
}

// ── markdown formatter ───────────────────────────────────────────
export function formatFlightMarkdown(s: FlightSummary): string {
  const dep =
    s.actual_departure ?? s.estimated_departure ?? s.scheduled_departure ?? "—";
  const arr =
    s.actual_arrival ?? s.estimated_arrival ?? s.scheduled_arrival ?? "—";
  const delay =
    s.arrival_delay_min != null && s.arrival_delay_min > 0
      ? ` ⚠️ +${s.arrival_delay_min}min`
      : "";
  return [
    `**${s.flight_iata ?? "N/A"}** – ${s.airline ?? "Unknown Airline"}`,
    `  Status : ${capitalize(s.status ?? "unknown")}${delay}`,
    `  Route  : ${s.origin_iata ?? "?"} → ${s.destination_iata ?? "?"}`,
    `  Departs: ${dep}  |  Arrives: ${arr}`,
    `  Gate   : ${s.departure_gate ?? "—"} (T${s.departure_terminal ?? "?"})  →  ${s.arrival_gate ?? "—"} (T${s.arrival_terminal ?? "?"})`,
  ].join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
