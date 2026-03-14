import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { fetchFullReport, fetchReportSection } from "./fetchReportSection.js";
import { SECTION_KEYS } from "./schemas.js";
import { createMCPClients } from "./mcpClients.js";

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const mcpClients = createMCPClients();

function parseOptions(body = {}) {
  const { ticker, exchange, fiscalYear, context, model, maxIterations } = body;
  if (!ticker || typeof ticker !== "string") {
    throw new Error("ticker is required and must be a string");
  }
  return { ticker, exchange, fiscalYear, context, model, maxIterations };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, sections: SECTION_KEYS.length });
});

for (const section of SECTION_KEYS) {
  app.post(`/api/sections/${section}`, async (req, res) => {
    try {
      const options = parseOptions(req.body);
      const data = await fetchReportSection(section, options, openai, mcpClients);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });
}

app.post("/api/sections/:section", async (req, res) => {
  try {
    const { section } = req.params;
    if (!SECTION_KEYS.includes(section)) {
      return res.status(404).json({ error: `Unknown section: ${section}` });
    }
    const options = parseOptions(req.body);
    const data = await fetchReportSection(section, options, openai, mcpClients);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ error: String(error) });
  }
});

app.post("/api/report/full", async (req, res) => {
  try {
    const options = parseOptions(req.body);
    const concurrency = Number(req.body?.concurrency ?? 3);
    const data = await fetchFullReport(options, openai, mcpClients, concurrency);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Investment report API listening on port ${port}`);
});
