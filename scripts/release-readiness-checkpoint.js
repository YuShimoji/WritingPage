const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractFile } = require('@electron/asar');
const {
  listFilesRecursive,
  renderCheckpointMarkdown,
  renderElectronOperatorReview,
  sha256File,
  synthesizeDecision,
} = require('./release-readiness-lib');

const projectRoot = path.join(__dirname, '..');
const npmExecPath = process.env.npm_execpath;
const EXPECTED_REMOTE_WORKFLOW = 'CI E2E';
const packageManager = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).packageManager;
const EXPECTED_NPM_VERSION = String(packageManager || '').match(/^npm@(\d+\.\d+\.\d+)$/)?.[1] || null;
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
    } else if (arg === '--package-out' && argv[index + 1]) {
      options.packageOutDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--package-out=')) {
      options.packageOutDir = arg.slice('--package-out='.length);
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
    'databaseId,headSha,status,conclusion,event,name,workflowName,url,createdAt,updatedAt',
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
    const readRepository = dependencies.readRepository || readGitHubRepository;
    return {
      ...REPOSITORY_BASELINE_REMOTE_FULL,
      repository: readRepository(),
      sourceMatched: REPOSITORY_BASELINE_REMOTE_FULL.commit === sourceCommit,
    };
  }
  if (!/^\d+$/.test(String(runId))) {
    throw new Error(`--remote-full-run-id must be numeric: ${runId}`);
  }

  const readRepository = dependencies.readRepository || readGitHubRepository;
  const repository = readRepository();
  if (options.remoteFullRepo && options.remoteFullRepo !== repository) {
    throw new Error(
      `--remote-full-repo must match origin repository ${repository}: ${options.remoteFullRepo}`,
    );
  }
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
  if (run.workflowName !== EXPECTED_REMOTE_WORKFLOW) {
    identityProblems.push(`workflowName=${run.workflowName}`);
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
    workflowName: run.workflowName,
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

function runNpmScript(name, scriptArgs = []) {
  if (!npmExecPath) {
    return {
      command: `npm run ${name}`,
      status: 'blocked',
      exitCode: null,
      durationMs: 0,
      stderrTail: 'npm_execpath is missing; invoke through npm run release:checkpoint',
    };
  }
  const args = [npmExecPath, 'run', name];
  if (scriptArgs.length > 0) args.push('--', ...scriptArgs);
  return run(process.execPath, args, `npm run ${name}${scriptArgs.length ? ` -- ${scriptArgs.join(' ')}` : ''}`);
}

function readNpmVersion() {
  if (!npmExecPath) return 'unknown';
  return execFileSync(process.execPath, [npmExecPath, '--version'], {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
}

function sha256Buffer(buffer) {
  return require('node:crypto').createHash('sha256').update(buffer).digest('hex');
}

function readAppAsarEvidence(asarPath) {
  if (!fs.existsSync(asarPath)) {
    return { exists: false, sha256: null, sourceFiles: [], sourceFilesMatch: false, markdownItVersion: null };
  }
  try {
    const sourcePaths = [
      'js/storage.js',
      'js/storage-idb.js',
      'js/editor-wysiwyg.js',
      'js/zw-markdown-it-body.js',
      'electron/main.js',
    ];
    const sourceFiles = sourcePaths.map((relativePath) => {
      const sourceSha256 = sha256File(path.join(projectRoot, relativePath));
      const packedSha256 = sha256Buffer(extractFile(asarPath, relativePath));
      return { path: relativePath, sourceSha256, packedSha256, matches: sourceSha256 === packedSha256 };
    });
    const markdownIt = JSON.parse(extractFile(asarPath, 'node_modules/markdown-it/package.json').toString('utf8'));
    const expectedMarkdownIt = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'node_modules', 'markdown-it', 'package.json'), 'utf8'),
    ).version;
    return {
      exists: true,
      sha256: sha256File(asarPath),
      sourceFiles,
      sourceFilesMatch: sourceFiles.every((item) => item.matches),
      markdownItVersion: markdownIt.version,
      expectedMarkdownItVersion: expectedMarkdownIt,
      markdownItVersionMatches: markdownIt.version === expectedMarkdownIt,
    };
  } catch (error) {
    return {
      exists: true,
      sha256: sha256File(asarPath),
      sourceFiles: [],
      sourceFilesMatch: false,
      markdownItVersion: null,
      evidenceError: error.message,
    };
  }
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
  if (sourceAtStart.dirty) {
    throw new Error('Release checkpoint requires a clean source commit.');
  }
  const npmVersion = readNpmVersion();
  if (EXPECTED_NPM_VERSION && npmVersion !== EXPECTED_NPM_VERSION) {
    throw new Error(`Expected ${packageManager}, received npm ${npmVersion}.`);
  }
  fs.mkdirSync(captureDir, { recursive: true });
  const environment = {
    node: process.version,
    npm: npmVersion,
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
  const regressionCases = [
    {
      id: 'wiki-delete-reload',
      labelJa: 'Wiki削除後に記事が復活しない',
      file: 'e2e/wiki-idb-trust.spec.js',
      grep: 'deleted Wiki entry stays deleted after immediate reload',
    },
    {
      id: 'wiki-late-hydration',
      labelJa: '遅延IDB読込で編集を巻き戻さない',
      file: 'e2e/wiki-idb-trust.spec.js',
      grep: 'late Wiki hydration cannot overwrite an edit already flushed to IDB',
    },
    {
      id: 'rich-empty-heading',
      labelJa: 'Rich保存・再読込後も空見出しを保持',
      file: 'e2e/persistence-conversion-regressions.spec.js',
      grep: 'empty heading boundaries and the empty final chapter survive Rich save and reload',
    },
    {
      id: 'rich-aligned-eleventh',
      labelJa: '11個目の揃え付き段落も本文を保持',
      file: 'e2e/persistence-conversion-regressions.spec.js',
      grep: 'eleven aligned paragraphs keep distinct bodies in visible preview and Reader after reload',
    },
  ].map((item) => ({
    ...item,
    commandResult: runNpmScript('test:e2e', [item.file, '--grep', item.grep]),
  }));
  const regressionStatus = regressionCases.every((item) => item.commandResult.status === 'pass')
    ? 'pass'
    : 'fail';

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

  const packageOutDir = path.resolve(projectRoot, options.packageOutDir || 'build');
  const packageBuild = runNpmScript('electron:build', [
    `--config.directories.output=${packageOutDir}`,
  ]);
  const packagePath = path.join(packageOutDir, 'win-unpacked', 'Zen Writer.exe');
  const asarPath = path.join(packageOutDir, 'win-unpacked', 'resources', 'app.asar');
  const packageExists = fs.existsSync(packagePath);
  const asarEvidence = readAppAsarEvidence(asarPath);
  const packageStatus = packageBuild.status === 'pass'
    && packageExists
    && asarEvidence.exists
    && asarEvidence.sourceFilesMatch
    && asarEvidence.markdownItVersionMatches
    ? 'pass'
    : 'blocked';
  const packageStat = packageExists ? fs.statSync(packagePath) : null;
  const packageEvidence = {
    status: packageStatus,
    buildCommand: packageBuild.command,
    path: path.relative(projectRoot, packagePath).replace(/\\/g, '/'),
    absolutePath: packagePath,
    exists: packageExists,
    sizeBytes: packageStat ? packageStat.size : 0,
    modifiedAt: packageStat ? packageStat.mtime.toISOString() : null,
    sha256: packageExists ? sha256File(packagePath) : null,
    sourceCommit: sourceAtStart.commit,
    sourceDirty: sourceAtStart.dirty,
    evidenceGrade: packageExists ? 'verified' : 'unverified',
    appAsar: {
      path: path.relative(projectRoot, asarPath).replace(/\\/g, '/'),
      absolutePath: asarPath,
      ...asarEvidence,
    },
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
    regressions: {
      status: regressionStatus,
      evidenceGrade: 'verified',
      cases: regressionCases,
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
