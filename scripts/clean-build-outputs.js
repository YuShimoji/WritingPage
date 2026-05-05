const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const removeAllGenerated = args.has('--all');
const dryRun = args.has('--dry-run');

const canonicalOutputs = new Set(['dist', 'build']);
const legacyOutputNames = new Set(['build-new', 'build-friction']);

function isLegacyBuildOutput(name) {
  return legacyOutputNames.has(name) || /^build-session\d+$/.test(name);
}

function isRemovalCandidate(name) {
  if (removeAllGenerated && canonicalOutputs.has(name)) return true;
  return isLegacyBuildOutput(name);
}

function assertInsideProject(targetPath) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove outside project: ${resolvedTarget}`);
  }
}

function listRemovalCandidates() {
  return fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(isRemovalCandidate)
    .sort((a, b) => a.localeCompare(b));
}

function removeDir(name) {
  const targetPath = path.join(projectRoot, name);
  assertInsideProject(targetPath);
  if (dryRun) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

const targets = listRemovalCandidates();

if (targets.length === 0) {
  console.log(removeAllGenerated
    ? 'No generated build outputs found.'
    : 'No legacy build workaround folders found.');
  process.exit(0);
}

for (const target of targets) {
  removeDir(target);
}

const mode = dryRun ? 'Would remove' : 'Removed';
console.log(`${mode}: ${targets.join(', ')}`);

if (!removeAllGenerated) {
  console.log('Kept canonical outputs: dist/ and build/');
}
