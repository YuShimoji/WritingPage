const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function assertWindows() {
  if (process.platform !== 'win32') {
    throw new Error('This installer currently supports Windows only.');
  }
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function writeShortcut(projectRoot) {
  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error('APPDATA is not available.');
  }

  const startMenuDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  const shortcutPath = path.join(startMenuDir, 'Zen Writer Update and Launch.lnk');
  const launcherPath = path.join(projectRoot, 'ZenWriter-UpdateAndLaunch.cmd');
  const iconPath = path.join(projectRoot, 'favicon.svg');

  if (!fs.existsSync(launcherPath)) {
    throw new Error(`Launcher not found: ${launcherPath}`);
  }

  fs.mkdirSync(startMenuDir, { recursive: true });

  const commands = [
    '$shell = New-Object -ComObject WScript.Shell',
    `$shortcut = $shell.CreateShortcut(${psQuote(shortcutPath)})`,
    `$shortcut.TargetPath = ${psQuote(launcherPath)}`,
    `$shortcut.WorkingDirectory = ${psQuote(projectRoot)}`,
    '$shortcut.WindowStyle = 1',
    '$shortcut.Description = "Update Zen Writer from git, build dist, then launch"',
  ];

  if (fs.existsSync(iconPath)) {
    commands.push(`$shortcut.IconLocation = ${psQuote(iconPath)}`);
  }

  commands.push('$shortcut.Save()');

  execFileSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    commands.join('; '),
  ], {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  });

  return shortcutPath;
}

function main() {
  assertWindows();
  const projectRoot = process.cwd();
  const shortcutPath = writeShortcut(projectRoot);
  console.log(`Start Menu update launcher created: ${shortcutPath}`);
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
