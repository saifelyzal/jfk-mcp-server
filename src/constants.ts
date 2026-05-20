// ── constants.ts ──────────────────────────────────────────────────
// Central config for the JFK MCP server

export const JFK_IATA = "JFK";

export const AVIATIONSTACK_BASE = "http://api.aviationstack.com/v1";

/** Max characters a tool response may contain before truncation. */
export const CHARACTER_LIMIT = 8_000;

/** Default page size when caller does not specify a limit. */
export const DEFAULT_LIMIT = 10;

/** Hard cap so callers cannot request enormous payloads. */
export const MAX_LIMIT = 50;

/** HTTP request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 10_000;
