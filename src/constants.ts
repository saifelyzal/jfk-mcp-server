// ── constants.ts ──────────────────────────────────────────────────
// Central config for the JFK MCP server

export const JFK_IATA  = "JFK";
export const JFK_ICAO  = "KJFK";

export const AERODATABOX_BASE = "https://aerodatabox.p.rapidapi.com";
export const AERODATABOX_HOST = "aerodatabox.p.rapidapi.com";

/** Max characters a tool response may contain before truncation. */
export const CHARACTER_LIMIT = 8_000;

/** Default page size when caller does not specify a limit. */
export const DEFAULT_LIMIT = 10;

/** Hard cap so callers cannot request enormous payloads. */
export const MAX_LIMIT = 50;

/** HTTP request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Hours to look back/forward when no specific window is given. */
export const DEFAULT_WINDOW_HOURS = 6;
