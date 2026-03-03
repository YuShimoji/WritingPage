const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'dist');

const filesToCopy = [
  'index.html',
  'embed-demo.html',
  'embed-xorigin-demo.html',
  'favicon.svg'
];

const dirsToCopy = ['css', 'js'];

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
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
