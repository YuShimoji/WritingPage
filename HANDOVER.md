# 作業申し送り: Zen Writer

## 概要

Zen Writer -- ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
Electron デスクトップアプリとしても動作（CDN バンドル化によりオフライン完全対応）。

- **バージョン**: 0.3.32（`package.json` / `VERSION` と一致）
- **セッション・日付・直近スライス**: [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) の Snapshot（このファイルは手続き中心）
- **ブランチ**: `main`（`origin/main` と fast-forward 同期想定）

## 再開手順

```bash
git checkout main
git pull --ff-only origin main
npm ci
npx playwright install chromium
npm run test:smoke
npm run lint:js:check
npm run dev
```

PowerShell では `git checkout main; git pull --ff-only origin main; npm ci` のように `;` で区切る。

E2E 全件: `npx playwright test`。回帰の切り出しは `docs/CURRENT_STATE.md` の検証結果を参照。spec 本数・テスト総数は `npx playwright test --list` または Snapshot 近傍の記載。

最初に読む順番:

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)（**ドキュメント地図**で次に読むファイルが分かる）
2. [`docs/ROADMAP.md`](docs/ROADMAP.md) の「次スライス候補」
3. [`docs/USER_REQUEST_LEDGER.md`](docs/USER_REQUEST_LEDGER.md)（スライス運用・deferred）
4. 必要なら [`docs/INTERACTION_NOTES.md`](docs/INTERACTION_NOTES.md)

メトリクス: [`docs/runtime-state.md`](docs/runtime-state.md)。背景・IDEA・暗黙メモ: [`docs/project-context.md`](docs/project-context.md)。

## 現在のプロジェクト状態

現在地の事実関係は **常に [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)**（Snapshot・検証結果）。下表はクイック参照用。

| 項目 | 参照 |
|------|------|
| 主軸・直近スライス | `CURRENT_STATE` の Snapshot |
| 不変条件 | [`docs/INVARIANTS.md`](docs/INVARIANTS.md) |

### テスト状況

| テスト | コマンド |
|--------|----------|
| スモーク | `npm run test:smoke`（`scripts/dev-check.js`） |
| Lint（JS） | `npm run lint:js:check` |
| E2E | `npx playwright test` |

`docs/verification/` 配下の一時スクリプトは ESLint 対象外（`.eslintignore`）。

### アーキテクチャ概要

- **ガジェット**: `gadgets-core.js` ほか `gadgets-*.js`
- **サイドバー**: `SidebarManager`（SSOT）
- **エディタ**: `js/modules/editor/`（EditorCore / EditorUI 等）
- **WYSIWYG**: `editor-wysiwyg.js`
- **UI モード**: `normal` / `focus` の 2 値。読者向けの画面確認は **再生オーバーレイ**（別軸）。`setUIMode` / `ZenWriterApp` API を優先。`blank` は互換のため `focus` にフォールバック
- **章・ストレージ**: ChapterStore、IndexedDB（SP-077）、JSON プロジェクト保存（SP-080）
- **Reader / プレビュー HTML**: `js/zw-inline-html-postmarkdown.js`、`js/zw-postmarkdown-html-pipeline.js`、`js/zw-markdown-it-body.js`、監査は `docs/WP004_PHASE3_PARITY_AUDIT.md`
- **Electron**: `electron/` + `vendor/` ローカルバンドル

### 直近の重要判断

- スライスは **1 トピック** に絞る。完了時に `CURRENT_STATE` を更新する（台帳「開発スライスの進め方」参照）
- ブロック段落の左・中・右揃えは **WP-004 Phase 3 には含めない**。`spec-rich-text-paragraph-alignment.md` と `spec-richtext-enhancement.md`（P2）で別トラック
- 機能の台帳登録: `docs/FEATURE_REGISTRY.md`、E2E 境界: `docs/AUTOMATION_BOUNDARY.md`

## 次セッション準備（P0 完了・レーン A 移譲用）

以下は **プラン作成の直前**まで揃えた状態のメモ。実装プラン本文は次担当が 1 トピック確定後に書く。

| 項目 | 内容 |
|------|------|
| 正本 | `docs/CURRENT_STATE.md` Snapshot = **session 84**。検証結果に E2E 38+1 件・`playwright test --list` = **574** を記載済み。 |
| 次スライス（レーン A） | `docs/USER_REQUEST_LEDGER.md` session 84「次」: **WP-001 摩擦 1 件**を表から 1 本だけ選ぶ（例: 他カテゴリのカテゴリ説明／ガジェット `title`・`description` の同型整理）。**WP-004 は同一スライスに混ぜない**。 |
| WP-004 | 自動層は session 77 で区切り。**手動パックで差分が出たときだけ** 別スライス。 |
| Value Validation（`docs/ai/DECISION_GATES.md`） | 候補トピックごとに「出力の行き先」「削る手作業」「外部 GUI 依存で手運用が残るか」を各 1 文で埋められるか確認してからプラン化。 |
| 触ってよい（レーン A） | `js/sidebar-manager.js`、`js/gadgets-*.js`、`js/command-palette.js`、必要なら `css/style.css`（**スコープ内のみ**）。 |
| 触らない（レーン A） | `js/reader-preview.js`、`js/zw-*` パイプライン、`e2e/reader-*.spec.js`（WP-004 専用）。 |
| 並行時の衝突注意 | `sidebar-manager.js` / `command-palette.js` は WP-004 レーンと**同一イテレーションで共有しない**。 |

## 既知の課題

- `docs/spec-index.json` に historical entry が残る場合がある（現ワークツリーとの差は `CURRENT_STATE` を優先）
- `npm audit` で依存に moderate/high の指摘あり（必要時に個別判断）

## 決定事項

-> `CLAUDE.md` の DECISION LOG を参照

## ローカル検証

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー (8080) |
| `npx playwright test` | Playwright E2E |
| `npm run lint` | ESLint + markdownlint |
| `npm run electron:dev` | Electron 開発モード |
| `node scripts/run-two-servers.js` | 8080/8081 同時起動（embed 検証用） |

## 参照ドキュメント

- `docs/CURRENT_STATE.md`（地図つき）
- `docs/ROADMAP.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/INTERACTION_NOTES.md`
- `docs/INVARIANTS.md`
- `docs/FEATURE_REGISTRY.md` / `docs/AUTOMATION_BOUNDARY.md`
- `docs/ARCHITECTURE.md` / `docs/TESTING.md` / `docs/APP_SPECIFICATION.md`
- `CLAUDE.md`
