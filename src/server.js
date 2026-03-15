import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { fetchFullReport, fetchReportSection } from "./fetchReportSection.js";
import { SECTION_KEYS } from "./schemas.js";
import { createMCPClients } from "./mcpClients.js";
import { logger } from "./logger.js";

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mcpClients = createMCPClients();

function parseContext(value) {
  if (!value) return undefined;
  if (typeof value === "object") return value;
  if (typeof value !== "string") {
    throw new Error("context must be a JSON string or object");
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("context must be valid JSON");
  }
}

function parseOptions(input = {}) {
  const ticker = input.ticker;
  if (!ticker || typeof ticker !== "string") {
    throw new Error("ticker is required and must be a string");
  }

  const maxIterations =
    input.maxIterations !== undefined ? Number(input.maxIterations) : undefined;

  if (
    maxIterations !== undefined &&
    (!Number.isFinite(maxIterations) || maxIterations <= 0)
  ) {
    throw new Error("maxIterations must be a positive number");
  }

  return {
    ticker,
    exchange:
      typeof input.exchange === "string" && input.exchange.length > 0
        ? input.exchange
        : undefined,
    fiscalYear:
      typeof input.fiscalYear === "string" && input.fiscalYear.length > 0
        ? input.fiscalYear
        : undefined,
    context: parseContext(input.context),
    model:
      typeof input.model === "string" && input.model.length > 0
        ? input.model
        : undefined,
    maxIterations
  };
}

function getRequestOptions(req) {
  const source = req.method === "GET" ? req.query : req.body;
  return parseOptions(source);
}

app.use((req, res, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  const start = Date.now();

  logger.info("request_started", {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query
  });

  res.on("finish", () => {
    logger.info("request_completed", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, sections: SECTION_KEYS.length });
});

for (const section of SECTION_KEYS) {
  app.get(`/api/sections/${section}`, async (req, res) => {
    try {
      const options = getRequestOptions(req);
      const data = await fetchReportSection(section, options, openai, mcpClients, {
        requestId: req.requestId
      });
      res.json(data);
    } catch (error) {
      logger.error("section_request_failed", error, {
        requestId: req.requestId,
        section
      });
      res.status(400).json({ error: String(error) });
    }
  });
}

app.get("/api/report/full", async (req, res) => {
  try {
    const options = getRequestOptions(req);
    const concurrency = Number(req.query?.concurrency ?? 3);
    const data = await fetchFullReport(options, openai, mcpClients, concurrency, {
      requestId: req.requestId
    });
    res.json(data);
  } catch (error) {
    logger.error("full_report_request_failed", error, {
      requestId: req.requestId
    });
    res.status(400).json({ error: String(error) });
  }
});

app.use((error, req, res, _next) => {
  logger.error("unhandled_route_error", error, {
    requestId: req.requestId,
    path: req.path
  });
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  logger.info("server_started", {
    port,
    sectionCount: SECTION_KEYS.length,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("process_unhandled_rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("process_uncaught_exception", error);
});
