const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  listFilesRecursive,
  renderCheckpointMarkdown,
  renderElectronOperatorReview,
  sha256File,
  synthesizeDecision,
} = require('./release-readiness-lib');

const projectRoot = path.join(__dirname, '..');
const npmExecPath = process.env.npm_execpath;
const REPOSITORY_BASELINE_REMOTE_FULL = Object.freeze({
  status: 'pass',
  evidenceGrade: 'observed',
  evidenceScope: 'repository_baseline',
  runId: '29198025986',
  commit: 'cf4b43274600ea21d6b1e6b024b39d9e0f25eed7',
  result: '594 passed / 4 skipped',
  anchor: 'docs/verification/2026-07-12/current-main-ci-trust-recovery.md',
  executedInThisRun: false,
});

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out' && argv[index + 1]) {
      options.outDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--out=')) {
      options.outDir = arg.slice('--out='.length);
    } else if (arg === '--remote-full-run-id' && argv[index + 1]) {
      options.remoteFullRunId = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--remote-full-run-id=')) {
      options.remoteFullRunId = arg.slice('--remote-full-run-id='.length);
    } else if (arg === '--remote-full-repo' && argv[index + 1]) {
      options.remoteFullRepo = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--remote-full-repo=')) {
      options.remoteFullRepo = arg.slice('--remote-full-repo='.length);
    }
  }
  return options;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function git(...args) {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
}

function readSource() {
  return {
    branch: git('branch', '--show-current'),
    commit: git('rev-parse', 'HEAD'),
    dirty: git('status', '--porcelain').length > 0,
  };
}

function normalizeGitHubRepository(remoteUrl) {
  const normalized = String(remoteUrl || '').trim().replace(/\.git$/i, '');
  const match = normalized.match(/github\.com(?::|\/)([^/]+)\/([^/]+)$/i);
  if (!match) {
    throw new Error(`origin remote is not a supported GitHub URL: ${remoteUrl}`);
  }
  return `${match[1]}/${match[2]}`;
}

function readGitHubRepository() {
  return normalizeGitHubRepository(git('remote', 'get-url', 'origin'));
}

function readGitHubRun(runId, repository) {
  const output = execFileSync('gh', [
    'run',
    'view',
    String(runId),
    '--repo',
    repository,
    '--json',
    'databaseId,headSha,status,conclusion,event,name,url,createdAt,updatedAt',
  ], {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  return JSON.parse(output);
}

function resolveRemoteFullEvidence(options, sourceCommit, dependencies = {}) {
  const runId = options.remoteFullRunId;
  if (!runId) {
    return {
      ...REPOSITORY_BASELINE_REMOTE_FULL,
      sourceMatched: REPOSITORY_BASELINE_REMOTE_FULL.commit === sourceCommit,
    };
  }
  if (!/^\d+$/.test(String(runId))) {
    throw new Error(`--remote-full-run-id must be numeric: ${runId}`);
  }

  const repository = options.remoteFullRepo
    || dependencies.repository
    || readGitHubRepository();
  const readRun = dependencies.readRun || readGitHubRun;
  const run = readRun(runId, repository);
  const identityProblems = [];
  if (String(run.databaseId) !== String(runId)) {
    identityProblems.push(`databaseId=${run.databaseId}`);
  }
  if (run.headSha !== sourceCommit) {
    identityProblems.push(`headSha=${run.headSha}`);
  }
  if (run.status !== 'completed') {
    identityProblems.push(`status=${run.status}`);
  }
  if (run.conclusion !== 'success') {
    identityProblems.push(`conclusion=${run.conclusion}`);
  }
  if (identityProblems.length > 0) {
    throw new Error(
      `remote full run ${runId} is not successful exact-source evidence for ${sourceCommit}: `
      + identityProblems.join(', '),
    );
  }

  return {
    status: 'pass',
    evidenceGrade: 'verified',
    evidenceScope: 'exact_source',
    repository,
    runId: String(run.databaseId),
    commit: run.headSha,
    result: `${run.name}: ${run.status}/${run.conclusion}`,
    anchor: run.url,
    event: run.event,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    sourceMatched: true,
    readbackTool: 'gh run view',
    executedInThisRun: false,
  };
}

function run(command, args, display) {
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  const status = result.status === 0 ? 'pass' : 'fail';
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  return {
    command: display,
    status,
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    stderrTail: status === 'fail' ? (result.stderr || '').slice(-4000) : '',
  };
}

function runNpmScript(name) {
  if (!npmExecPath) {
    return {
      command: `npm run ${name}`,
      status: 'blocked',
      exitCode: null,
      durationMs: 0,
      stderrTail: 'npm_execpath is missing; invoke through npm run release:checkpoint',
    };
  }
  return run(process.execPath, [npmExecPath, 'run', name], `npm run ${name}`);
}

function readNpmVersion() {
  if (!npmExecPath) return 'unknown';
  return execFileSync(process.execPath, [npmExecPath, '--version'], {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(options.outDir || path.join(
    projectRoot,
    'output',
    'release-readiness',
    `checkpoint-${timestampSlug()}`,
  ));
  const captureDir = path.join(outDir, 'captures', 'ui-dist');
  const sourceAtStart = readSource();
  const remoteFull = resolveRemoteFullEvidence(options, sourceAtStart.commit);
  fs.mkdirSync(captureDir, { recursive: true });
  const environment = {
    node: process.version,
    npm: readNpmVersion(),
    npmInvocation: `${process.execPath} ${npmExecPath || '<missing npm_execpath>'}`,
    platform: `${process.platform} ${os.release()} ${process.arch}`,
  };

  const localCommands = [
    runNpmScript('test:smoke'),
    runNpmScript('test:unit'),
    runNpmScript('lint:js:check'),
    runNpmScript('build'),
  ];
  const localStatus = localCommands.every((item) => item.status === 'pass') ? 'pass' : 'fail';

  const captureResult = run(
    process.execPath,
    [path.join(projectRoot, 'scripts', 'capture-ui-verification.js'), '--dist', '--out', captureDir],
    `node scripts/capture-ui-verification.js --dist --out ${path.relative(projectRoot, captureDir)}`,
  );
  const captureManifestPath = path.join(captureDir, 'manifest.json');
  const captureManifest = fs.existsSync(captureManifestPath)
    ? JSON.parse(fs.readFileSync(captureManifestPath, 'utf8'))
    : null;
  const captureArtifacts = listFilesRecursive(captureDir);
  const captureStatus = captureResult.status === 'pass' && captureManifest
    && captureManifest.sourceCommit === sourceAtStart.commit
    && captureManifest.sourceDirty === sourceAtStart.dirty
    ? 'pass'
    : 'fail';

  const packageBuild = runNpmScript('electron:build');
  const packagePath = path.join(projectRoot, 'build', 'win-unpacked', 'Zen Writer.exe');
  const packageExists = fs.existsSync(packagePath);
  const packageStat = packageExists ? fs.statSync(packagePath) : null;
  const packageEvidence = {
    status: packageBuild.status === 'pass' && packageExists ? 'pass' : 'blocked',
    buildCommand: packageBuild.command,
    path: path.relative(projectRoot, packagePath).replace(/\\/g, '/'),
    exists: packageExists,
    sizeBytes: packageStat ? packageStat.size : 0,
    modifiedAt: packageStat ? packageStat.mtime.toISOString() : null,
    sha256: packageExists ? sha256File(packagePath) : null,
    sourceCommit: sourceAtStart.commit,
    sourceDirty: sourceAtStart.dirty,
    evidenceGrade: packageExists ? 'verified' : 'unverified',
    behaviorObserved: false,
    commandResult: packageBuild,
  };

  const checkpoint = {
    schemaVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    source: sourceAtStart,
    environment,
    webAcceptance: {
      remoteFull,
      localBoundedReplay: {
        status: localStatus,
        evidenceGrade: 'verified',
        commands: localCommands,
      },
      notRerun: ['full_playwright', 'SP-071 focused replay'],
    },
    captures: {
      status: captureStatus,
      evidenceGrade: captureStatus === 'pass' ? 'verified' : 'unverified',
      owner: captureManifest ? captureManifest.owner : 'scripts/capture-ui-verification.js',
      generator: captureManifest ? captureManifest.generator : null,
      sourceCommit: captureManifest ? captureManifest.sourceCommit : null,
      sourceDirty: captureManifest ? captureManifest.sourceDirty : null,
      createdAt: captureManifest ? captureManifest.createdAt : null,
      mode: captureManifest ? captureManifest.mode : 'dist',
      root: captureManifest ? captureManifest.root : 'dist',
      manifest: path.relative(outDir, captureManifestPath).replace(/\\/g, '/'),
      artifacts: captureArtifacts,
      commandResult: captureResult,
    },
    package: packageEvidence,
    humanGates: {
      electronObservation: {
        status: 'pending',
        evidenceGrade: 'unverified',
        behaviorObserved: false,
        operatorSheet: 'ELECTRON_OPERATOR_REVIEW.md',
        requiredIdentity: packageEvidence.sha256,
      },
    },
    decision: null,
    debts: [
      {
        id: 'documents-tactile-review',
        nameJa: 'Documents体感レビュー',
        impactJa: 'empty hint、現在marker、focus returnの使い心地が未観察',
        owner: 'user',
        revisitTriggerJa: '実使用サイズでレビューできる時',
        blocking: false,
      },
    ],
  };
  checkpoint.decision = synthesizeDecision(checkpoint);

  fs.writeFileSync(path.join(outDir, 'checkpoint.json'), `${JSON.stringify(checkpoint, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'RELEASE_READINESS.md'), renderCheckpointMarkdown(checkpoint), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'ELECTRON_OPERATOR_REVIEW.md'),
    renderElectronOperatorReview(checkpoint),
    'utf8',
  );

  console.log(`Release-readiness checkpoint: ${outDir}`);
  console.log(`Decision: ${checkpoint.decision.overall}`);
  if (checkpoint.decision.overall === 'BLOCKED') process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  normalizeGitHubRepository,
  parseArgs,
  resolveRemoteFullEvidence,
};
