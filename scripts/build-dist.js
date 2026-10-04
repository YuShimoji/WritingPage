const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const outputArg = process.argv.indexOf('--out-dir');
if (outputArg >= 0 && (!process.argv[outputArg + 1] || process.argv[outputArg + 1].startsWith('--'))) {
  throw new Error('--out-dir requires an explicit output directory');
}
const requestedOutput = outputArg >= 0 ? process.argv[outputArg + 1] : process.env.WRITINGPAGE_DIST_DIR;
const outDir = path.resolve(requestedOutput || path.join(projectRoot, 'dist'));
if (outDir === projectRoot || outDir === path.parse(outDir).root || projectRoot.startsWith(outDir + path.sep)) {
  throw new Error('Build output must not contain the source repository or be a drive root');
}

const filesToCopy = [
  'index.html',
  'embed-demo.html',
  'embed-xorigin-demo.html',
  'favicon.svg',
  'manifest.webmanifest',
  'sw.js'
];

const dirsToCopy = ['css', 'js', 'vendor'];

function ensureCleanDir(dir) {
  // Explicit external outputs are fresh-only: preserve every existing deliverable.
  if (requestedOutput && fs.existsSync(dir)) throw new Error('Explicit build output already exists: ' + dir);
  if (!requestedOutput) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(relPath) {
  const src = path.join(projectRoot, relPath);
  const dst = path.join(outDir, relPath);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(relPath) {
  const src = path.join(projectRoot, relPath);
  const dst = path.join(outDir, relPath);
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dst, { recursive: true });
}

function writeBuildInfo() {
  const timestamp = new Date().toISOString();
  const lines = [
    `BuiltAt=${timestamp}`,
    'Entry=index.html',
    'HowToRun=Open dist/index.html in your browser (no server required).'
  ];
  fs.writeFileSync(path.join(outDir, 'BUILD_INFO.txt'), lines.join('\n') + '\n', 'utf8');
}

function run() {
  ensureCleanDir(outDir);
  filesToCopy.forEach(copyFile);
  dirsToCopy.forEach(copyDir);
  writeBuildInfo();
  console.log(`Build completed: ${outDir}`);
}

run();
