const fs = require('fs');
const path = require('path');

// Loads the canonical permission/role catalog (src/modules/permissions/
// core-permissions.ts) from a script context, where there is no ts-node
// project wired up by default. Prefers the compiled dist output (what a
// deployed container has); falls back to transpiling the .ts source
// on-the-fly for local use before the first build.
function loadCorePermissionsModule() {
  const distCandidates = [
    path.join(
      __dirname,
      '..',
      'dist',
      'modules',
      'permissions',
      'core-permissions.js',
    ),
    path.join(
      __dirname,
      '..',
      'dist',
      'src',
      'modules',
      'permissions',
      'core-permissions.js',
    ),
  ];

  for (const candidate of distCandidates) {
    if (fs.existsSync(candidate)) {
      return require(candidate);
    }
  }

  try {
    require('ts-node/register/transpile-only');
    const sourceCandidate = path.join(
      __dirname,
      '..',
      'src',
      'modules',
      'permissions',
      'core-permissions.ts',
    );
    if (fs.existsSync(sourceCandidate)) {
      return require(sourceCandidate);
    }
  } catch {
    // Ignore and fall through to the explicit error below.
  }

  throw new Error(
    'Nao foi possivel carregar o catalogo de permissoes. Execute o build do backend antes de usar este script.',
  );
}

module.exports = { loadCorePermissionsModule };
