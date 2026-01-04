# orchestrator-output-validator.js 使用方法

## 概要

`orchestrator-output-validator.js` は、Orchestratorのチャット出力を検証し、固定5セクション形式が守られているか確認するスクリプトです。

## 配置場所

- 中央リポジトリ: `.shared-workflows/scripts/orchestrator-output-validator.js`
- プロジェクト側: `scripts/orchestrator-output-validator.js`（コピー済み）

## 機能

### 1. Orchestrator出力の検証

Orchestratorのチャット出力が固定5セクション形式（現状、次のアクション、ガイド、メタプロンプト再投入条件、改善提案）を守っているか検証します。

**検証項目**:
- 必須セクションの存在確認（5セクションすべて）
- セクションの順序確認
- 「次のアクション」セクションにユーザー返信テンプレ（完了判定 + 選択肢1-3）が含まれているか
- 禁止セクション（作業評価、完了した作業、進め方の評価、問題点・改善点、結論）の確認

## 使用方法

### コマンドライン実行

**基本的な使用方法**:

```bash
# ファイルパスを指定
node scripts/orchestrator-output-validator.js <output_file>

# 標準入力から読み込む
echo "## 現状\n..." | node scripts/orchestrator-output-validator.js

# テキストを直接指定
node scripts/orchestrator-output-validator.js "## 現状\n..."
```

**使用例**:

```bash
# ファイルから検証
node scripts/orchestrator-output-validator.js orchestrator-output.txt

# パイプで検証
cat orchestrator-output.txt | node scripts/orchestrator-output-validator.js
```

### Node.jsスクリプト内での使用

**使用例（Node.jsスクリプト内）**:

```javascript
const { validateOrchestratorOutput } = require('./scripts/orchestrator-output-validator.js');

// Orchestrator出力を検証
const output = `## 現状\n...\n## 次のアクション\n...`;
const result = validateOrchestratorOutput(output);

if (result.valid) {
  console.log('検証成功');
} else {
  console.error('検証失敗:', result.errors);
  console.warn('警告:', result.warnings);
}
```

## 固定5セクション形式

Orchestratorのチャット出力は、以下の5セクションをこの順番で含む必要があります:

1. `## 現状`
2. `## 次のアクション`
3. `## ガイド`
4. `## メタプロンプト再投入条件`
5. `## 改善提案（New Feature Proposal）`

### 「次のアクション」セクションの要件

「次のアクション」セクションには、以下の要素が含まれている必要があります:

- **選択肢1-3**: ユーザーが選択できる選択肢（例: `選択肢1: ...`、`[選択肢1] ...`、`1) ...`）
- **完了判定**: 完了/未完了の判定（例: `完了 / 未完了`、`完了判定`、`【確認】`）

## 終了コード

- `0`: 検証成功（固定5セクション形式が正しく守られている）
- `1`: 検証失敗（必須セクション欠落など）

## 出力例

**検証成功時**:

```
検証成功: 固定5セクション形式が正しく守られています
```

**検証失敗時**:

```
検証失敗:
  ERROR: 必須セクション '現状' が欠落しています
  ERROR: 必須セクション '次のアクション' が欠落しています
検証失敗: 2 件のエラーが見つかりました
```

**警告がある場合**:

```
検証成功: 固定5セクション形式が正しく守られています
  WARN: セクション 'ガイド' が空です
```

## 注意事項

- スクリプトは固定5セクション形式のみを検証します
- 追加セクション（作業評価、完了した作業など）は警告として検出されます
- 「次のアクション」セクションにユーザー返信テンプレが含まれていない場合、エラーとして検出されます

## 統合例

既存のスクリプト（例: `orchestrator-audit.js`）と統合する場合:

```javascript
const { validateOrchestratorOutput } = require('./scripts/orchestrator-output-validator.js');
const fs = require('fs');

function validateOrchestratorReport(reportPath) {
  const content = fs.readFileSync(reportPath, 'utf8');
  const result = validateOrchestratorOutput(content);
  
  if (!result.valid) {
    console.error('Orchestrator出力の検証に失敗しました');
    result.errors.forEach(err => console.error(`  ERROR: ${err}`));
    result.warnings.forEach(warn => console.warn(`  WARN: ${warn}`));
    return false;
  }
  
  return true;
}
```

## 参考

- 中央リポジトリ: `https://github.com/YuShimoji/shared-workflows`
- ローカルパス（submodule）: `.shared-workflows/`
- 関連スクリプト: `scripts/report-validator.js`（レポートファイル検証用）
