const fs = require("fs");
const path = require("path");

function getRootEnvPaths() {
  return [
    path.resolve(__dirname, "..", "..", ".env.local"),
    path.resolve(__dirname, "..", "..", ".env"),
  ];
}

function parseAndApplyEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;

  const content = fs.readFileSync(filepath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadRootEnv() {
  for (const filepath of getRootEnvPaths()) {
    parseAndApplyEnvFile(filepath);
  }
}

function readEnvFileValue(key) {
  for (const filepath of getRootEnvPaths()) {
    if (!fs.existsSync(filepath)) continue;

    const content = fs.readFileSync(filepath, "utf8");
    const line = content
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry && !entry.startsWith("#") && entry.startsWith(`${key}=`));

    if (!line) continue;

    let value = line.slice(key.length + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    return value;
  }

  return null;
}

module.exports = {
  loadRootEnv,
  readEnvFileValue,
};
