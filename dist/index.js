"use strict";
// ── index.ts ──────────────────────────────────────────────────────
// JFK MCP Server — arrivals, departures, flight status
// Transport: Streamable HTTP (remote) or stdio (local)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const express_1 = __importDefault(require("express"));
const arrivals_js_1 = require("./tools/arrivals.js");
const departures_js_1 = require("./tools/departures.js");
const flight_status_js_1 = require("./tools/flight-status.js");
// ── server ────────────────────────────────────────────────────────
const server = new mcp_js_1.McpServer({
    name: "jfk-mcp-server",
    version: "1.0.0",
});
(0, arrivals_js_1.registerArrivalsTools)(server);
(0, departures_js_1.registerDeparturesTools)(server);
(0, flight_status_js_1.registerFlightStatusTools)(server);
// ── transports ────────────────────────────────────────────────────
async function runHTTP() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Health check — used by NEXUS / GCP load balancers
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", server: "jfk-mcp-server", version: "1.0.0" });
    });
    // Stateless MCP endpoint — new transport per request (required for GCP Cloud Run)
    app.post("/mcp", async (req, res) => {
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // stateless
            enableJsonResponse: true,
        });
        res.on("close", () => transport.close());
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    const port = parseInt(process.env.PORT ?? "3000", 10);
    app.listen(port, () => {
        console.error(`[jfk-mcp-server] HTTP transport running on http://0.0.0.0:${port}/mcp`);
    });
}
async function runStdio() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("[jfk-mcp-server] stdio transport ready");
}
// ── entry ─────────────────────────────────────────────────────────
const transport = process.env.TRANSPORT ?? "http";
if (transport === "http") {
    runHTTP().catch((err) => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}
else {
    runStdio().catch((err) => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map