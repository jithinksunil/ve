import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { SECTION_KEYS } from "../src/schemas.js";

const PORT = Number(process.env.TEST_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function startServer() {
  const child = spawn(process.execPath, ["src/server.js"], {
    env: {
      ...process.env,
      PORT: String(PORT),
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

async function assertStatus(path, expectedStatus) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (res.status !== expectedStatus) {
    const body = await res.text();
    throw new Error(`Expected ${expectedStatus} for ${path}, got ${res.status}: ${body}`);
  }
  console.log(`PASS ${path} -> ${res.status}`);
}

async function run() {
  const child = startServer();
  let exitCode = 0;

  try {
    await waitForHealth();

    await assertStatus("/health", 200);
    await assertStatus("/api/report/full", 400);

    for (const section of SECTION_KEYS) {
      await assertStatus(`/api/sections/${section}`, 400);
    }

    console.log(`PASS tested ${SECTION_KEYS.length + 2} endpoints`);
  } catch (error) {
    exitCode = 1;
    console.error(`FAIL ${String(error)}`);
  } finally {
    child.kill("SIGTERM");
  }

  process.exit(exitCode);
}

run();
