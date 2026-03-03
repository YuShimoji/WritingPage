const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const projectRoot = process.cwd();
const indexPath = path.join(projectRoot, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

function openOnWindows(target) {
  execFile('cmd', ['/c', 'start', '', target], { windowsHide: true });
}

function openOnMac(target) {
  execFile('open', [target]);
}

function openOnLinux(target) {
  execFile('xdg-open', [target]);
}

if (process.platform === 'win32') {
  openOnWindows(indexPath);
} else if (process.platform === 'darwin') {
  openOnMac(indexPath);
} else {
  openOnLinux(indexPath);
}

console.log(`Opened: ${indexPath}`);
