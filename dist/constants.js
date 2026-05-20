"use strict";
// ── constants.ts ──────────────────────────────────────────────────
// Central config for the JFK MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_TIMEOUT_MS = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.CHARACTER_LIMIT = exports.AVIATIONSTACK_BASE = exports.JFK_IATA = void 0;
exports.JFK_IATA = "JFK";
exports.AVIATIONSTACK_BASE = "http://api.aviationstack.com/v1";
/** Max characters a tool response may contain before truncation. */
exports.CHARACTER_LIMIT = 8_000;
/** Default page size when caller does not specify a limit. */
exports.DEFAULT_LIMIT = 10;
/** Hard cap so callers cannot request enormous payloads. */
exports.MAX_LIMIT = 50;
/** HTTP request timeout in milliseconds. */
exports.REQUEST_TIMEOUT_MS = 10_000;
//# sourceMappingURL=constants.js.map