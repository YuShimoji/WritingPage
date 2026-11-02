const assert = require('node:assert/strict');
const test = require('node:test');

const {
  archiveRelativePath,
  normalizeGitHubRepository,
  parseArgs,
  resolveRemoteFullEvidence,
} = require('../scripts/release-readiness-checkpoint');
const path = require('node:path');

const SOURCE_COMMIT = 'b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8';
const REPOSITORY = 'YuShimoji/WritingPage';

function successfulRun(overrides = {}) {
  return {
    databaseId: 30200150522,
    headSha: SOURCE_COMMIT,
    status: 'completed',
    conclusion: 'success',
    event: 'push',
    name: 'CI E2E',
    workflowName: 'CI E2E',
    url: `https://github.com/${REPOSITORY}/actions/runs/30200150522`,
    createdAt: '2026-07-26T00:00:00Z',
    updatedAt: '2026-07-26T00:10:00Z',
    ...overrides,
  };
}

function exactRunDependencies(run) {
  return {
    readRepository: () => REPOSITORY,
    readRun: (runId, repository) => {
      assert.equal(runId, '30200150522');
      assert.equal(repository, REPOSITORY);
      return run;
    },
  };
}

test('checkpoint arguments accept exact remote run identity', () => {
  assert.deepEqual(
    parseArgs([
      '--out=output/checkpoint',
      '--remote-full-run-id',
      '30200150522',
      '--remote-full-repo=YuShimoji/WritingPage',
    ]),
    {
      outDir: 'output/checkpoint',
      remoteFullRunId: '30200150522',
      remoteFullRepo: 'YuShimoji/WritingPage',
    },
  );
});

test('checkpoint arguments accept a dedicated package output directory', () => {
  assert.deepEqual(
    parseArgs(['--package-out=output/candidate/build']),
    { packageOutDir: 'output/candidate/build' },
  );
});

test('app.asar paths are normalized for the current platform', () => {
  assert.equal(archiveRelativePath('node_modules/markdown-it/package.json'),
    path.join('node_modules', 'markdown-it', 'package.json'));
  assert.equal(archiveRelativePath('js/storage.js'), path.join('js', 'storage.js'));
});

test('GitHub repository is derived from HTTPS and SSH origin URLs', () => {
  assert.equal(
    normalizeGitHubRepository('https://github.com/YuShimoji/WritingPage.git'),
    'YuShimoji/WritingPage',
  );
  assert.equal(
    normalizeGitHubRepository('git@github.com:YuShimoji/WritingPage.git'),
    'YuShimoji/WritingPage',
  );
});

test('historic remote acceptance is explicitly repository baseline evidence', () => {
  const evidence = resolveRemoteFullEvidence({}, SOURCE_COMMIT);
  assert.equal(evidence.evidenceScope, 'repository_baseline');
  assert.equal(evidence.sourceMatched, false);
  assert.equal(evidence.runId, '29198025986');
});

test('successful gh readback binds remote acceptance to exact source', () => {
  const evidence = resolveRemoteFullEvidence(
    {
      remoteFullRunId: '30200150522',
        remoteFullRepo: REPOSITORY,
    },
    SOURCE_COMMIT,
      exactRunDependencies(successfulRun()),
  );
  assert.equal(evidence.evidenceScope, 'exact_source');
  assert.equal(evidence.evidenceGrade, 'verified');
  assert.equal(evidence.sourceMatched, true);
  assert.equal(evidence.commit, SOURCE_COMMIT);
  assert.equal(evidence.repository, REPOSITORY);
  assert.equal(evidence.workflowName, 'CI E2E');
});

test('exact binding fails closed for each mismatched identity field', () => {
  const invalidRuns = [
    successfulRun({ databaseId: 30200150523 }),
    successfulRun({ headSha: '0'.repeat(40) }),
    successfulRun({ status: 'in_progress' }),
    successfulRun({ conclusion: 'failure' }),
    successfulRun({ workflowName: 'Release' }),
  ];
  for (const run of invalidRuns) {
    assert.throws(
      () => resolveRemoteFullEvidence(
        { remoteFullRunId: '30200150522' },
        SOURCE_COMMIT,
        exactRunDependencies(run),
      ),
      /not successful exact-source evidence/,
    );
  }
});

test('exact binding rejects a requested repository that differs from origin', () => {
  assert.throws(
    () => resolveRemoteFullEvidence(
      { remoteFullRunId: '30200150522', remoteFullRepo: 'Elsewhere/WritingPage' },
      SOURCE_COMMIT,
      exactRunDependencies(successfulRun()),
    ),
    /must match origin repository/,
  );
});

test('exact binding rejects invalid run ids before remote lookup', () => {
  let readRunCalled = false;
  assert.throws(
    () => resolveRemoteFullEvidence(
      { remoteFullRunId: '../latest' },
      SOURCE_COMMIT,
      {
        readRepository: () => REPOSITORY,
        readRun: () => { readRunCalled = true; },
      },
    ),
    /must be numeric/,
  );
  assert.equal(readRunCalled, false);
});
