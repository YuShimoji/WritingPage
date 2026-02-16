# REPORT_ORCH CLI 横展開テンプレート

このドキュメントは、**shared-workflows を導入している他プロジェクト**で REPORT_ORCH CLI を利用するための導入手順とベストプラクティスを提供します。

## 前提条件

- **shared-workflows の submodule 導入が完了していること**
  - `.shared-workflows/` ディレクトリが存在し、submodule として管理されていること
  - 詳細は `docs/CENTRAL_REPO_REF.md` を参照

## 導入手順

### 1. 前提確認

REPORT_ORCH CLI は `.shared-workflows/scripts/report-orch-cli.js` に実装されています。以下のコマンドで存在を確認してください:

```bash
# Windows (PowerShell)
Test-Path .shared-workflows/scripts/report-orch-cli.js

# Linux/macOS
test -f .shared-workflows/scripts/report-orch-cli.js && echo "OK" || echo "NG"
```

### 2. 基本的な使用方法

REPORT_ORCH CLI は、Orchestrator レポートを自動生成・検証・HANDOVER 同期まで行います。

#### 基本的な実行例

```bash
node .shared-workflows/scripts/report-orch-cli.js \
  --issue "AI Reporting Improvement" \
  --mode orchestration \
  --summary "Stateサマリを記載" \
  --sync-handover
```

このコマンドは以下を実行します:

- `docs/inbox/REPORT_ORCH_YYYYMMDD_HHMM.md` をテンプレートから生成
- `REPORT_CONFIG.yml` に基づき自動検証を実行
- `docs/HANDOVER.md` の Latest Orchestrator Report セクションを自動更新

#### オプション一覧

| オプション               | 説明                                                       | デフォルト値                            |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------- |
| `--mode <mode>`          | Report mode                                                | `orchestration`                         |
| `--issue <text>`         | Related Issue/PR text                                      | `N/A`                                   |
| `--actor <name>`         | Actor name                                                 | `Cascade`                               |
| `--timestamp <ISO>`      | ISO8601 string for Timestamp header                        | 現在時刻                                |
| `--tz-offset <minutes>`  | Offset minutes for timestamp/file naming                   | `540` (+09:00)                          |
| `--skip-validate`        | Skip automatic report validation                           | -                                       |
| `--output <path>`        | Custom output path                                         | `docs/inbox/REPORT_ORCH_<timestamp>.md` |
| `--sync-handover`        | Update docs/HANDOVER.md Latest Orchestrator Report section | -                                       |
| `--sync-context`         | Update AI_CONTEXT.md basic info (Timestamp, Progress)      | -                                       |
| `--handover-path <path>` | Custom HANDOVER path                                       | `docs/HANDOVER.md`                      |
| `--context-path <path>`  | Custom AI_CONTEXT path                                     | `AI_CONTEXT.md`                         |
| `--progress <percent>`   | Progress percentage to set in AI_CONTEXT.md                | -                                       |
| `--worker-status <text>` | Append worker status to AI_CONTEXT.md                      | -                                       |
| `--summary <text>`       | Summary text when syncing HANDOVER                         | -                                       |

### 3. 使用例

#### 例1: 基本的なレポート生成（検証付き）

```bash
node .shared-workflows/scripts/report-orch-cli.js \
  --issue "Feature Implementation" \
  --mode orchestration \
  --summary "新機能実装完了。テスト通過。" \
  --sync-handover
```

#### 例2: ドラフト生成（検証スキップ）

```bash
node .shared-workflows/scripts/report-orch-cli.js \
  --issue "Draft Report" \
  --mode orchestration \
  --skip-validate \
  --output docs/inbox/REPORT_ORCH_DRAFT.md
```

#### 例3: AI_CONTEXT.md も同時更新

```bash
node .shared-workflows/scripts/report-orch-cli.js \
  --issue "Progress Update" \
  --mode orchestration \
  --summary "進捗更新: タスク完了" \
  --sync-handover \
  --sync-context \
  --progress 75 \
  --worker-status "worker_feature: completed"
```

#### 例4: カスタムパス指定

```bash
node .shared-workflows/scripts/report-orch-cli.js \
  --issue "Custom Path Test" \
  --mode orchestration \
  --output docs/custom/REPORT_ORCH_CUSTOM.md \
  --handover-path docs/CUSTOM_HANDOVER.md \
  --context-path CUSTOM_CONTEXT.md
```

### 4. 手動検証（CLI を使わない場合）

手動でテンプレートを貼り付けた場合でも、生成後に必ず検証を実行してください:

```bash
# submodule がある場合
node .shared-workflows/scripts/report-validator.js <report_path>

# submodule がない場合（プロジェクト側にコピーした場合）
node scripts/report-validator.js <report_path> REPORT_CONFIG.yml .
```

**重要**: `node scripts/report-validator.js` を使う場合は、`node scripts/report-validator.js <report> REPORT_CONFIG.yml .` のように **config パスと project root を必ず指定**してください。

## ベストプラクティス

### 1. レポート生成のタイミング

- **Orchestrator レポート**: Phase 6（Orchestrator Report）で生成
- **Worker レポート**: Phase 4（納品 & 検証）で生成（手動または CLI 使用）

### 2. 検証の徹底

- `--skip-validate` はドラフト生成時のみ使用
- 本番レポートは必ず検証を実行
- 検証エラーがある場合は修正して再納品

### 3. HANDOVER 同期の活用

- `--sync-handover` オプションを使用することで、`docs/HANDOVER.md` の Latest Orchestrator Report セクションが自動更新されます
- 手動更新の抜け漏れを防ぐため、可能な限り CLI を使用してください

### 4. AI_CONTEXT 同期の活用

- `--sync-context` オプションを使用することで、`AI_CONTEXT.md` の基本情報（Timestamp, Progress）が自動更新されます
- Worker 完了時に `--worker-status` を指定することで、Worker ステータスも記録できます

### 5. タイムゾーン設定

- デフォルトは `+09:00`（`--tz-offset 540`）
- 他のタイムゾーンを使用する場合は、`--tz-offset` で分単位のオフセットを指定
  - 例: `--tz-offset -300`（UTC-5:00）

### 6. エラーハンドリング

- CLI 実行時にエラーが発生した場合、エラーメッセージを確認してください
- よくあるエラー:
  - 出力先ファイルが既に存在する: `--output` で別名を指定
  - HANDOVER.md が見つからない: `--handover-path` で正しいパスを指定
  - テンプレートが見つからない: `.shared-workflows/` が正しく導入されているか確認

## トラブルシューティング

### 問題1: `report-orch-cli.js` が見つからない

**原因**: `.shared-workflows/` が submodule として導入されていない、またはパスが間違っている

**解決策**:

1. `.shared-workflows/` が存在するか確認: `Test-Path .shared-workflows`（PowerShell）または `test -d .shared-workflows`（Linux/macOS）
2. submodule が正しく初期化されているか確認: `git submodule status`
3. submodule を更新: `git submodule update --init --recursive`

### 問題2: 検証エラーが発生する

**原因**: レポートのフォーマットが `REPORT_CONFIG.yml` の要件を満たしていない

**解決策**:

1. 検証エラーの詳細を確認
2. 必須ヘッダー（例: `## 概要`, `## 現状`, `## 次のアクション`）が含まれているか確認
3. エラー内容に従って修正

### 問題3: HANDOVER 同期が失敗する

**原因**: `docs/HANDOVER.md` に「## Latest Orchestrator Report」セクションが存在しない

**解決策**:

1. `docs/HANDOVER.md` を確認
2. 「## Latest Orchestrator Report」セクションを追加
3. または `--handover-path` で正しいパスを指定

## 関連ドキュメント

- **運用者の入口**: `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md`
- **Orchestrator Protocol**: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
- **Operations Runbook**: `.shared-workflows/docs/windsurf_workflow/OPERATIONS_RUNBOOK.md`
- **中央リポジトリ参照**: `docs/CENTRAL_REPO_REF.md`

## 更新履歴

- 2026-01-04: 初版作成（REPORT_ORCH CLI 横展開テンプレート）
