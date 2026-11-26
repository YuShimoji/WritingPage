const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function psQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function registerShortcuts() {
  if (process.platform !== 'win32') {
    throw new Error('This installer supports Windows only.');
  }
  const projectRoot = path.resolve(__dirname, '..');
  const appDir = path.join(projectRoot, 'build', 'win-unpacked');
  const appPath = path.join(appDir, 'Zen Writer.exe');
  const iconPath = path.join(projectRoot, 'electron', 'icon.ico');
  if (!fs.existsSync(appPath)) {
    throw new Error('Run `npm run electron:build` to create the Windows app first.');
  }
  if (!fs.existsSync(iconPath)) throw new Error(`WritingPage icon not found: ${iconPath}`);

  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$appPath = ${psQuote(appPath)}`,
    '$shell = New-Object -ComObject WScript.Shell',
    "$folders = [Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('DesktopDirectory')",
    '$links = foreach ($folder in $folders) {',
    "  if (-not $folder) { throw 'A Windows shortcut folder could not be located.' }",
    "  Join-Path $folder 'WritingPage.lnk'",
    '}',
    'foreach ($link in $links) {',
    '  if ((Test-Path -LiteralPath $link) -and $shell.CreateShortcut($link).TargetPath -ne $appPath) {',
    '    throw "A WritingPage shortcut already points to a different app: $link"',
    '  }',
    '}',
    'foreach ($link in $links) {',
    '  $shortcut = $shell.CreateShortcut($link)',
    '  $shortcut.TargetPath = $appPath',
    "  $shortcut.Arguments = ''",
    `  $shortcut.WorkingDirectory = ${psQuote(appDir)}`,
    `  $shortcut.IconLocation = ${psQuote(iconPath + ',0')}`,
    "  $shortcut.Description = 'WritingPage (Zen Writer)'",
    '  $shortcut.Save()',
    '  Write-Output $link',
    '}',
  ].join('\n');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    stdio: 'inherit',
    windowsHide: true,
  });
}

try {
  registerShortcuts();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
