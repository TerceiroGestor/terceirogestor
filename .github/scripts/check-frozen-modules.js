#!/usr/bin/env node

const { execSync } = require('child_process');

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function normalizePath(filePath) {
  return String(filePath || '').trim().replace(/\\/g, '/');
}

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

const baseShaArg = readArg('--base');
const headShaArg = readArg('--head');
const headSha = headShaArg || process.env.GITHUB_SHA || 'HEAD';
const baseSha = baseShaArg && !/^0+$/.test(baseShaArg) ? baseShaArg : `${headSha}^`;

const frozenPrefixes = [
  'backend/src/modules/actions/',
  'backend/src/modules/dashboard/',
  'backend/src/modules/deposit/',
  'backend/src/modules/pantry/',
  'backend/src/modules/people-groups/',
  'backend/src/modules/people-segments/',
  'backend/src/modules/programs/',
  'backend/src/modules/project-structure/',
  'backend/src/modules/projects/',
  'backend/src/modules/tasks/',
  'frontend/src/modules/actions/',
  'frontend/src/modules/deposit/',
  'frontend/src/modules/onboarding/',
  'frontend/src/modules/pantry/',
  'frontend/src/modules/people-groups/',
  'frontend/src/modules/people-segments/',
  'frontend/src/modules/programs/',
  'frontend/src/modules/projects/',
  'frontend/src/modules/tasks/',
];

let diffOutput = '';
try {
  diffOutput = run(`git diff --name-only ${baseSha} ${headSha}`);
} catch (error) {
  console.error('Falha ao coletar diff para o gate de congelamento.');
  console.error(String(error.message || error));
  process.exit(2);
}

if (!diffOutput) {
  console.log('Nenhuma alteracao detectada no diff. Gate de congelamento aprovado.');
  process.exit(0);
}

const changedFiles = diffOutput
  .split(/\r?\n/)
  .map(normalizePath)
  .filter(Boolean);

const frozenChanges = changedFiles.filter((filePath) =>
  frozenPrefixes.some((prefix) => filePath.startsWith(prefix)),
);

if (!frozenChanges.length) {
  console.log('Sem alteracoes em modulos congelados. Gate de congelamento aprovado.');
  process.exit(0);
}

console.error('Gate de congelamento reprovado: alteracoes em modulos congelados detectadas.');
console.error('Arquivos bloqueados:');
for (const filePath of frozenChanges) {
  console.error(`- ${filePath}`);
}
console.error('Para excecao, registrar decisao arquitetural explicita antes do merge.');
process.exit(1);
