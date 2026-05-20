// ── types.ts ──────────────────────────────────────────────────────
// Shared TypeScript interfaces mirroring the AviationStack response

export interface FlightAirport {
  airport: string | null;
  timezone: string | null;
  iata: string | null;
  icao: string | null;
  terminal: string | null;
  gate: string | null;
  delay: number | null;
  scheduled: string | null;
  estimated: string | null;
  actual: string | null;
  estimated_runway: string | null;
  actual_runway: string | null;
}

export interface FlightAirline {
  name: string | null;
  iata: string | null;
  icao: string | null;
}

export interface FlightAircraft {
  registration: string | null;
  iata: string | null;
  icao: string | null;
  icao24: string | null;
}

export interface FlightLive {
  updated: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  direction: number | null;
  speed_horizontal: number | null;
  speed_vertical: number | null;
  is_ground: boolean;
}

export interface Flight {
  flight_date: string | null;
  flight_status: string | null;
  departure: FlightAirport;
  arrival: FlightAirport;
  airline: FlightAirline;
  flight: {
    number: string | null;
    iata: string | null;
    icao: string | null;
  };
  aircraft: FlightAircraft | null;
  live: FlightLive | null;
}

export interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: Flight[];
}

/** Normalised flight row returned by our tools. */
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
  aircraft_iata: string | null;
}
