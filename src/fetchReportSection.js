import { zodToJsonSchema } from "zod-to-json-schema";
import { SECTION_SCHEMAS } from "./schemas.js";
import { logger } from "./logger.js";
import { generateMockSectionData } from "./mockData.js";

export const MCP_TOOLS_BY_SECTION = {
  companyOverview: [
    "market_data__get_quote",
    "market_data__get_52wk_range",
    "market_data__get_market_cap",
    "financials__get_key_ratios",
    "analyst__get_consensus_price_target"
  ],
  shareholderStructure: [
    "ownership__get_institutional_holders",
    "ownership__get_insider_transactions",
    "market_data__get_shares_outstanding"
  ],
  analystRecommendations: [
    "analyst__get_ratings",
    "analyst__get_price_targets",
    "analyst__get_consensus_summary"
  ],
  dcfValuation: [
    "financials__get_income_statement",
    "financials__get_cash_flow",
    "market_data__get_beta",
    "financials__get_balance_sheet"
  ],
  financialStatements: [
    "financials__get_income_statement",
    "financials__get_balance_sheet",
    "financials__get_cash_flow",
    "financials__get_key_ratios"
  ],
  businessSegments: ["financials__get_segment_revenue", "market_data__get_competitors", "news__get_company_news"],
  recentResults: ["financials__get_income_statement", "financials__get_cash_flow", "analyst__get_estimates", "news__get_earnings_news"],
  regulatoryRisks: ["regulatory__get_fca_filings", "regulatory__get_regulatory_notices", "news__get_regulatory_news"],
  newsCatalysts: ["news__get_company_news", "news__get_industry_news", "news__search_news"],
  shareholderCommunications: ["news__get_press_releases", "ownership__get_insider_transactions", "calendar__get_earnings_dates"],
  forwardProjections: ["analyst__get_estimates", "financials__get_income_statement", "financials__get_cash_flow"],
  valuationSummary: ["analyst__get_consensus_price_target", "analyst__get_ratings", "market_data__get_quote", "financials__get_key_ratios"],
  agm: ["calendar__get_agm_date", "calendar__get_dividend_dates", "regulatory__get_corporate_filings", "news__get_press_releases"]
};

export const SYSTEM_PROMPTS = Object.fromEntries(
  Object.keys(SECTION_SCHEMAS).map((k) => [k, `You are an equity research analyst generating the ${k} section. Use tools and output strict JSON matching schema.`])
);

const TOOL_SPEC = {
  market_data: ["get_quote", "get_52wk_range", "get_market_cap", "get_beta", "get_competitors", "get_shares_outstanding"],
  financials: ["get_income_statement", "get_balance_sheet", "get_cash_flow", "get_key_ratios", "get_segment_revenue"],
  analyst: ["get_ratings", "get_price_targets", "get_consensus_price_target", "get_consensus_summary", "get_estimates"],
  ownership: ["get_institutional_holders", "get_insider_transactions"],
  news: ["get_company_news", "get_industry_news", "search_news", "get_earnings_news", "get_press_releases", "get_regulatory_news"],
  regulatory: ["get_fca_filings", "get_regulatory_notices", "get_corporate_filings"],
  calendar: ["get_agm_date", "get_dividend_dates", "get_earnings_dates"]
};

export function buildMCPToolRegistry(mcpClients) {
  const registry = {};
  for (const [namespace, methods] of Object.entries(TOOL_SPEC)) {
    for (const method of methods) {
      const toolName = `${namespace}__${method}`;
      registry[toolName] = {
        definition: {
          type: "function",
          function: {
            name: toolName,
            description: `MCP tool ${toolName}`,
            parameters: {
              type: "object",
              properties: {
                ticker: { type: "string" },
                exchange: { type: "string" },
                fiscalYear: { type: "string" },
                limit: { type: "number" },
                lookbackDays: { type: "number" },
                years: { type: "number" },
                period: { type: "string" },
                query: { type: "string" },
                industry: { type: "string" },
                companyName: { type: "string" }
              }
            }
          }
        },
        execute: (args) => mcpClients[namespace]?.call(method, args)
      };
    }
  }
  return registry;
}

export async function fetchReportSection(section, options, openai, mcpClients, monitoring = {}) {
  const { ticker, exchange = "", fiscalYear = "", context = {}, model = "gpt-4o", maxIterations = 10 } = options;
  const { requestId } = monitoring;
  const schema = SECTION_SCHEMAS[section];
  if (!schema) throw new Error(`Unsupported section: ${section}`);

  logger.info("section_fetch_started", {
    requestId,
    section,
    ticker,
    exchange,
    fiscalYear,
    model,
    maxIterations
  });

  if (process.env.MOCK_REPORT_DATA === "1") {
    const mocked = generateMockSectionData(section, { ticker, exchange, fiscalYear, context });
    logger.info("section_fetch_completed_mock", {
      requestId,
      section
    });
    return mocked;
  }

  const jsonSchema = zodToJsonSchema(schema, { name: "output", $refStrategy: "none" });
  const registry = buildMCPToolRegistry(mcpClients);
  const toolsForSection = (MCP_TOOLS_BY_SECTION[section] || []).filter((name) => registry[name]);

  const messages = [
    { role: "system", content: SYSTEM_PROMPTS[section] },
    {
      role: "user",
      content: [
        `Section: ${section}`,
        `ticker=${ticker}`,
        exchange ? `exchange=${exchange}` : "",
        fiscalYear ? `fiscalYear=${fiscalYear}` : "",
        Object.keys(context).length ? `context=${JSON.stringify(context)}` : "",
        "Return only JSON matching this schema:",
        JSON.stringify(jsonSchema)
      ].filter(Boolean).join("\n")
    }
  ];

  const toolExecutors = Object.fromEntries(toolsForSection.map((n) => [n, registry[n].execute]));

  let iterations = 0;
  while (iterations < maxIterations) {
    iterations += 1;
    logger.info("section_fetch_iteration", {
      requestId,
      section,
      iteration: iterations,
      toolCount: toolsForSection.length
    });

    const response = await openai.chat.completions.create({
      model,
      messages,
      tools: toolsForSection.length ? toolsForSection.map((n) => registry[n].definition) : undefined,
      tool_choice: toolsForSection.length ? "auto" : undefined,
      temperature: 0.1
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      const raw = (assistantMessage.content || "").replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(raw);
      const validated = schema.parse(parsed);
      logger.info("section_fetch_completed", {
        requestId,
        section,
        iterations
      });
      return validated;
    }

    const results = await Promise.all(
      assistantMessage.tool_calls.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const fn = toolExecutors[toolCall.function.name];
        const toolStart = Date.now();

        logger.info("tool_call_started", {
          requestId,
          section,
          toolName: toolCall.function.name
        });

        let content;
        try {
          content = JSON.stringify(fn ? await fn(args) : { error: `Unknown tool: ${toolCall.function.name}` });
          logger.info("tool_call_completed", {
            requestId,
            section,
            toolName: toolCall.function.name,
            durationMs: Date.now() - toolStart
          });
        } catch (error) {
          logger.error("tool_call_failed", error, {
            requestId,
            section,
            toolName: toolCall.function.name,
            durationMs: Date.now() - toolStart
          });
          content = JSON.stringify({ error: String(error) });
        }

        return { role: "tool", tool_call_id: toolCall.id, content };
      })
    );

    messages.push(...results);
  }

  logger.warn("section_fetch_max_iterations_exceeded", {
    requestId,
    section,
    maxIterations
  });
  throw new Error(`Exceeded max iterations (${maxIterations}) for section ${section}`);
}

export async function fetchFullReport(options, openai, mcpClients, concurrency = 3, monitoring = {}) {
  const sections = Object.keys(SECTION_SCHEMAS);
  const output = {};
  const { requestId } = monitoring;
  const start = Date.now();

  logger.info("full_report_fetch_started", {
    requestId,
    sectionCount: sections.length,
    concurrency
  });

  for (let i = 0; i < sections.length; i += concurrency) {
    const batch = sections.slice(i, i + concurrency);
    const data = await Promise.all(
      batch.map(async (section) => [section, await fetchReportSection(section, options, openai, mcpClients, monitoring)])
    );
    for (const [section, payload] of data) output[section] = payload;
    logger.info("full_report_batch_completed", {
      requestId,
      batch,
      progress: `${Math.min(i + concurrency, sections.length)}/${sections.length}`
    });
  }

  logger.info("full_report_fetch_completed", {
    requestId,
    durationMs: Date.now() - start,
    sectionCount: sections.length
  });
  return output;
}
