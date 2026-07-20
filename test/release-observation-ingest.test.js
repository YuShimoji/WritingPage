const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sha256File } = require('../scripts/release-readiness-lib');
const {
  BLOCKED,
  HOLD,
  ObservationIngestionError,
  READY,
  ingestObservation,
} = require('../scripts/release-observation-lib');

const PRODUCT_COMMIT = '8'.repeat(40);
const TOOL_COMMIT = 'f'.repeat(40);
const INGESTED_AT = '2026-07-21T00:00:00.000Z';

function buildScenario(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'writingpage-observation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packagePath = path.join(root, 'Zen Writer.exe');
  const checkpointDir = path.join(root, 'checkpoint-base');
  const checkpointPath = path.join(checkpointDir, 'checkpoint.json');
  const observationPath = path.join(root, 'observation.json');
  const outDir = path.join(root, 'review-output');
  fs.mkdirSync(checkpointDir, { recursive: true });
  fs.writeFileSync(packagePath, 'exact-package-bytes');
  const packageSha256 = sha256File(packagePath);
  const checkpoint = {
    schemaVersion: '1.0.0',
    source: { branch: 'evidence/test', commit: PRODUCT_COMMIT, dirty: false },
    package: {
      status: 'pass',
      path: 'build/win-unpacked/Zen Writer.exe',
      exists: true,
      sizeBytes: fs.statSync(packagePath).size,
      sha256: packageSha256,
      sourceCommit: PRODUCT_COMMIT,
      sourceDirty: false,
    },
    humanGates: {
      electronObservation: {
        status: 'pending',
        requiredIdentity: packageSha256,
      },
    },
    decision: { overall: HOLD },
    debts: [{ id: 'documents-tactile-review', owner: 'user', blocking: false }],
  };
  const observation = {
    schemaVersion: '1.0.0',
    observerIdentity: 'Thank / user via Web supervisor',
    reportedAt: null,
    observedAt: null,
    observedAtPrecision: 'not_supplied',
    result: 'PASS',
    reportedPackageSha256: packageSha256,
    packageLaunch: { status: 'pass', basis: 'current_user_report' },
    majorOperations: {
      status: 'pass',
      basis: 'current_user_report',
      detailLevel: 'aggregate_only',
    },
    saveObservation: {
      status: 'pass',
      basis: 'inherited_prior_repeated_user_verification',
      replayedOnCurrentExactPackageThisTurn: false,
    },
    persistenceAfterExitAndRestart: {
      status: 'pass',
      basis: 'inherited_prior_repeated_user_verification',
      replayedOnCurrentExactPackageThisTurn: false,
    },
    persistenceEvidenceReuse: { explicitlyAcceptedBySupervisor: true },
    webComparison: 'not_compared',
    blockingFinding: 'none',
    visualFindings: 'none_reported',
    summaryJa: 'packageは起動でき、主要操作に重大な問題はありません。保存・再起動復帰はPASSとして継承します。',
  };

  const writeInputs = () => {
    fs.writeFileSync(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
    fs.writeFileSync(observationPath, `${JSON.stringify(observation, null, 2)}\n`);
  };
  const run = () => ingestObservation({
    checkpointPath,
    packagePath,
    observationPath,
    outDir,
    synthesisToolCommit: TOOL_COMMIT,
    now: () => INGESTED_AT,
  });
  return {
    root,
    packagePath,
    checkpointPath,
    observationPath,
    outDir,
    checkpoint,
    observation,
    writeInputs,
    run,
  };
}

test('exact-hash compact PASS with approved inherited persistence becomes READY', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.internalReview.derivativeDecision.overall, READY);
  assert.equal(result.internalReview.derivativeHumanGate.status, 'pass');
  assert.equal(result.electronObservation.behaviorObserved, true);
  assert.equal(result.electronObservation.evidenceGrade, 'observed_user_reported');
  assert.equal(result.internalReview.derivativeHumanGate.evidenceGrade, 'mixed_observed_and_inherited');
  assert.deepEqual(fs.readdirSync(scenario.outDir).sort(), [
    'INTERNAL_RELEASE_REVIEW.md',
    'electron-observation.json',
    'internal-release-review.json',
  ]);
});

test('inherited persistence without supervisor acceptance remains HOLD', (t) => {
  const scenario = buildScenario(t);
  scenario.observation.persistenceEvidenceReuse.explicitlyAcceptedBySupervisor = false;
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.internalReview.derivativeDecision.overall, HOLD);
  assert.match(result.internalReview.derivativeDecision.rationaleJa, /explicitlyAcceptedBySupervisor/);
});

test('package hash mismatch is rejected as BLOCKED', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  fs.appendFileSync(scenario.packagePath, '-changed');
  assert.throws(scenario.run, (error) => {
    assert.ok(error instanceof ObservationIngestionError);
    assert.equal(error.code, 'PACKAGE_HASH_MISMATCH');
    assert.equal(error.decision.overall, BLOCKED);
    return true;
  });
});

test('checkpoint identity mismatch is rejected as BLOCKED', (t) => {
  const scenario = buildScenario(t);
  scenario.checkpoint.humanGates.electronObservation.requiredIdentity = '0'.repeat(64);
  scenario.writeInputs();
  assert.throws(scenario.run, (error) => {
    assert.equal(error.code, 'CHECKPOINT_IDENTITY_MISMATCH');
    assert.equal(error.decision.overall, BLOCKED);
    return true;
  });
});

test('FAIL observation synthesizes BLOCKED', (t) => {
  const scenario = buildScenario(t);
  scenario.observation.result = 'FAIL';
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.internalReview.derivativeDecision.overall, BLOCKED);
  assert.equal(result.internalReview.derivativeHumanGate.status, 'fail');
});

test('HOLD observation stays HOLD_FOR_ELECTRON_OBSERVATION', (t) => {
  const scenario = buildScenario(t);
  scenario.observation.result = 'HOLD';
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.internalReview.derivativeDecision.overall, HOLD);
  assert.equal(result.internalReview.derivativeHumanGate.status, 'pending');
  assert.doesNotMatch(result.markdown, /H1はlatest user \/ Web supervisor decisionの範囲で受理/);
});

test('missing current launch observation cannot emit READY', (t) => {
  const scenario = buildScenario(t);
  delete scenario.observation.packageLaunch;
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.internalReview.derivativeDecision.overall, HOLD);
  assert.equal(result.electronObservation.packageLaunch, null);
});

test('observedAt remains null with not_supplied precision', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.electronObservation.observedAt, null);
  assert.equal(result.electronObservation.observedAtPrecision, 'not_supplied');
  assert.equal(result.electronObservation.reportIngestedAt, INGESTED_AT);
});

test('current-package persistence replay remains false', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.electronObservation.currentPackagePersistenceReplayPerformed, false);
  assert.equal(
    result.internalReview.observationProvenance.currentExactPackagePersistenceReplayPerformed,
    false,
  );
});

test('base checkpoint remains byte-for-byte immutable', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  const before = fs.readFileSync(scenario.checkpointPath);
  const result = scenario.run();
  const after = fs.readFileSync(scenario.checkpointPath);
  assert.deepEqual(after, before);
  assert.equal(result.internalReview.baseCheckpoint.immutable, true);
  assert.equal(
    result.internalReview.baseCheckpoint.sha256BeforeGeneration,
    result.internalReview.baseCheckpoint.sha256AfterGeneration,
  );
});

test('Web comparison remains not_compared', (t) => {
  const scenario = buildScenario(t);
  scenario.writeInputs();
  const result = scenario.run();
  assert.equal(result.electronObservation.webComparison, 'not_compared');
  assert.equal(result.internalReview.observationProvenance.webComparison, 'not_compared');
});

test('generated derivative artifacts contain no manuscript body fixtures', (t) => {
  const scenario = buildScenario(t);
  scenario.observation.untrustedManuscriptBody = '夜明け前のメモ';
  scenario.writeInputs();
  scenario.run();
  const generated = fs.readdirSync(scenario.outDir)
    .map((name) => fs.readFileSync(path.join(scenario.outDir, name), 'utf8'))
    .join('\n');
  assert.doesNotMatch(generated, /夜明け前のメモ|雨の匂い|主人公は机に向かい/);
});
