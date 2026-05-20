"use strict";
// ── services/aerodatabox.ts ──────────────────────────────────────
// API client for AeroDataBox (via RapidAPI)
// Sign up free at: https://rapidapi.com/aedbx-aedbx/api/aerodatabox
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWindow = buildWindow;
exports.fetchFids = fetchFids;
exports.fetchFlightStatus = fetchFlightStatus;
exports.normaliseFlight = normaliseFlight;
exports.formatFlightMarkdown = formatFlightMarkdown;
const axios_1 = __importStar(require("axios"));
const constants_js_1 = require("../constants.js");
// ── env ───────────────────────────────────────────────────────────
function getApiKey() {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
        throw new Error("RAPIDAPI_KEY environment variable is not set. " +
            "Subscribe free at https://rapidapi.com/aedbx-aedbx/api/aerodatabox");
    }
    return key;
}
// ── shared headers ────────────────────────────────────────────────
function headers() {
    return {
        "x-rapidapi-host": constants_js_1.AERODATABOX_HOST,
        "x-rapidapi-key": getApiKey(),
    };
}
// ── helpers ───────────────────────────────────────────────────────
/**
 * Build a local datetime string for AeroDataBox.
 * Format expected: "YYYY-MM-DDTHH:mm"  (no TZ suffix — it uses airport local time)
 */
function buildWindow(dateStr, offsetHours = 0, windowHours = 12) {
    // If a date is given use midnight→midnight of that day
    if (dateStr) {
        return {
            from: `${dateStr}T00:00`,
            to: `${dateStr}T23:59`,
        };
    }
    // Otherwise use a window around now
    const base = new Date();
    base.setHours(base.getHours() + offsetHours);
    const from = new Date(base);
    const to = new Date(base);
    to.setHours(to.getHours() + windowHours);
    const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    return { from: fmt(from), to: fmt(to) };
}
function pad(n) { return String(n).padStart(2, "0"); }
// ── FIDS (arrivals / departures board) ───────────────────────────
async function fetchFids(icao, from, to, direction, airlineIata) {
    const url = `${constants_js_1.AERODATABOX_BASE}/flights/airports/icao/${icao}/${from}/${to}`;
    try {
        const resp = await axios_1.default.get(url, {
            headers: headers(),
            params: {
                direction,
                withLeg: true,
                withCancelled: true,
                withCodeshared: false,
                withLocation: false,
            },
            timeout: constants_js_1.REQUEST_TIMEOUT_MS,
        });
        const flights = direction === "Arrival"
            ? (resp.data.arrivals ?? [])
            : (resp.data.departures ?? []);
        if (airlineIata) {
            return flights.filter((f) => f.airline?.iata?.toUpperCase() === airlineIata.toUpperCase());
        }
        return flights;
    }
    catch (err) {
        throw handleAxiosError(err);
    }
}
// ── Single flight status ─────────────────────────────────────────
async function fetchFlightStatus(flightIata, dateStr) {
    const date = dateStr ?? new Date().toISOString().slice(0, 10);
    const url = `${constants_js_1.AERODATABOX_BASE}/flights/number/${flightIata}/${date}`;
    try {
        const resp = await axios_1.default.get(url, {
            headers: headers(),
            params: { withLocation: true, dateLocalRole: "Both" },
            timeout: constants_js_1.REQUEST_TIMEOUT_MS,
        });
        return Array.isArray(resp.data) ? resp.data : [resp.data];
    }
    catch (err) {
        throw handleAxiosError(err);
    }
}
// ── Error handling ────────────────────────────────────────────────
function handleAxiosError(err) {
    if (err instanceof axios_1.AxiosError) {
        const status = err.response?.status;
        const data = err.response?.data;
        if (status === 401 || status === 403) {
            return new Error("Invalid or missing RAPIDAPI_KEY. " +
                "Subscribe at https://rapidapi.com/aedbx-aedbx/api/aerodatabox");
        }
        if (status === 429) {
            return new Error("Rate limit exceeded. Free plan: 500 calls/month. " +
                "Upgrade at RapidAPI if needed.");
        }
        if (status === 404) {
            return new Error("No data found for the requested flight/airport/date.");
        }
        return new Error(`AeroDataBox API error (HTTP ${status ?? "unknown"}): ${data?.message ?? err.message}`);
    }
    return err instanceof Error ? err : new Error(String(err));
}
// ── Normalisation ─────────────────────────────────────────────────
function normaliseFlight(f) {
    const dep = f.departure;
    const arr = f.arrival;
    return {
        flight_iata: f.number ?? null,
        airline: f.airline?.name ?? null,
        status: f.status ?? null,
        origin_iata: dep?.airport?.iata ?? null,
        origin_name: dep?.airport?.name ?? null,
        destination_iata: arr?.airport?.iata ?? null,
        destination_name: arr?.airport?.name ?? null,
        scheduled_departure: dep?.scheduledTime?.local ?? null,
        actual_departure: dep?.actualTime?.local ?? null,
        estimated_departure: dep?.estimatedTime?.local ?? null,
        scheduled_arrival: arr?.scheduledTime?.local ?? null,
        actual_arrival: arr?.actualTime?.local ?? null,
        estimated_arrival: arr?.estimatedTime?.local ?? null,
        departure_terminal: dep?.terminal ?? null,
        departure_gate: dep?.gate ?? null,
        arrival_terminal: arr?.terminal ?? null,
        arrival_gate: arr?.gate ?? null,
        departure_delay_min: dep?.delay ?? null,
        arrival_delay_min: arr?.delay ?? null,
        aircraft_model: f.aircraft?.model ?? null,
        aircraft_reg: f.aircraft?.reg ?? null,
    };
}
// ── Markdown formatter ────────────────────────────────────────────
function formatFlightMarkdown(s) {
    const dep = s.actual_departure ?? s.estimated_departure ?? s.scheduled_departure ?? "—";
    const arr = s.actual_arrival ?? s.estimated_arrival ?? s.scheduled_arrival ?? "—";
    const delayTag = s.arrival_delay_min != null && s.arrival_delay_min > 0
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
//# sourceMappingURL=aerodatabox.js.map