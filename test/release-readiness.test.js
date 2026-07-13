const test = require('node:test');
const assert = require('node:assert/strict');
const {
  renderCheckpointMarkdown,
  synthesizeDecision,
} = require('../scripts/release-readiness-lib');

function fixture(overrides = {}) {
  const base = {
    schemaVersion: '1.0.0',
    createdAt: '2026-07-13T00:00:00.000Z',
    source: { branch: 'main', commit: 'abc123', dirty: false },
    environment: { node: 'v24.14.0', npm: '11.6.2', platform: 'win32' },
    webAcceptance: {
      remoteFull: { runId: '1', commit: 'remote', evidenceGrade: 'observed' },
      localBoundedReplay: {
        status: 'pass',
        commands: [{ command: 'npm run test:smoke', status: 'pass', durationMs: 1 }],
      },
      notRerun: ['full_playwright'],
    },
    captures: {
      status: 'pass',
      owner: 'capture.js',
      sourceCommit: 'abc123',
      sourceDirty: false,
      createdAt: '2026-07-13T00:00:00.000Z',
      mode: 'dist',
      root: 'dist',
      artifacts: ['manifest.json', '01.png'],
    },
    package: {
      status: 'pass',
      path: 'build/win-unpacked/Zen Writer.exe',
      sizeBytes: 10,
      modifiedAt: '2026-07-13T00:00:00.000Z',
      sha256: 'hash',
      sourceCommit: 'abc123',
      sourceDirty: false,
    },
    humanGates: { electronObservation: { status: 'pending' } },
    debts: [{ nameJa: 'レビュー', impactJa: '未確認', owner: 'user', revisitTriggerJa: '確認時' }],
  };
  return { ...base, ...overrides };
}

test('pending Electron observation holds an otherwise passing checkpoint', () => {
  const input = fixture();
  const decision = synthesizeDecision(input);
  assert.equal(decision.overall, 'HOLD_FOR_ELECTRON_OBSERVATION');
  assert.deepEqual(decision.blockingGates, ['humanGates.electronObservation']);
});

test('machine gate failure blocks release readiness', () => {
  const input = fixture({ captures: { ...fixture().captures, status: 'stale' } });
  const decision = synthesizeDecision(input);
  assert.equal(decision.overall, 'BLOCKED');
  assert.deepEqual(decision.blockingGates, ['captures']);
});

test('dirty source blocks release evidence even when generated gates pass', () => {
  const input = fixture({ source: { branch: 'main', commit: 'abc123', dirty: true } });
  const decision = synthesizeDecision(input);
  assert.equal(decision.overall, 'BLOCKED');
  assert.deepEqual(decision.blockingGates, ['source.clean']);
});

test('observed Electron gate unlocks internal release review', () => {
  const input = fixture({ humanGates: { electronObservation: { status: 'pass' } } });
  const decision = synthesizeDecision(input);
  assert.equal(decision.overall, 'READY_FOR_INTERNAL_RELEASE_REVIEW');
});

test('Japanese checkpoint keeps package evidence separate from Electron observation', () => {
  const input = fixture();
  input.decision = synthesizeDecision(input);
  const markdown = renderCheckpointMarkdown(input);
  assert.match(markdown, /HOLD_FOR_ELECTRON_OBSERVATION/);
  assert.match(markdown, /package buildの成功は、Electron上の挙動を人間が観察した証拠ではありません/);
  assert.doesNotMatch(markdown, /夜明け前のメモ|雨の匂い|主人公は机に向かい/);
});
