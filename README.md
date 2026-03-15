# Investment Report Section API (Node.js + Express)

## Setup

```bash
npm install
export OPENAI_API_KEY=...
npm start
```

## Required MCP environment variables

Set these to your MCP server base URLs (and optional `_KEY` values):

- `MARKET_DATA_MCP_URL`
- `FINANCIALS_MCP_URL`
- `ANALYST_MCP_URL`
- `OWNERSHIP_MCP_URL`
- `NEWS_MCP_URL`
- `REGULATORY_MCP_URL`
- `CALENDAR_MCP_URL`
- `ESG_MCP_URL`

## Endpoints

- `GET /health`
- `GET /api/report/full`

Dedicated static per-section GET endpoints:

- `GET /api/sections/companyOverview`
- `GET /api/sections/shareholderStructure`
- `GET /api/sections/analystRecommendations`
- `GET /api/sections/dcfValuation`
- `GET /api/sections/financialStatements`
- `GET /api/sections/businessSegments`
- `GET /api/sections/recentResults`
- `GET /api/sections/regulatoryRisks`
- `GET /api/sections/newsCatalysts`
- `GET /api/sections/shareholderCommunications`
- `GET /api/sections/forwardProjections`
- `GET /api/sections/valuationSummary`
- `GET /api/sections/agm`

> Note: No path params are required for section selection; each section has its own static route.

## Query parameters

Use query params on each GET endpoint:

- `ticker` (required)
- `exchange` (optional)
- `fiscalYear` (optional)
- `model` (optional)
- `maxIterations` (optional)
- `context` (optional JSON string, URL encoded)
- `concurrency` (optional, only for `/api/report/full`)

### Examples

```bash
curl "http://localhost:3000/api/sections/dcfValuation?ticker=AJB&exchange=LSE&fiscalYear=FY25"
```

```bash
curl "http://localhost:3000/api/report/full?ticker=AJB&exchange=LSE&concurrency=3"
```

## Logging & Monitoring

The service writes structured JSON logs to stdout/stderr for easy ingestion in monitoring systems:

- HTTP request lifecycle (`request_started`, `request_completed`)
- Section orchestration progress (`section_fetch_started`, `section_fetch_iteration`, `section_fetch_completed`)
- Tool execution metrics (`tool_call_started`, `tool_call_completed`, `tool_call_failed`)
- MCP call metrics (`mcp_call_started`, `mcp_call_completed`, `mcp_call_failed`)
- Process-level failures (`process_unhandled_rejection`, `process_uncaught_exception`)

Each request is tagged with `requestId` for correlation across API, section, and tool logs.
