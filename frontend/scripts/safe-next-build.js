/* eslint-disable @typescript-eslint/no-require-imports */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const MAX_ATTEMPTS = 2;

function isTransientBuildError(output) {
  const text = output.toLowerCase();
  return (
    text.includes("unable to acquire lock") ||
    text.includes(".next\\lock") ||
    text.includes(".next/lock") ||
    (text.includes("enoent") && text.includes("pages-manifest.json"))
  );
}

function cleanNextArtifacts() {
  const nextDir = path.join(process.cwd(), ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[safe-build] Limpou .next para nova tentativa.");
  }
}

function runBuildAttempt(attempt) {
  return new Promise((resolve) => {
    const nextBin = require.resolve("next/dist/bin/next");
    const child = spawn(process.execPath, [nextBin, "build", "--webpack"], {
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "pipe"],
      env: process.env,
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, output, attempt });
    });
  });
}

(async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      console.log(`[safe-build] Tentativa ${attempt}/${MAX_ATTEMPTS}...`);
    }

    const result = await runBuildAttempt(attempt);

    if (result.code === 0) {
      process.exit(0);
    }

    const shouldRetry = attempt < MAX_ATTEMPTS && isTransientBuildError(result.output);
    if (!shouldRetry) {
      process.exit(result.code);
    }

    console.warn("[safe-build] Falha transitória detectada (lock/ENOENT). Repetindo build limpo.");
    cleanNextArtifacts();
  }

  process.exit(1);
})();
