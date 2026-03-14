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
- `POST /api/sections/:section`
- `POST /api/report/full`

Dedicated per-section endpoints are also available:

- `POST /api/sections/companyOverview`
- `POST /api/sections/shareholderStructure`
- `POST /api/sections/analystRecommendations`
- `POST /api/sections/dcfValuation`
- `POST /api/sections/financialStatements`
- `POST /api/sections/businessSegments`
- `POST /api/sections/recentResults`
- `POST /api/sections/regulatoryRisks`
- `POST /api/sections/newsCatalysts`
- `POST /api/sections/shareholderCommunications`
- `POST /api/sections/forwardProjections`
- `POST /api/sections/valuationSummary`
- `POST /api/sections/agm`

## Request body

```json
{
  "ticker": "AJB",
  "exchange": "LSE",
  "fiscalYear": "FY25",
  "context": { "industry": "wealth management" },
  "model": "gpt-4o",
  "maxIterations": 10
}
```
