class HttpMCPClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async call(method, args) {
    if (!this.baseUrl) {
      throw new Error(`MCP base URL not configured for method: ${method}`);
    }

    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify(args ?? {})
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`MCP call failed (${response.status}): ${body}`);
    }

    return response.json();
  }
}

function fromEnv(name) {
  return new HttpMCPClient(process.env[`${name}_URL`], process.env[`${name}_KEY`] || "");
}

export function createMCPClients() {
  return {
    market_data: fromEnv("MARKET_DATA_MCP"),
    financials: fromEnv("FINANCIALS_MCP"),
    analyst: fromEnv("ANALYST_MCP"),
    ownership: fromEnv("OWNERSHIP_MCP"),
    news: fromEnv("NEWS_MCP"),
    regulatory: fromEnv("REGULATORY_MCP"),
    calendar: fromEnv("CALENDAR_MCP"),
    esg: fromEnv("ESG_MCP")
  };
}
