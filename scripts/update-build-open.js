const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function shouldUseShell(command) {
  return process.platform === 'win32' && command === 'npm';
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
    noOpen: args.has('--no-open'),
    distHtml: args.has('--dist-html'),
    packaged: args.has('--packaged'),
  };
}

function run(command, args, options = {}) {
  const printable = [command].concat(args || []).join(' ');
  if (options.dryRun) {
    console.log(`[dry-run] ${printable}`);
    return;
  }

  const result = spawnSync(command, args || [], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: shouldUseShell(command),
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${printable}`);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args || [], {
    cwd: projectRoot,
    encoding: 'utf8',
    shell: shouldUseShell(command),
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return (result.stdout || '').trim();
}

function ensureRepoRoot() {
  const root = capture('git', ['rev-parse', '--show-toplevel']);
  if (path.resolve(root) !== projectRoot) {
    throw new Error(`Unexpected git root: ${root}`);
  }
}

function ensureCleanWorktree() {
  const status = capture('git', ['status', '--porcelain']);
  if (status) {
    throw new Error([
      'Local changes are present. Update-and-launch stops before pulling so work is not overwritten.',
      status,
    ].join('\n'));
  }
}

function ensureBranch() {
  const branch = capture('git', ['branch', '--show-current']);
  if (!branch) {
    throw new Error('Detached HEAD is not supported by update-and-launch.');
  }
  return branch;
}

function updateFromRemote(options) {
  ensureRepoRoot();
  if (options.dryRun) {
    const branch = ensureBranch();
    console.log(`Would require a clean worktree before updating ${branch}.`);
    console.log('Would stop before pulling if local changes are present.');
    run('git', ['fetch', 'origin'], options);
    run('git', ['pull', '--ff-only'], options);
    return;
  }
  ensureCleanWorktree();
  const branch = ensureBranch();
  console.log(`Updating ${branch} with fast-forward only...`);
  run('git', ['fetch', 'origin'], options);
  run('git', ['pull', '--ff-only'], options);
  ensureCleanWorktree();
}

function buildDist(options) {
  console.log('Building dist/index.html...');
  run('npm', ['run', 'build'], options);
  const indexPath = path.join(projectRoot, 'dist', 'index.html');
  if (!options.dryRun && !fs.existsSync(indexPath)) {
    throw new Error('Build finished but dist/index.html was not found.');
  }
}

function openApp(options) {
  if (options.noOpen) return;
  const openArgs = ['run'];
  if (options.packaged) {
    openArgs.push('app:open:package');
  } else {
    openArgs.push('app:open:dist');
  }
  console.log('Opening Zen Writer...');
  run('npm', openArgs, options);
}

function main() {
  const options = parseArgs();
  updateFromRemote(options);
  buildDist(options);
  openApp(options);
  if (options.dryRun) {
    console.log('Dry run complete. No update, build, or launch was performed.');
  } else {
    console.log('Update, build, and launch complete.');
  }
}

try {
  main();
} catch (error) {
  console.error('');
  console.error('Zen Writer update-and-launch stopped.');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
