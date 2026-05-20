# jfk-mcp-server

A Model Context Protocol (MCP) server that exposes real-time JFK airport data to Claude and any MCP-compatible AI client.

## Tools

| Tool | Description |
|---|---|
| `jfk_get_arrivals` | Live + scheduled arrivals at JFK with filters for date, airline, status |
| `jfk_get_departures` | Live + scheduled departures from JFK with same filters |
| `jfk_get_flight_status` | Full status for a specific flight by IATA number (AA100, DL405, …) |

## Data source

[AviationStack API](https://aviationstack.com/) — free tier: 100 requests/month. Paid tiers remove the request cap and unlock real-time HTTPS.

## Quick start

```bash
# 1. Install
npm install

# 2. Set your API key
export AVIATIONSTACK_API_KEY=your_key_here

# 3. Run locally (HTTP)
npm run build && npm start

# 4. Test
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AVIATIONSTACK_API_KEY` | ✅ Yes | — | Get free key at aviationstack.com/signup/free |
| `PORT` | No | `3000` | HTTP port (Cloud Run injects `8080`) |
| `TRANSPORT` | No | `http` | Set to `stdio` for local subprocess mode |

## Deployment on NEXUS (GCP Cloud Run)

```bash
# Build & push via NEXUS MCP tools, then connect the /mcp endpoint in Claude.ai
# URL format:  https://<your-service>.run.app/mcp
```

## Connect to Claude.ai

1. Go to **Claude.ai → Settings → Integrations → Add MCP Server**
2. Enter your deployed URL: `https://jfk-mcp-server-<hash>.run.app/mcp`
3. Claude will discover the three JFK tools automatically.
