// ── types.ts ──────────────────────────────────────────────────────
// Shared TypeScript interfaces mirroring AeroDataBox responses

// ── AeroDataBox FIDS (arrivals/departures board) ─────────────────
export interface AdbAirport {
  icao?: string;
  iata?: string;
  name?: string;
  shortName?: string;
  municipalityName?: string;
  location?: { lat: number; lon: number };
  countryCode?: string;
}

export interface AdbTimepoint {
  utc?: string;
  local?: string;
}

export interface AdbFlightLeg {
  airport: AdbAirport;
  scheduledTime?: AdbTimepoint;
  estimatedTime?: AdbTimepoint;
  actualTime?: AdbTimepoint;
  runwayTime?: AdbTimepoint;
  terminal?: string;
  gate?: string;
  baggageBelt?: string;
  delay?: number;         // minutes
  checkInDesk?: string;
}

export interface AdbAirline {
  name?: string;
  iata?: string;
  icao?: string;
}

export interface AdbAircraft {
  reg?: string;
  modeS?: string;
  model?: string;
  image?: { url?: string };
}

export interface AdbFlight {
  number: string;           // e.g. "AA100"
  callSign?: string;
  status?: string;          // e.g. "Landed", "EnRoute", "Scheduled", "Cancelled"
  codeshareStatus?: string;
  isCargo?: boolean;
  aircraft?: AdbAircraft;
  airline?: AdbAirline;
  departure?: AdbFlightLeg;
  arrival?: AdbFlightLeg;
  greatCircleDistance?: { km: number; mile: number };
}

export interface AdbFidsResponse {
  arrivals?: AdbFlight[];
  departures?: AdbFlight[];
}

// ── AeroDataBox Flight Status (single flight) ────────────────────
export interface AdbLiveData {
  updated?: string;
  latitude?: number;
  longitude?: number;
  altitude?: { feet?: number; meters?: number };
  speed?: { horizontal?: number; vertical?: number; isGround?: boolean };
  track?: number;
  callSign?: string;
}

export interface AdbFlightStatusItem extends AdbFlight {
  live?: AdbLiveData;
}

// ── Normalised summary (tool output) ────────────────────────────
export interface FlightSummary {
  flight_iata: string | null;
  airline: string | null;
  status: string | null;
  origin_iata: string | null;
  origin_name: string | null;
  destination_iata: string | null;
  destination_name: string | null;
  scheduled_departure: string | null;
  actual_departure: string | null;
  estimated_departure: string | null;
  scheduled_arrival: string | null;
  actual_arrival: string | null;
  estimated_arrival: string | null;
  departure_terminal: string | null;
  departure_gate: string | null;
  arrival_terminal: string | null;
  arrival_gate: string | null;
  departure_delay_min: number | null;
  arrival_delay_min: number | null;
  aircraft_model: string | null;
  aircraft_reg: string | null;
}
