# 監査結果 Issue 化（2026-03-14）

このファイルは、仕様と実装の差分監査結果を GitHub Issue にそのまま転記できる形で整理したものです。  
各 Issue は AI エージェントが着手しやすいように、目的・変更範囲・受け入れ基準・検証手順を固定しています。

---

## Issue 1: [Bug] lint/smoke が失敗して品質ゲートが赤になる

- Labels: `bug`, `priority:high`
- 推奨 Assignee: AI Agent

### 概要

現行 `main` 相当で `npm run lint:js:check` と `npm run test:smoke` が失敗し、品質ゲートが赤になる。

### 根拠

- `npm run lint:js:check`  
  - `js/gadgets-sections-nav.js:393` の `getEditorText` が未使用 (`no-unused-vars`)
- `npm run test:smoke`  
  - `CLAUDE.md` の markdownlint basic check が NG
  - 例: リストインデント不正、200文字超行

### 対応方針

1. `js/gadgets-sections-nav.js` の未使用関数を削除するか、実際に利用する形へ整理する。  
2. `CLAUDE.md` の markdownlint basic NG を解消する。  
3. 既存挙動を壊さない（機能改修ではなく品質ゲート復旧を優先）。

### 受け入れ基準

- `npm run lint:js:check` が 0 errors
- `npm run test:smoke` が成功
- 既存 UI E2E 代表セットが通る（最低 `npm run test:e2e:ui`）

### 検証コマンド

```bash
npm run lint:js:check
npm run test:smoke
npm run test:e2e:ui
```

### 変更対象候補

- `js/gadgets-sections-nav.js`
- `CLAUDE.md`

---

## Issue 2: [Docs] APP_SPECIFICATION.md の実測値・実装状況を最新化する

- Labels: `documentation`, `priority:high`
- 推奨 Assignee: AI Agent

### 概要

`docs/APP_SPECIFICATION.md` の複数項目が現行実装と不一致。運用時の判断を誤らせるため、最新化が必要。

### 不一致ポイント（監査時点）

- E2E件数/ファイル数  
  - 記載: `212件 / 31ファイル`  
  - 実測: `271件 / 38ファイル`
- JSファイル数  
  - 記載: `84ファイル`  
  - 実測: `js` 配下 `104ファイル`
- プラグインシステム  
  - 記載: 未実装  
  - 実装あり（`js/plugin-api.js`, `js/plugin-manager.js`, `js/plugins/manifest.json`, `e2e/plugin-manager.spec.js`）

### 対応方針

1. 数値を実測値ベースに更新。  
2. 「未実装」表現を現状フェーズに合わせて修正（例: Phase1/2 実装済み、UI未整備など）。  
3. 将来計画と現状実装を区別して書く。

### 受け入れ基準

- `docs/APP_SPECIFICATION.md` の数値・状態が現行コードと一致
- 「実装済み/未実装/将来予定」の定義が混同されない
- 更新後にレビューで矛盾指摘が出ない

### 変更対象候補

- `docs/APP_SPECIFICATION.md`
- 必要に応じて `docs/ROADMAP.md` との整合確認

---

## Issue 3: [Docs] README の死リンク・削除済みドキュメント参照を解消する

- Labels: `documentation`, `priority:medium`
- 推奨 Assignee: AI Agent

### 概要

`README.md` に、既に削除済み（legacy）ドキュメントへの参照が残っている。  
新規参加者の導線を壊すため、現行ドキュメントへ差し替える。

### 対象例

- `docs/DESIGN.md`（削除済み）
- `docs/USER_GUIDE.md`（削除済み）
- `docs/PROJECT_HEALTH.md`（削除済み）
- `docs/KNOWN_ISSUES.md`（削除済み）
- `docs/SNAPSHOT_DESIGN.md`（削除済み）

### 対応方針

1. `README.md` の参照を `docs/spec-index.json` と整合する現行ドキュメントへ置換。  
2. legacy に統合された先（例: `ARCHITECTURE.md`, `TROUBLESHOOTING.md`, `EDITOR_HELP.md` など）を明記。  
3. 「読む順番」を再整理して onboarding を短縮。

### 受け入れ基準

- `README.md` から参照する主要ドキュメントが実在する
- 初見開発者が README 起点で迷わない
- 死リンク案内が 0 件

### 変更対象候補

- `README.md`
- 必要に応じて `docs/README.md`

---

## Issue 4: [Roadmap] 実装済み機能と todo の意味を分離して記述する

- Labels: `documentation`, `priority:medium`
- 推奨 Assignee: AI Agent

### 概要

`docs/ROADMAP.md` の一部に、実装済みのコア機能と「UI統合未完了」が同じ `todo` 表現で混在している。  
進捗判断が曖昧になるため、粒度を分離する。

### 例

- Wiki/グラフ関連で `todo` 表記がある一方、実装/テストは存在  
  - `js/link-graph.js`
  - `e2e/wikilinks.spec.js`

### 対応方針

1. `todo` を「未実装」か「実装済みだが統合未完了」かに分ける。  
2. 必要ならステータス語彙を統一（`done/partial/todo/deferred` の意味を冒頭に定義）。  
3. `spec-index.json` のステータスと齟齬が出ないよう同期。

### 受け入れ基準

- ROADMAP を見て、機能の実装有無と統合完了度を区別できる
- `docs/spec-index.json` と意味的に矛盾しない
- 次の作業優先度が一意に決められる

### 変更対象候補

- `docs/ROADMAP.md`
- `docs/spec-index.json`（必要時のみ）

---

## AI エージェント向け共通指示（Issue 本文末尾に追記推奨）

1. 変更は最小差分で行い、機能追加はしない。  
2. まず現状再現（失敗の再現）→ 修正 → 再実行で証跡を残す。  
3. すべての修正で以下を実行し、結果をコメントに記録する。

```bash
npm run lint:js:check
npm run test:smoke
npm run test:e2e:ui
```

4. ドキュメント更新時は「実装済み」「部分実装」「将来予定」を混同しない。
