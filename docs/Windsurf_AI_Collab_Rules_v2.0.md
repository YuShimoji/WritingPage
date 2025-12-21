# Windsurf Collaborative Playbook v2.0

> 人間と AI が共創し、スピードと品質を両立するための標準ルールセット。各プロジェクトは本書を SSOT（Single Source of Truth）として参照し、必要に応じてプロジェクト側リポジトリで微調整してください。

---

## 0. マニュアルの使い方

- **対象**: コード生成、テスト、CI/CD、ドキュメント、インフラ運用など、開発ライフサイクル全般で AI を活用するチーム。
- **必読ファイル**:
  - `AI_CONTEXT.md`: 作業状態とモード、レポートスタイルを同期するための現場用ファイル。
  - `REPORT_CONFIG.yml`: レポーティング/創造性の既定値、禁止表現、トリガー、プロンプト上書きを定義。
  - `docs/PROMPT_TEMPLATES.md`: スタイル別・リスク別に最適化されたプロンプトテンプレート集。
  - `docs/CENTRAL_REPO_REF.md`: 中央リポジトリ（SSOT）の参照/導入手順。
  - `AI_FEEDBACK_LOG.md`: 応答評価を記録し、適応学習に活用するログ。
- **運用サイクル**: 「起動 → モード選択 → ワークフロー実施 → レポート生成 → フィードバック記録 → 改善」というループで継続的に自治度を高める。

---

## 1. 起動手順と運用モード

### 1.1 クイックスタート

1. `AI_CONTEXT.md` を読み込み、`mode` と `report_style` を確認/設定する。
2. `scripts/detect-project-type.js` を実行し、プロジェクトタイプ（`standard`/`web`/`unity` など）を判定。
3. `scripts/report-style-hint.js <style>` を実行し、`REPORT_HINT.md` を生成。
4. 必要に応じて `scripts/creativity-booster.js` と `scripts/adapt-response.js` を実行し、提示されたヒントを対話冒頭で共有。
5. ワークフローに着手し、区切りごとに `AI_CONTEXT.md` とログ類を更新。

### 1.2 運用モード

- **Standard Mode**: Issue 駆動で着実に進める。Tier 2/3 作業の既定モード。
- **Fast Mode**: Web/Unity 等でスピード重視。ダイレクトコミットとテスト閾値緩和を許容するが、`AI_CONTEXT.md` で合意が必要。
- **Custom Mode**: `AI_CONTEXT.md` に `mode: custom` を記載し、`REPORT_CONFIG.yml` の `prompt_overrides` と `creativity_triggers` を組み合わせてプロジェクト特化モードを構築。

---

## 2. 権限モデルとリスク管理

### 2.1 Tiered Delegation

- **Tier 1（低リスク）**: ドキュメント更新、軽微なリファクタ、スタイル修正。Pre-flight 合格時は AI が自律実行し、自動マージも許容。
- **Tier 2（中リスク）**: 機能実装、仕様追加、主要リファクタ。AI は PR を作成し、品質ゲート（テスト ≥80%、脆弱性 High/Critical=0）を満たした場合に自動マージ可。
- **Tier 3（高リスク）**: 本番データ操作、インフラ変更、リリース判断。AI は提案まで。人間による二段階承認とバックアウトプランが必須。

### 2.2 自律性と安全装置

- Assume Yes は Tier 1 に限定。Tier 2/3 では `AI_CONTEXT.md` に承認者・条件を記録する。
- すべてのオペレーションは PR/ログで追跡し、緊急時は「例外条項」を記録して逸脱理由と是正策を残す。
- `creativity_triggers` を適用する場合でも、セキュリティや規約違反が懸念される提案は自動的に抑制する（スクリプト側でフィルタリング）。

---

## 3. エンドツーエンド ワークフロー

1. **Ideation**: AI はコード分析/抽象要求/改善提案に基づき Issue を起票。`Goal`、`DoD`、`Tier`、影響範囲を必須記載。
2. **Planning**: タスク分解、サブタスク化、Patch スコープ決定。`AI_CONTEXT.md` の Backlog を同期。
3. **Implementation**: ガイドラインに従いブランチ作成、コミット、ドラフトコミット活用。
4. **Verification**: Pre-flight（依存関係、Linter、テスト、セキュリティ、影響範囲）を実行。高速モード時はテスト閾値や Smoke を調整。
5. **Integration**: Tier/モードに応じて自動マージまたは承認フローへ。CI 成功をトリガーに `scripts/adapt-response.js` を再実行すると、次ラウンドのヒントを自動生成。
6. **Documentation**: `docs/` を更新し、`AI_CONTEXT.md` に中断可能点を記録。必要に応じて `AI_FEEDBACK_LOG.md` に評価を追記。

### 3.1 Mission 管理

- 長期タスクは「ミッション」と定義し、30 分以上の工程はサブミッションへ自動分割。
- `AI_CONTEXT.md` の `Backlog` と `決定事項` を更新し、別端末/別会話でもスムーズに再開できるようにする。

### 3.2 対話的管理

- チャット報告は「次の安全な中断ポイント」を明示（例: 「CI 成功後に区切り」）。
- `REPORT_HINT.md` と `CREATIVITY_HINT.md` を参照し、スタイルとトリガーに従った進捗共有を実践。
- 失敗リトライ 3 回で人間介入を促す（`AI_CONTEXT.md` と Issue にログ）。

---

## 4. レポーティングとプロンプト統制

### 4.1 レポートスタイル

- `REPORT_CONFIG.yml` の `style_presets` に基づき、`standard`/`concise`/`narrative`/`creative` 等を選択。
- `report_style` 未指定時は `default_style`（既定: `standard`）を使用。
- 各スタイルは「目的・現状・次のアクション」を必須情報とし、表現方法のみ変化させる。

### 4.2 創造性トリガー

- `creativity_triggers` でスタイルごとの追加アクションを定義。
- トリガーは `scripts/creativity-booster.js` によりランダム/重み付きで選択され、`CREATIVITY_HINT.md` に出力される。
- ハイリスク作業では、安全性チェック後にトリガーを適用するか、人間が承認するかを判断。

### 4.3 プロンプトテンプレート

- `docs/PROMPT_TEMPLATES.md` にスタイル別・Tier別テンプレートを掲載。
- `REPORT_CONFIG.yml` の `prompt_overrides` により、プロジェクト固有のプロンプトを上書き可能。
- `scripts/report-style-hint.js` はテンプレ情報を反映し、ヒント内に推奨見出しと禁止表現を提示。

### 4.4 フィードバックループ

- 応答後は `AI_FEEDBACK_LOG.md` に創造性スコア、明瞭性スコア、改善点、次回試すトリガーを記録。
- `scripts/adapt-response.js` がログを解析し、`ADAPTATION_HINT.md` に次回の推奨スタイル/トリガーを提案。

---

## 5. 自動化とスクリプト

- `scripts/detect-project-type.js`: プロジェクトタイプ判定。
- `scripts/report-style-hint.js`: `REPORT_HINT.md` 生成（スタイル/禁止表現/推奨見出し）。
- `scripts/creativity-booster.js`: `creativity_triggers` を基に `CREATIVITY_HINT.md` を生成。
- `scripts/adapt-response.js`: `AI_FEEDBACK_LOG.md` を解析し、`ADAPTATION_HINT.md` を生成。
- 追加の Pre-flight ツール（Lint/テスト/セキュリティ）はプロジェクト固有スクリプトに委譲し、本リポジトリからはガイドラインのみ提示。

---

## 6. 監査・ログ・セキュリティ

- すべての操作は JSON 監査ログに記録（timestamp, actor, issue-id, command, preflight-result）。
- ログ保持: 詳細ログ 90 日、要約ログ 長期保管。`AI_FEEDBACK_LOG.md` は長期保存推奨。
- API Key/資格情報はハードコード禁止。Pre-flight に秘匿情報スキャンを含める。
- 緊急対応時は「例外条項」をログし、逸脱理由と是正策を明記。

---

## 7. プロジェクトタイプ別ガイド

- **Standard**: Issue 駆動、Tier ガード強化、CI 完了後の自動マージ。
- **Web/Unity (Fast Mode)**:
  - ダイレクトコミット許可。テスト閾値 50% まで緩和可。
  - `creativity_triggers` を積極活用し、UI/UX 改善案や演出提案を促す。
  - 高速モード時も `AI_CONTEXT.md` の更新を省略しない。
- **Custom**: `PROJECT_TYPE` ファイルを用意し、特化ルールとスクリプトを組み合わせる。例: データサイエンス案件向けに `analysis` モードを追加。

---

## 8. 継続的改善フレーム

- **創造性メトリクス**: 新規提案数、多様性スコア、満足度（1-10）、再利用アイデア数。
- **レビュー頻度**: 月次で `AI_FEEDBACK_LOG.md` と Issue を振り返り、`REPORT_CONFIG.yml` と `PROMPT_TEMPLATES.md` を更新。
- **Issue 管理**: 改善アイデアは GitHub Issue として起票し、Kanban で進捗を可視化。`creativity_backlog` ラベルを推奨。
- **モデル差異対策**: 異なる AI モデルで同一テンプレートをテストし、差分を `AI_FEEDBACK_LOG.md` に記録。`scripts/adapt-response.js` が推奨スタイルを調整。

---

## 付録 A: `AI_CONTEXT.md` テンプレート

```markdown
# AI Context
- 最終更新: <ISO8601>
- 現在のミッション: <title> (#<issue>)
- ブランチ: <branch>
- 関連: Issue <url>, PR <url>
- 進捗: <percentage>% / ステータス: <phase>
- 次の中断可能点: <when>
- モード: <standard|fast|custom>
- レポートスタイル: <standard|concise|narrative|creative|custom>
- 使用トリガー: <trigger ids>

## 決定事項
- <decision/why>

## リスク/懸念
- <risk/mitigation>

## Backlog（将来提案）
- <idea/impact/rough-scope>
```

---

## 付録 B: Issue/PR テンプレート要約

- **Issue**: Goal / Scope / DoD / Tier / 影響範囲 / 関連リンク / 想定スタイル。
- **Pull Request**: 概要 / 変更点 / テスト / リスク / 関連 Issue / 中断可能点 / 適用トリガー。

---

## 付録 C: スクリプト クイックリファレンス

- `node scripts/detect-project-type.js`
- `node scripts/report-style-hint.js <style?>`
- `node scripts/creativity-booster.js <style?>`
- `node scripts/adapt-response.js`
- 実行結果の `.md` ファイルを対話冒頭で要約共有することを推奨。

---

## 付録 D: 創造性評価チェックリスト

- **アイデアの幅**: 代替案が複数提示されているか。
- **表現の工夫**: 比喩・ストーリーテリング・視覚的リストなど多様な表現が使われているか。
- **リスク認識**: 大胆な提案にも安全策やバックアウト案が添えられているか。
- **協調性**: 人間と AI の役割分担や次の介入ポイントが明確か。
- **評価と学習**: フィードバックが `AI_FEEDBACK_LOG.md` に記録され、次回への示唆が抽出されているか。

---

## 付録 E: 参考リンク

- `docs/PROMPT_TEMPLATES.md`
- `REPORT_CONFIG.yml`
- `AI_FEEDBACK_LOG.md`
- プロジェクト固有のガイドライン（例: `docs/project-type/web.md` 等）
