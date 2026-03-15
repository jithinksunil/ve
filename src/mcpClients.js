import { logger } from "./logger.js";

class HttpMCPClient {
  constructor(baseUrl, apiKey, clientName) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.clientName = clientName;
  }

  async call(method, args) {
    if (!this.baseUrl) {
      throw new Error(`MCP base URL not configured for ${this.clientName}.${method}`);
    }

    const url = `${this.baseUrl.replace(/\/$/, "")}/${method}`;
    const start = Date.now();

    logger.info("mcp_call_started", {
      client: this.clientName,
      method
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify(args ?? {})
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn("mcp_call_failed", {
        client: this.clientName,
        method,
        status: response.status,
        durationMs: Date.now() - start
      });
      throw new Error(`MCP call failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    logger.info("mcp_call_completed", {
      client: this.clientName,
      method,
      status: response.status,
      durationMs: Date.now() - start
    });

    return data;
  }
}

function fromEnv(name) {
  return new HttpMCPClient(
    process.env[`${name}_URL`],
    process.env[`${name}_KEY`] || "",
    name
  );
}

export function createMCPClients() {
  const clients = {
    market_data: fromEnv("MARKET_DATA_MCP"),
    financials: fromEnv("FINANCIALS_MCP"),
    analyst: fromEnv("ANALYST_MCP"),
    ownership: fromEnv("OWNERSHIP_MCP"),
    news: fromEnv("NEWS_MCP"),
    regulatory: fromEnv("REGULATORY_MCP"),
    calendar: fromEnv("CALENDAR_MCP"),
    esg: fromEnv("ESG_MCP")
  };

  logger.info("mcp_clients_initialized", {
    configuredClients: Object.keys(clients)
  });

  return clients;
}
