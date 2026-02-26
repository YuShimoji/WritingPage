const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

function assertWindows() {
  if (process.platform !== 'win32') {
    throw new Error('This installer currently supports Windows only.');
  }
}

function ensureBuiltDist(projectRoot) {
  const indexPath = path.join(projectRoot, 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html not found. Run `npm run build` first.');
  }
  return indexPath;
}

function writeStartMenuUrl(indexPath) {
  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error('APPDATA is not available.');
  }

  const startMenuDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  const shortcutPath = path.join(startMenuDir, 'Zen Writer.url');
  const fileUrl = pathToFileURL(indexPath).href;

  const content = [
    '[InternetShortcut]',
    `URL=${fileUrl}`,
    'IconIndex=0'
  ].join('\r\n') + '\r\n';

  fs.mkdirSync(startMenuDir, { recursive: true });
  fs.writeFileSync(shortcutPath, content, 'utf8');
  return shortcutPath;
}

function main() {
  assertWindows();
  const projectRoot = process.cwd();
  const indexPath = ensureBuiltDist(projectRoot);
  const shortcutPath = writeStartMenuUrl(indexPath);
  console.log(`Start Menu shortcut created: ${shortcutPath}`);
}

main();
