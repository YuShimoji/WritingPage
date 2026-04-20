const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const projectRoot = process.cwd();
const indexPath = path.join(projectRoot, 'dist', 'index.html');
const packagedAppPath = path.join(projectRoot, 'build', 'win-unpacked', 'Zen Writer.exe');
const windowsLauncher = path.join(__dirname, 'open-packaged-app.ps1');

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    forceDistHtml: args.has('--dist-html'),
    forcePackaged: args.has('--packaged'),
  };
}

function chooseTarget() {
  const args = parseArgs();
  if (args.forceDistHtml) {
    return { type: 'dist-html', path: indexPath };
  }
  if (args.forcePackaged) {
    return { type: 'packaged', path: packagedAppPath };
  }
  if (process.platform === 'win32' && fs.existsSync(packagedAppPath)) {
    return { type: 'packaged', path: packagedAppPath };
  }
  return { type: 'dist-html', path: indexPath };
}

const target = chooseTarget();

if (!fs.existsSync(target.path)) {
  if (target.type === 'packaged') {
    console.error('build/win-unpacked/Zen Writer.exe not found. Run `npm run electron:build` first.');
  } else {
    console.error('dist/index.html not found. Run `npm run build` first.');
  }
  process.exit(1);
}

function openOnWindows(target) {
  if (target.type === 'packaged') {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        windowsLauncher,
        '-AppPath',
        target.path,
      ],
      { windowsHide: true }
    );
    return;
  }
  execFile('cmd', ['/c', 'start', '', target.path], { windowsHide: true });
}

function openOnMac(target) {
  execFile('open', [target.path]);
}

function openOnLinux(target) {
  execFile('xdg-open', [target.path]);
}

if (process.platform === 'win32') {
  openOnWindows(target);
} else if (process.platform === 'darwin') {
  openOnMac(target);
} else {
  openOnLinux(target);
}

console.log(`Opened (${target.type}): ${target.path}`);
