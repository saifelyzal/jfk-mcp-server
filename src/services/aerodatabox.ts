// ── services/aerodatabox.ts ──────────────────────────────────────
// API client for AeroDataBox (via RapidAPI)
// Sign up free at: https://rapidapi.com/aedbx-aedbx/api/aerodatabox

import axios, { AxiosError } from "axios";
import {
  AERODATABOX_BASE,
  AERODATABOX_HOST,
  REQUEST_TIMEOUT_MS,
} from "../constants.js";
import type {
  AdbFidsResponse,
  AdbFlight,
  AdbFlightStatusItem,
  FlightSummary,
} from "../types.js";

// ── env ───────────────────────────────────────────────────────────
function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error(
      "RAPIDAPI_KEY environment variable is not set. " +
      "Subscribe free at https://rapidapi.com/aedbx-aedbx/api/aerodatabox"
    );
  }
  return key;
}

// ── shared headers ────────────────────────────────────────────────
function headers() {
  return {
    "x-rapidapi-host": AERODATABOX_HOST,
    "x-rapidapi-key": getApiKey(),
  };
}

// ── helpers ───────────────────────────────────────────────────────

/**
 * Build a local datetime string for AeroDataBox.
 * Format expected: "YYYY-MM-DDTHH:mm"  (no TZ suffix — it uses airport local time)
 */
export function buildWindow(
  dateStr: string | undefined,
  offsetHours = 0,
  windowHours = 12
): { from: string; to: string } {
  // If a date is given use midnight→midnight of that day
  if (dateStr) {
    return {
      from: `${dateStr}T00:00`,
      to:   `${dateStr}T23:59`,
    };
  }
  // Otherwise use a window around now
  const base = new Date();
  base.setHours(base.getHours() + offsetHours);
  const from = new Date(base);
  const to   = new Date(base);
  to.setHours(to.getHours() + windowHours);

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

  return { from: fmt(from), to: fmt(to) };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// ── FIDS (arrivals / departures board) ───────────────────────────
export async function fetchFids(
  icao: string,
  from: string,
  to: string,
  direction: "Arrival" | "Departure",
  airlineIata?: string
): Promise<AdbFlight[]> {
  const url = `${AERODATABOX_BASE}/flights/airports/icao/${icao}/${from}/${to}`;
  try {
    const resp = await axios.get<AdbFidsResponse>(url, {
      headers: headers(),
      params: {
        direction,
        withLeg: true,
        withCancelled: true,
        withCodeshared: false,
        withLocation: false,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const flights =
      direction === "Arrival"
        ? (resp.data.arrivals ?? [])
        : (resp.data.departures ?? []);

    if (airlineIata) {
      return flights.filter(
        (f) => f.airline?.iata?.toUpperCase() === airlineIata.toUpperCase()
      );
    }
    return flights;
  } catch (err) {
    throw handleAxiosError(err);
  }
}

// ── Single flight status ─────────────────────────────────────────
export async function fetchFlightStatus(
  flightIata: string,
  dateStr?: string
): Promise<AdbFlightStatusItem[]> {
  const date = dateStr ?? new Date().toISOString().slice(0, 10);
  const url  = `${AERODATABOX_BASE}/flights/number/${flightIata}/${date}`;
  try {
    const resp = await axios.get<AdbFlightStatusItem[]>(url, {
      headers: headers(),
      params: { withLocation: true, dateLocalRole: "Both" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return Array.isArray(resp.data) ? resp.data : [resp.data];
  } catch (err) {
    throw handleAxiosError(err);
  }
}

// ── Error handling ────────────────────────────────────────────────
function handleAxiosError(err: unknown): Error {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data   = err.response?.data as { message?: string } | undefined;
    if (status === 401 || status === 403) {
      return new Error(
        "Invalid or missing RAPIDAPI_KEY. " +
        "Subscribe at https://rapidapi.com/aedbx-aedbx/api/aerodatabox"
      );
    }
    if (status === 429) {
      return new Error(
        "Rate limit exceeded. Free plan: 500 calls/month. " +
        "Upgrade at RapidAPI if needed."
      );
    }
    if (status === 404) {
      return new Error("No data found for the requested flight/airport/date.");
    }
    return new Error(
      `AeroDataBox API error (HTTP ${status ?? "unknown"}): ${data?.message ?? err.message}`
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

// ── Normalisation ─────────────────────────────────────────────────
export function normaliseFlight(f: AdbFlight): FlightSummary {
  const dep = f.departure;
  const arr = f.arrival;
  return {
    flight_iata:          f.number ?? null,
    airline:              f.airline?.name ?? null,
    status:               f.status ?? null,
    origin_iata:          dep?.airport?.iata ?? null,
    origin_name:          dep?.airport?.name ?? null,
    destination_iata:     arr?.airport?.iata ?? null,
    destination_name:     arr?.airport?.name ?? null,
    scheduled_departure:  dep?.scheduledTime?.local ?? null,
    actual_departure:     dep?.actualTime?.local ?? null,
    estimated_departure:  dep?.estimatedTime?.local ?? null,
    scheduled_arrival:    arr?.scheduledTime?.local ?? null,
    actual_arrival:       arr?.actualTime?.local ?? null,
    estimated_arrival:    arr?.estimatedTime?.local ?? null,
    departure_terminal:   dep?.terminal ?? null,
    departure_gate:       dep?.gate ?? null,
    arrival_terminal:     arr?.terminal ?? null,
    arrival_gate:         arr?.gate ?? null,
    departure_delay_min:  dep?.delay ?? null,
    arrival_delay_min:    arr?.delay ?? null,
    aircraft_model:       f.aircraft?.model ?? null,
    aircraft_reg:         f.aircraft?.reg ?? null,
  };
}

// ── Markdown formatter ────────────────────────────────────────────
export function formatFlightMarkdown(s: FlightSummary): string {
  const dep = s.actual_departure ?? s.estimated_departure ?? s.scheduled_departure ?? "—";
  const arr = s.actual_arrival  ?? s.estimated_arrival  ?? s.scheduled_arrival  ?? "—";
  const delayTag =
    s.arrival_delay_min != null && s.arrival_delay_min > 0
      ? ` ⚠️ +${s.arrival_delay_min}min`
      : "";
  return [
    `**${s.flight_iata ?? "N/A"}** – ${s.airline ?? "Unknown Airline"}`,
    `  Status : ${s.status ?? "unknown"}${delayTag}`,
    `  Route  : ${s.origin_iata ?? "?"} → ${s.destination_iata ?? "?"}`,
    `  Departs: ${dep}  |  Arrives: ${arr}`,
    `  Gate   : ${s.departure_gate ?? "—"} (T${s.departure_terminal ?? "?"}) → ${s.arrival_gate ?? "—"} (T${s.arrival_terminal ?? "?"})`,
    s.aircraft_model ? `  Aircraft: ${s.aircraft_model}${s.aircraft_reg ? " · " + s.aircraft_reg : ""}` : "",
  ].filter(Boolean).join("\n");
}
