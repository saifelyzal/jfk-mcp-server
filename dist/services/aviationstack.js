"use strict";
// ── services/aviationstack.ts ─────────────────────────────────────
// Thin wrapper around the AviationStack REST API.
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
exports.fetchFlights = fetchFlights;
exports.normaliseFlight = normaliseFlight;
exports.formatFlightMarkdown = formatFlightMarkdown;
const axios_1 = __importStar(require("axios"));
const constants_js_1 = require("../constants.js");
// ── env ──────────────────────────────────────────────────────────
function getApiKey() {
    const key = process.env.AVIATIONSTACK_API_KEY;
    if (!key) {
        throw new Error("AVIATIONSTACK_API_KEY environment variable is not set. " +
            "Get a free key at https://aviationstack.com/signup/free");
    }
    return key;
}
async function fetchFlights(endpoint, params) {
    const apiKey = getApiKey();
    try {
        const response = await axios_1.default.get(`${constants_js_1.AVIATIONSTACK_BASE}/${endpoint}`, {
            params: { access_key: apiKey, ...params },
            timeout: constants_js_1.REQUEST_TIMEOUT_MS,
        });
        return response.data;
    }
    catch (err) {
        if (err instanceof axios_1.AxiosError) {
            const status = err.response?.status;
            const msg = err.response?.data
                ?.error?.message;
            if (status === 401) {
                throw new Error("Invalid API key. Verify AVIATIONSTACK_API_KEY is correct.");
            }
            if (status === 429) {
                throw new Error("Rate limit exceeded. Free tier allows 100 requests/month. Consider upgrading at aviationstack.com.");
            }
            throw new Error(`AviationStack API error (HTTP ${status ?? "unknown"}): ${msg ?? err.message}`);
        }
        throw err;
    }
}
// ── normalisation ────────────────────────────────────────────────
function normaliseFlight(f) {
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
function formatFlightMarkdown(s) {
    const dep = s.actual_departure ?? s.estimated_departure ?? s.scheduled_departure ?? "—";
    const arr = s.actual_arrival ?? s.estimated_arrival ?? s.scheduled_arrival ?? "—";
    const delay = s.arrival_delay_min != null && s.arrival_delay_min > 0
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
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
//# sourceMappingURL=aviationstack.js.map