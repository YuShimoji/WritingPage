const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeGitHubRepository,
  parseArgs,
  resolveRemoteFullEvidence,
} = require('../scripts/release-readiness-checkpoint');

const SOURCE_COMMIT = 'b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8';

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
      remoteFullRepo: 'YuShimoji/WritingPage',
    },
    SOURCE_COMMIT,
    {
      readRun: () => ({
        databaseId: 30200150522,
        headSha: SOURCE_COMMIT,
        status: 'completed',
        conclusion: 'success',
        event: 'push',
        name: 'CI E2E',
        url: 'https://github.com/YuShimoji/WritingPage/actions/runs/30200150522',
        createdAt: '2026-07-26T00:00:00Z',
        updatedAt: '2026-07-26T00:10:00Z',
      }),
    },
  );
  assert.equal(evidence.evidenceScope, 'exact_source');
  assert.equal(evidence.evidenceGrade, 'verified');
  assert.equal(evidence.sourceMatched, true);
  assert.equal(evidence.commit, SOURCE_COMMIT);
});

test('remote acceptance readback fails closed on source mismatch', () => {
  assert.throws(
    () => resolveRemoteFullEvidence(
      { remoteFullRunId: '30200150522' },
      SOURCE_COMMIT,
      {
        repository: 'YuShimoji/WritingPage',
        readRun: () => ({
          databaseId: 30200150522,
          headSha: '0'.repeat(40),
          status: 'completed',
          conclusion: 'success',
        }),
      },
    ),
    /not successful exact-source evidence/,
  );
});
