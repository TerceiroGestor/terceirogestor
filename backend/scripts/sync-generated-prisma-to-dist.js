const fs = require('fs');
const path = require('path');

function pathExists(targetPath) {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'generated', 'prisma');
const distDir = path.join(root, 'dist');
const targetDir = path.join(distDir, 'generated', 'prisma');

if (!pathExists(sourceDir)) {
  if (pathExists(targetDir)) {
    // eslint-disable-next-line no-console
    console.log(
      `[sync-prisma] Source not found (${sourceDir}), but target already exists (${targetDir}). Skipping.`,
    );
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.error(`[sync-prisma] Source not found: ${sourceDir}.`);
  // eslint-disable-next-line no-console
  console.error(
    `[sync-prisma] Run "prisma generate" (or "npm run build") to create it.`,
  );
  process.exit(1);
}

if (!pathExists(distDir)) {
  // eslint-disable-next-line no-console
  console.error(
    `[sync-prisma] Dist folder not found: ${distDir}. Run "npm run build" first.`,
  );
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

// eslint-disable-next-line no-console
console.log(`[sync-prisma] Synced ${sourceDir} -> ${targetDir}`);
