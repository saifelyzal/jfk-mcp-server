// ── index.ts ──────────────────────────────────────────────────────
// JFK MCP Server — arrivals, departures, flight status
// Transport: Streamable HTTP (remote) or stdio (local)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";

import { registerArrivalsTools } from "./tools/arrivals.js";
import { registerDeparturesTools } from "./tools/departures.js";
import { registerFlightStatusTools } from "./tools/flight-status.js";

// ── server ────────────────────────────────────────────────────────
const server = new McpServer({
  name: "jfk-mcp-server",
  version: "1.0.0",
});

registerArrivalsTools(server);
registerDeparturesTools(server);
registerFlightStatusTools(server);

// ── transports ────────────────────────────────────────────────────
async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  // Health check — used by NEXUS / GCP load balancers
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "jfk-mcp-server", version: "1.0.0" });
  });

  // Stateless MCP endpoint — new transport per request (required for GCP Cloud Run)
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT ?? "3000", 10);
  app.listen(port, () => {
    console.error(
      `[jfk-mcp-server] HTTP transport running on http://0.0.0.0:${port}/mcp`
    );
  });
}

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
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
} else {
  runStdio().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
