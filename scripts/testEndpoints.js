import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { SECTION_KEYS, SECTION_SCHEMAS } from "../src/schemas.js";

const PORT = Number(process.env.TEST_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const QUERY = "ticker=AJB&exchange=LSE&fiscalYear=FY25";

function startServer() {
  const child = spawn(process.execPath, ["src/server.js"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      MOCK_REPORT_DATA: "1",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "sk-test"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[server] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[server-err] ${chunk}`);
  });

  return child;
}

async function waitForHealth(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      // ignore until server is ready
    }
    await delay(200);
  }
  throw new Error("Server did not become ready in time");
}

async function assertJson(path, expectedStatus) {
  const res = await fetch(`${BASE_URL}${path}`);
  const body = await res.json();
  if (res.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus} for ${path}, got ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function run() {
  const child = startServer();
  let exitCode = 0;

  try {
    await waitForHealth();

    const health = await assertJson("/health", 200);
    if (!health.ok) throw new Error("Health response missing ok=true");
    console.log("PASS /health output validated");

    for (const section of SECTION_KEYS) {
      const body = await assertJson(`/api/sections/${section}?${QUERY}`, 200);
      SECTION_SCHEMAS[section].parse(body);
      console.log(`PASS /api/sections/${section} output validated`);
    }

    const full = await assertJson(`/api/report/full?${QUERY}&concurrency=3`, 200);
    for (const section of SECTION_KEYS) {
      if (!(section in full)) {
        throw new Error(`Missing section in full report response: ${section}`);
      }
      SECTION_SCHEMAS[section].parse(full[section]);
    }
    console.log("PASS /api/report/full output validated");

    console.log(`PASS tested ${SECTION_KEYS.length + 2} endpoints with schema-validated outputs`);
  } catch (error) {
    exitCode = 1;
    console.error(`FAIL ${String(error)}`);
  } finally {
    child.kill("SIGTERM");
  }

  process.exit(exitCode);
}

run();
