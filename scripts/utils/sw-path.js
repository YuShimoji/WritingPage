const fs = require('fs');
const path = require('path');

function resolveProjectRoot(customRoot) {
  return path.resolve(customRoot || process.cwd());
}

function normalizeCandidate(candidate) {
  return candidate ? path.resolve(candidate) : null;
}

function detectSwRoot(projectRoot = resolveProjectRoot()) {
  const envRoot = normalizeCandidate(process.env.SW_ROOT);
  if (envRoot && fs.existsSync(envRoot)) {
    return envRoot;
  }

  const candidates = [
    path.join(projectRoot, '.shared-workflows'),
    path.join(projectRoot, 'shared-workflows'),
    path.resolve(__dirname, '..', '..')
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return normalizeCandidate(candidate);
    }
  }

  return null;
}

function resolveSharedWorkflowsPath(relativePath, options = {}) {
  const projectRoot = resolveProjectRoot(options.projectRoot);
  const preferSwRoot = Boolean(options.preferSwRoot);
  const swRoot = detectSwRoot(projectRoot);

  const projectCandidate = path.join(projectRoot, relativePath);
  const swCandidate = swRoot ? path.join(swRoot, relativePath) : null;

  const ordered = preferSwRoot
    ? [swCandidate, projectCandidate]
    : [projectCandidate, swCandidate];

  const existing = ordered.find((candidate) => candidate && fs.existsSync(candidate));

  return {
    path: existing || ordered.find(Boolean),
    projectRoot,
    swRoot
  };
}

function requireSharedWorkflowsPath(relativePath, options = {}) {
  const result = resolveSharedWorkflowsPath(relativePath, options);
  if (!result.path || !fs.existsSync(result.path)) {
    const candidates = [
      path.join(result.projectRoot, relativePath),
      result.swRoot ? path.join(result.swRoot, relativePath) : '(SW_ROOT not detected)'
    ].filter(Boolean);
    throw new Error(
      `参照ファイルが見つかりません: ${relativePath}\n候補: ${candidates.join(', ')}`
    );
  }
  return result;
}

module.exports = {
  detectSwRoot,
  resolveSharedWorkflowsPath,
  requireSharedWorkflowsPath
};
