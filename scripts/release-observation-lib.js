const fs = require('node:fs');
const path = require('node:path');
const { sha256File } = require('./release-readiness-lib');

const READY = 'READY_FOR_INTERNAL_RELEASE_REVIEW';
const HOLD = 'HOLD_FOR_ELECTRON_OBSERVATION';
const BLOCKED = 'BLOCKED';
const INHERITED_PERSISTENCE_BASIS = 'inherited_prior_repeated_user_verification';
const CURRENT_USER_BASIS = 'current_user_report';

class ObservationIngestionError extends Error {
  constructor(code, message, blockingGates = []) {
    super(message);
    this.name = 'ObservationIngestionError';
    this.code = code;
    this.decision = {
      overall: BLOCKED,
      rationaleJa: message,
      blockingGates,
    };
  }
}

function failIdentity(code, message, blockingGate) {
  throw new ObservationIngestionError(code, message, [blockingGate]);
}

function normalizeSha256(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) {
    failIdentity('INCOMPLETE_IDENTITY', `${label} が有効なSHA-256ではありません。`, label);
  }
  return value.toLowerCase();
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    failIdentity('INCOMPLETE_IDENTITY', `${label} がありません。`, label);
  }
  return value;
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    failIdentity('INVALID_JSON', `${label} をJSONとして読めません: ${error.message}`, label);
  }
}

function assertOutputBoundary(checkpointPath, outDir) {
  const checkpointDir = path.dirname(checkpointPath);
  const relative = path.relative(checkpointDir, outDir);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new ObservationIngestionError(
      'IMMUTABLE_BASE_BOUNDARY',
      'derivative outputはoriginal checkpoint folderの外に作成してください。',
      ['output.outsideBaseCheckpoint'],
    );
  }

  const targetNames = [
    'electron-observation.json',
    'internal-release-review.json',
    'INTERNAL_RELEASE_REVIEW.md',
  ];
  for (const targetName of targetNames) {
    if (fs.existsSync(path.join(outDir, targetName))) {
      throw new ObservationIngestionError(
        'OUTPUT_EXISTS',
        `既存のderivative artifactを上書きしません: ${targetName}`,
        ['output.newFolder'],
      );
    }
  }
}

function validateBaseIdentity(checkpoint, checkpointPath, packagePath, packageSha256) {
  const source = requireObject(checkpoint.source, 'checkpoint.source');
  const packageEvidence = requireObject(checkpoint.package, 'checkpoint.package');
  const humanGates = requireObject(checkpoint.humanGates, 'checkpoint.humanGates');
  const electronGate = requireObject(
    humanGates.electronObservation,
    'checkpoint.humanGates.electronObservation',
  );
  const decision = requireObject(checkpoint.decision, 'checkpoint.decision');

  if (typeof source.commit !== 'string' || !/^[0-9a-f]{40}$/i.test(source.commit)) {
    failIdentity('INCOMPLETE_IDENTITY', 'checkpoint source commitが不完全です。', 'source.commit');
  }
  if (source.dirty !== false) {
    failIdentity('DIRTY_SOURCE', 'checkpoint sourceはclean commitではありません。', 'source.clean');
  }
  if (packageEvidence.status !== 'pass' || packageEvidence.exists !== true) {
    failIdentity('PACKAGE_NOT_VERIFIED', 'checkpoint package gateがpassではありません。', 'package');
  }

  const checkpointPackageSha = normalizeSha256(packageEvidence.sha256, 'checkpoint.package.sha256');
  const requiredIdentity = normalizeSha256(
    electronGate.requiredIdentity,
    'checkpoint.humanGates.electronObservation.requiredIdentity',
  );
  if (packageEvidence.sourceCommit !== source.commit || packageEvidence.sourceDirty !== false) {
    failIdentity(
      'CHECKPOINT_IDENTITY_MISMATCH',
      'checkpoint内のsource/package identityが一致しません。',
      'checkpoint.package.sourceIdentity',
    );
  }
  if (requiredIdentity !== checkpointPackageSha) {
    failIdentity(
      'CHECKPOINT_IDENTITY_MISMATCH',
      'checkpointのrequiredIdentityとpackage SHA-256が一致しません。',
      'checkpoint.humanGates.electronObservation.requiredIdentity',
    );
  }
  if (packageSha256 !== checkpointPackageSha) {
    failIdentity(
      'PACKAGE_HASH_MISMATCH',
      '指定されたpackageの実SHA-256がcheckpoint identityと一致しません。',
      'package.sha256',
    );
  }
  if (decision.overall !== HOLD) {
    failIdentity(
      'UNEXPECTED_BASE_DECISION',
      `original checkpoint decisionは${HOLD}である必要があります。`,
      'checkpoint.decision.overall',
    );
  }

  return {
    source,
    packageEvidence,
    electronGate,
    checkpointPackageSha,
    checkpointPath,
    packagePath,
  };
}

function validateObservationIdentity(observation, packageSha256) {
  if (observation.schemaVersion !== '1.0.0') {
    failIdentity(
      'UNSUPPORTED_OBSERVATION_SCHEMA',
      'observation.schemaVersionは1.0.0である必要があります。',
      'observation.schemaVersion',
    );
  }
  if (typeof observation.observerIdentity !== 'string' || !observation.observerIdentity.trim()) {
    failIdentity(
      'INCOMPLETE_IDENTITY',
      'observation observerIdentityがありません。',
      'observation.observerIdentity',
    );
  }
  const reportedPackageSha256 = normalizeSha256(
    observation.reportedPackageSha256,
    'observation.reportedPackageSha256',
  );
  if (reportedPackageSha256 !== packageSha256) {
    failIdentity(
      'REPORTED_PACKAGE_HASH_MISMATCH',
      '報告されたpackage SHA-256が実ファイルと一致しません。',
      'observation.reportedPackageSha256',
    );
  }
  if (!['PASS', 'FAIL', 'HOLD'].includes(observation.result)) {
    failIdentity(
      'UNSUPPORTED_OBSERVATION_RESULT',
      'observation resultはPASS / FAIL / HOLDのいずれかである必要があります。',
      'observation.result',
    );
  }
  return reportedPackageSha256;
}

function safeComponent(component, options = {}) {
  if (!component || typeof component !== 'object' || Array.isArray(component)) return null;
  const normalized = {
    status: typeof component.status === 'string' ? component.status : null,
    basis: typeof component.basis === 'string' ? component.basis : null,
  };
  if (options.detailLevel) {
    normalized.detailLevel = typeof component.detailLevel === 'string'
      ? component.detailLevel
      : null;
  }
  if (options.replay) {
    normalized.replayedOnCurrentExactPackageThisTurn =
      component.replayedOnCurrentExactPackageThisTurn === true;
  }
  return normalized;
}

function evaluateObservation(observation) {
  const packageLaunch = safeComponent(observation.packageLaunch);
  const majorOperations = safeComponent(observation.majorOperations, { detailLevel: true });
  const saveObservation = safeComponent(observation.saveObservation, { replay: true });
  const persistenceAfterExitAndRestart = safeComponent(
    observation.persistenceAfterExitAndRestart,
    { replay: true },
  );
  const inheritanceAccepted =
    observation.persistenceEvidenceReuse?.explicitlyAcceptedBySupervisor === true;
  const behaviorObserved = packageLaunch?.status === 'pass'
    && packageLaunch.basis === CURRENT_USER_BASIS
    && majorOperations?.status === 'pass'
    && majorOperations.basis === CURRENT_USER_BASIS;

  const normalized = {
    packageLaunch,
    majorOperations,
    saveObservation,
    persistenceAfterExitAndRestart,
    persistenceEvidenceReuse: {
      explicitlyAcceptedBySupervisor: inheritanceAccepted,
    },
    behaviorObserved,
    currentPackagePersistenceReplayPerformed:
      saveObservation?.replayedOnCurrentExactPackageThisTurn === true
      && persistenceAfterExitAndRestart?.replayedOnCurrentExactPackageThisTurn === true,
  };

  if (observation.result === 'FAIL') {
    return {
      normalized,
      humanGateStatus: 'fail',
      evidenceGrade: 'observed_user_reported',
      decision: {
        overall: BLOCKED,
        rationaleJa: 'Electron観察がFAILとして報告されたため、内部リリースレビューへ進めません。',
        blockingGates: ['humanGates.electronObservation'],
      },
      incompleteReasons: [],
    };
  }

  if (observation.result === 'HOLD') {
    return {
      normalized,
      humanGateStatus: 'pending',
      evidenceGrade: 'observed_user_reported',
      decision: {
        overall: HOLD,
        rationaleJa: 'Electron観察がHOLDとして報告されています。',
        blockingGates: ['humanGates.electronObservation'],
      },
      incompleteReasons: [],
    };
  }

  const requiredPassFacts = [
    [packageLaunch?.status === 'pass', 'packageLaunch.status=pass'],
    [packageLaunch?.basis === CURRENT_USER_BASIS, 'packageLaunch.basis=current_user_report'],
    [majorOperations?.status === 'pass', 'majorOperations.status=pass'],
    [majorOperations?.basis === CURRENT_USER_BASIS, 'majorOperations.basis=current_user_report'],
    [majorOperations?.detailLevel === 'aggregate_only', 'majorOperations.detailLevel=aggregate_only'],
    [saveObservation?.status === 'pass', 'saveObservation.status=pass'],
    [saveObservation?.basis === INHERITED_PERSISTENCE_BASIS, `saveObservation.basis=${INHERITED_PERSISTENCE_BASIS}`],
    [saveObservation?.replayedOnCurrentExactPackageThisTurn === false, 'saveObservation.replayed=false'],
    [persistenceAfterExitAndRestart?.status === 'pass', 'persistenceAfterExitAndRestart.status=pass'],
    [persistenceAfterExitAndRestart?.basis === INHERITED_PERSISTENCE_BASIS, `persistenceAfterExitAndRestart.basis=${INHERITED_PERSISTENCE_BASIS}`],
    [persistenceAfterExitAndRestart?.replayedOnCurrentExactPackageThisTurn === false, 'persistenceAfterExitAndRestart.replayed=false'],
    [inheritanceAccepted, 'persistenceEvidenceReuse.explicitlyAcceptedBySupervisor=true'],
    [typeof observation.summaryJa === 'string' && observation.summaryJa.trim().length > 0, 'summaryJa supplied'],
  ];
  const incompleteReasons = requiredPassFacts
    .filter(([satisfied]) => !satisfied)
    .map(([, label]) => label);

  if (incompleteReasons.length > 0) {
    return {
      normalized,
      humanGateStatus: 'pending',
      evidenceGrade: 'mixed_observed_and_inherited',
      decision: {
        overall: HOLD,
        rationaleJa: `PASS報告の必要条件が不足しています: ${incompleteReasons.join(', ')}`,
        blockingGates: ['humanGates.electronObservation'],
      },
      incompleteReasons,
    };
  }

  return {
    normalized,
    humanGateStatus: 'pass',
    evidenceGrade: 'mixed_observed_and_inherited',
    decision: {
      overall: READY,
      rationaleJa: '現在報告された起動・主要操作と、明示承認された継承保存証拠がexact package identityへ結び付きました。',
      blockingGates: [],
    },
    incompleteReasons: [],
  };
}

function renderInternalReviewMarkdown(review, observationEvidence) {
  const h1Text = review.derivativeDecision.overall === READY
    ? 'H1はlatest user / Web supervisor decisionの範囲で受理されています。'
    : 'H1は未成立で、internal release reviewへは進めません。';
  const launchText = observationEvidence.packageLaunch?.status === 'pass'
    ? 'package起動は、このexact packageに対する今回のuser reportでpassです。'
    : 'package起動のpass条件は未成立です。';
  const operationsText = observationEvidence.majorOperations?.status === 'pass'
    ? '主要操作はaggregate-onlyの今回報告でpassです。個別controlを網羅確認したとは扱いません。'
    : '主要操作のpass条件は未成立です。';
  const persistenceText = observationEvidence.saveObservation?.status === 'pass'
    && observationEvidence.saveObservation?.basis === INHERITED_PERSISTENCE_BASIS
    && observationEvidence.persistenceAfterExitAndRestart?.status === 'pass'
    && observationEvidence.persistenceAfterExitAndRestart?.basis === INHERITED_PERSISTENCE_BASIS
    ? '保存・終了後再起動の復帰は、過去の反復user verificationを継承したpassです。'
    : '保存・再起動復帰のpass条件は未成立です。';

  return `# Electron観察取り込み / 内部リリースレビュー

生成日時: ${review.generatedAt}

## 判断

**${review.derivativeDecision.overall}** — ${review.derivativeDecision.rationaleJa}

${h1Text} このderivative判断は、外部リリース承認ではありません。

## 観察の由来

- original user statement: ${observationEvidence.originalUserStatement || '(not supplied)'}
- ${launchText}
- ${operationsText}
- ${persistenceText}
- **このturnではcurrent exact-packageの保存・再起動復帰をreplayしていません。**
- Web比較は \`${observationEvidence.webComparison}\` で、未比較の詳細を補いません。

## Identity

| 項目 | 値 |
| --- | --- |
| Base product commit | \`${review.baseProductCommit}\` |
| Base checkpoint SHA-256 | \`${review.baseCheckpoint.sha256AfterGeneration}\` |
| Package SHA-256 | \`${review.package.sha256AfterGeneration}\` |
| Identity matched | \`${review.identityVerification.matched}\` |
| Original decision | \`${review.originalCheckpointDecision}\` |
| Derivative human gate | \`${review.derivativeHumanGate.status}\` |

## 残る境界

\`READY_FOR_INTERNAL_RELEASE_REVIEW\` はbounded internal reviewへ進める意味だけを持ちます。
signing、tagging、publication、external distributionは引き続きlockedです。Documents体感レビュー等の
nonblocking debtは、release identityと混同せず別レーンで扱います。
`;
}

function ingestObservation(options) {
  const checkpointPath = path.resolve(options.checkpointPath || '');
  const packagePath = path.resolve(options.packagePath || '');
  const observationPath = path.resolve(options.observationPath || '');
  const outDir = path.resolve(options.outDir || '');
  const synthesisToolCommit = options.synthesisToolCommit;
  const now = options.now || (() => new Date().toISOString());

  for (const [label, filePath] of [
    ['checkpoint', checkpointPath],
    ['package', packagePath],
    ['observation', observationPath],
  ]) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      failIdentity('MISSING_INPUT', `${label} inputが見つかりません。`, label);
    }
  }
  if (typeof synthesisToolCommit !== 'string' || !/^[0-9a-f]{40}$/i.test(synthesisToolCommit)) {
    failIdentity(
      'INCOMPLETE_TOOL_IDENTITY',
      'synthesisToolCommitが有効なGit commitではありません。',
      'synthesisToolCommit',
    );
  }
  assertOutputBoundary(checkpointPath, outDir);

  const checkpointShaBefore = sha256File(checkpointPath);
  const packageShaBefore = sha256File(packagePath);
  const checkpoint = readJson(checkpointPath, 'checkpoint');
  const observation = readJson(observationPath, 'observation');
  const identity = validateBaseIdentity(
    checkpoint,
    checkpointPath,
    packagePath,
    packageShaBefore,
  );
  const reportedPackageSha256 = validateObservationIdentity(observation, packageShaBefore);
  const evaluation = evaluateObservation(observation);
  const ingestedAt = now();

  const electronObservation = {
    schemaVersion: '1.0.0',
    ingestedAt,
    originalUserStatement: observation.summaryJa,
    observerIdentity: observation.observerIdentity,
    evidenceGrade: 'observed_user_reported',
    result: observation.result,
    reportedAt: observation.reportedAt ?? null,
    observedAt: observation.observedAt ?? null,
    observedAtPrecision: observation.observedAtPrecision ?? null,
    reportIngestedAt: ingestedAt,
    packageIdentity: {
      reportedPackageSha256,
      actualPackageSha256: packageShaBefore,
      packageSha256Matched: true,
    },
    behaviorObserved: evaluation.normalized.behaviorObserved,
    packageLaunch: evaluation.normalized.packageLaunch,
    majorOperations: evaluation.normalized.majorOperations,
    saveObservation: evaluation.normalized.saveObservation,
    persistenceAfterExitAndRestart: evaluation.normalized.persistenceAfterExitAndRestart,
    persistenceEvidenceReuse: evaluation.normalized.persistenceEvidenceReuse,
    currentPackagePersistenceReplayPerformed:
      evaluation.normalized.currentPackagePersistenceReplayPerformed,
    webComparison: observation.webComparison ?? null,
    blockingFinding: observation.blockingFinding ?? null,
    visualFindings: observation.visualFindings ?? null,
    incompleteReasons: evaluation.incompleteReasons,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'electron-observation.json'),
    `${JSON.stringify(electronObservation, null, 2)}\n`,
    'utf8',
  );

  const checkpointShaAfterObservation = sha256File(checkpointPath);
  const packageShaAfterObservation = sha256File(packagePath);
  if (checkpointShaAfterObservation !== checkpointShaBefore) {
    throw new ObservationIngestionError(
      'BASE_CHECKPOINT_MUTATED',
      'generation中にoriginal checkpointが変化しました。',
      ['baseCheckpoint.immutable'],
    );
  }
  if (packageShaAfterObservation !== packageShaBefore) {
    throw new ObservationIngestionError(
      'PACKAGE_MUTATED',
      'generation中にpackage identityが変化しました。',
      ['package.immutable'],
    );
  }

  const packageStat = fs.statSync(packagePath);
  const internalReview = {
    schemaVersion: '1.0.0',
    generatedAt: ingestedAt,
    baseProductCommit: identity.source.commit,
    baseCheckpoint: {
      path: checkpointPath,
      sha256BeforeGeneration: checkpointShaBefore,
      sha256AfterGeneration: checkpointShaAfterObservation,
      immutable: checkpointShaBefore === checkpointShaAfterObservation,
    },
    package: {
      path: packagePath,
      checkpointRelativePath: identity.packageEvidence.path,
      sizeBytes: packageStat.size,
      sha256BeforeGeneration: packageShaBefore,
      sha256AfterGeneration: packageShaAfterObservation,
    },
    synthesisToolCommit,
    identityVerification: {
      matched: true,
      checkpointPackageSha256: identity.checkpointPackageSha,
      requiredIdentitySha256: identity.electronGate.requiredIdentity.toLowerCase(),
      reportedPackageSha256,
      actualPackageSha256: packageShaBefore,
    },
    observationProvenance: {
      observerIdentity: observation.observerIdentity,
      evidenceGrade: evaluation.evidenceGrade,
      currentObservationEvidenceGrade: 'observed_user_reported',
      currentLaunchAndMajorOperations: 'observed_user_reported',
      saveAndRestartPersistence:
        evaluation.normalized.saveObservation?.basis === INHERITED_PERSISTENCE_BASIS
        && evaluation.normalized.persistenceAfterExitAndRestart?.basis === INHERITED_PERSISTENCE_BASIS
          ? INHERITED_PERSISTENCE_BASIS
          : 'not_established',
      inheritedPersistenceExplicitlyAcceptedBySupervisor:
        evaluation.normalized.persistenceEvidenceReuse.explicitlyAcceptedBySupervisor,
      currentExactPackagePersistenceReplayPerformed:
        evaluation.normalized.currentPackagePersistenceReplayPerformed,
      observedAt: electronObservation.observedAt,
      observedAtPrecision: electronObservation.observedAtPrecision,
      reportIngestedAt: ingestedAt,
      webComparison: electronObservation.webComparison,
    },
    originalCheckpointDecision: checkpoint.decision.overall,
    derivativeHumanGate: {
      status: evaluation.humanGateStatus,
      evidenceGrade: evaluation.evidenceGrade,
      behaviorObserved: evaluation.normalized.behaviorObserved,
      currentExactPackagePersistenceReplayPerformed:
        evaluation.normalized.currentPackagePersistenceReplayPerformed,
    },
    derivativeDecision: evaluation.decision,
    remainingNonblockingDebts: Array.isArray(checkpoint.debts)
      ? checkpoint.debts.filter((debt) => debt?.blocking !== true)
      : [],
    boundary: {
      readyMeaning: 'ready_for_internal_release_review_only',
      publicReleaseApproved: false,
      signing: 'locked',
      tagging: 'locked',
      publication: 'locked',
      externalDistribution: 'locked',
    },
  };
  const markdown = renderInternalReviewMarkdown(internalReview, electronObservation);

  fs.writeFileSync(
    path.join(outDir, 'internal-release-review.json'),
    `${JSON.stringify(internalReview, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(path.join(outDir, 'INTERNAL_RELEASE_REVIEW.md'), markdown, 'utf8');

  const checkpointShaFinal = sha256File(checkpointPath);
  const packageShaFinal = sha256File(packagePath);
  if (checkpointShaFinal !== checkpointShaBefore || packageShaFinal !== packageShaBefore) {
    throw new ObservationIngestionError(
      'IMMUTABLE_BASE_CHANGED',
      'derivative generation後のbase checkpoint/package identityが一致しません。',
      ['immutableBase'],
    );
  }

  return {
    outDir,
    electronObservation,
    internalReview,
    markdown,
  };
}

module.exports = {
  BLOCKED,
  CURRENT_USER_BASIS,
  HOLD,
  INHERITED_PERSISTENCE_BASIS,
  ObservationIngestionError,
  READY,
  evaluateObservation,
  ingestObservation,
  renderInternalReviewMarkdown,
};
