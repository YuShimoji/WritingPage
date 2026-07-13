const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const EVIDENCE_STATES = new Set([
  'pass',
  'fail',
  'pending',
  'stale',
  'blocked',
  'not_run',
]);

function assertEvidenceState(status, label) {
  if (!EVIDENCE_STATES.has(status)) {
    throw new Error(`${label} has unsupported evidence status: ${status}`);
  }
}

function synthesizeDecision(checkpoint) {
  const { webAcceptance, captures, package: packageEvidence, humanGates } = checkpoint;
  if (checkpoint.source && checkpoint.source.dirty) {
    return {
      overall: 'BLOCKED',
      rationaleJa: 'source.dirty=true のため、clean commitに結び付いたrelease evidenceではありません。',
      blockingGates: ['source.clean'],
    };
  }
  const machineGates = [
    ['webAcceptance.localBoundedReplay', webAcceptance.localBoundedReplay.status],
    ['captures', captures.status],
    ['package', packageEvidence.status],
  ];
  machineGates.forEach(([label, status]) => assertEvidenceState(status, label));
  assertEvidenceState(humanGates.electronObservation.status, 'humanGates.electronObservation');

  const blocking = machineGates.filter(([, status]) => status !== 'pass');
  if (blocking.length > 0) {
    return {
      overall: 'BLOCKED',
      rationaleJa: `機械ゲートが未成立: ${blocking.map(([label, status]) => `${label}=${status}`).join(', ')}`,
      blockingGates: blocking.map(([label]) => label),
    };
  }

  if (humanGates.electronObservation.status === 'pass') {
    return {
      overall: 'READY_FOR_INTERNAL_RELEASE_REVIEW',
      rationaleJa: 'Web・capture・package・Electron観察の必須ゲートが揃っています。',
      blockingGates: [],
    };
  }

  return {
    overall: 'HOLD_FOR_ELECTRON_OBSERVATION',
    rationaleJa: 'Web・capture・packageは成立していますが、Electron実機観察は人手待ちです。',
    blockingGates: ['humanGates.electronObservation'],
  };
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function listFilesRecursive(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const result = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else result.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'));
    }
  };
  visit(rootDir);
  return result.sort();
}

function renderCheckpointMarkdown(checkpoint) {
  const commandRows = checkpoint.webAcceptance.localBoundedReplay.commands
    .map((item) => `| \`${item.command}\` | ${item.status} | ${item.durationMs} ms |`)
    .join('\n');
  const captureInventory = checkpoint.captures.artifacts
    .map((item) => `- \`${item}\``)
    .join('\n');
  const debts = checkpoint.debts
    .map((debt) => `- ${debt.nameJa}: ${debt.impactJa}（担当: ${debt.owner}、再確認: ${debt.revisitTriggerJa}）`)
    .join('\n');

  return `# リリース準備チェックポイント

生成日時: ${checkpoint.createdAt}

## 判断

**${checkpoint.decision.overall}** — ${checkpoint.decision.rationaleJa}

この判断は Web 自動検証、capture、package build、Electron人手観察を別ゲートとして扱います。
実行ファイルの存在や画像取得だけで、Electronの動作確認済みとは判定しません。

## 対象ソース

| 項目 | 値 |
| --- | --- |
| Branch | \`${checkpoint.source.branch}\` |
| Commit | \`${checkpoint.source.commit}\` |
| Dirty | \`${checkpoint.source.dirty}\` |
| Node | \`${checkpoint.environment.node}\` |
| npm | \`${checkpoint.environment.npm}\` |
| Platform | \`${checkpoint.environment.platform}\` |

## Web受入

既存remote full acceptanceは、run \`${checkpoint.webAcceptance.remoteFull.runId}\` / commit
\`${checkpoint.webAcceptance.remoteFull.commit}\` のrepository記録を参照した evidence です。
今回のローカルfull Playwright実行ではありません。

| ローカルbounded replay | 状態 | 所要時間 |
| --- | --- | --- |
${commandRows}

未再実行: ${checkpoint.webAcceptance.notRerun.map((item) => `\`${item}\``).join(', ')}

## Capture evidence

| 項目 | 値 |
| --- | --- |
| 状態 | ${checkpoint.captures.status} |
| Owner | \`${checkpoint.captures.owner}\` |
| Source commit | \`${checkpoint.captures.sourceCommit}\` |
| Source dirty | \`${checkpoint.captures.sourceDirty}\` |
| Mode / root | \`${checkpoint.captures.mode}\` / \`${checkpoint.captures.root}\` |
| Created | ${checkpoint.captures.createdAt} |

${captureInventory}

## Electron directory package

| 項目 | 値 |
| --- | --- |
| 状態 | ${checkpoint.package.status} |
| Path | \`${checkpoint.package.path}\` |
| Size | ${checkpoint.package.sizeBytes} bytes |
| Modified | ${checkpoint.package.modifiedAt} |
| SHA-256 | \`${checkpoint.package.sha256}\` |
| Source commit / dirty | \`${checkpoint.package.sourceCommit}\` / \`${checkpoint.package.sourceDirty}\` |

package buildの成功は、Electron上の挙動を人間が観察した証拠ではありません。

## 人手ゲート

Electron観察: **${checkpoint.humanGates.electronObservation.status}**

次の操作は \`ELECTRON_OPERATOR_REVIEW.md\` に記載しています。観察者、日時、上記SHA-256と
一致するpackage identity、結果が記録されるまで、このgateはpendingのままです。

## 非ブロッキングdebt

${debts}
`;
}

function renderElectronOperatorReview(checkpoint) {
  return `# Electron package オペレーター確認

このシートは人間によるpackage-only観察のためのものです。生成時点の状態は
**pending** であり、以下の操作を実施してもcheckpoint JSONは自動的にobservedへ変わりません。

## 確認対象

- 実行ファイル: \`${checkpoint.package.path}\`
- Source commit: \`${checkpoint.source.commit}\`
- SHA-256: \`${checkpoint.package.sha256}\`
- 起動コマンド: \`npm run app:open:package\`

## 観察すること

1. packageがエラーなしで起動し、Rich editingの執筆面が表示される。
2. テスト用の短い文字を入力し、保存状態が更新される。実原稿は使わない。
3. 一度終了して同じpackageを再起動し、入力したテスト用文字が復帰する。

Webブラウザ、Playwright画像、exeの存在だけを結果の代用にしないでください。

## 記録欄

- observer:
- observedAt:
- packageSha256: ${checkpoint.package.sha256}
- result: PASS / FAIL / HOLD
- findings:
- Webとの差分（ある場合）:

FAILの場合は、再現手順、実際の結果、期待結果をfindingsへ残してください。
`;
}

module.exports = {
  EVIDENCE_STATES,
  listFilesRecursive,
  renderCheckpointMarkdown,
  renderElectronOperatorReview,
  sha256File,
  synthesizeDecision,
};
