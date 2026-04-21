const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

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

function isWsl() {
  return process.platform === 'linux' &&
    (Boolean(process.env.WSLENV) || /microsoft/i.test(os.release()));
}

function canUseWindowsLauncher() {
  return process.platform === 'win32' || isWsl();
}

function toLauncherPath(targetPath) {
  if (!isWsl()) return targetPath;
  try {
    return execFileSync('wslpath', ['-w', targetPath], {
      encoding: 'utf8',
    }).trim();
  } catch (_) {
    return targetPath;
  }
}

function chooseTarget() {
  const args = parseArgs();
  if (args.forceDistHtml) {
    return { type: 'dist-html', path: indexPath };
  }
  if (args.forcePackaged) {
    return { type: 'packaged', path: packagedAppPath };
  }
  if (canUseWindowsLauncher() && fs.existsSync(packagedAppPath)) {
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

function launchDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

function runLauncher(command, args) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
}

function openOnWindows(target) {
  if (target.type === 'packaged') {
    // Keep the packaged launcher synchronous on Windows so cmd.exe does not
    // swallow a hidden PowerShell failure before Start-Process runs.
    runLauncher('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      toLauncherPath(windowsLauncher),
      '-AppPath',
      toLauncherPath(target.path),
    ]);
    return;
  }
  launchDetached('cmd.exe', ['/c', 'start', '', target.path]);
}

function openOnMac(target) {
  launchDetached('open', [target.path]);
}

function openOnLinux(target) {
  if (target.type === 'packaged' && canUseWindowsLauncher()) {
    openOnWindows(target);
    return;
  }
  launchDetached('xdg-open', [target.path]);
}

if (process.platform === 'win32') {
  openOnWindows(target);
} else if (process.platform === 'darwin') {
  openOnMac(target);
} else {
  openOnLinux(target);
}

console.log(`Opened (${target.type}): ${target.path}`);
