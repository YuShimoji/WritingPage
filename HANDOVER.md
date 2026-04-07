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
- **UI モード**: `normal` / `focus` / `reader`。`setUIMode` が単一入口。`blank` は互換のため `focus` にフォールバック
- **章・ストレージ**: ChapterStore、IndexedDB（SP-077）、JSON プロジェクト保存（SP-080）
- **Reader / プレビュー HTML**: `js/zw-inline-html-postmarkdown.js`、`js/zw-postmarkdown-html-pipeline.js`、`js/zw-markdown-it-body.js`、監査は `docs/WP004_PHASE3_PARITY_AUDIT.md`
- **Electron**: `electron/` + `vendor/` ローカルバンドル

### 直近の重要判断

- スライスは **1 トピック** に絞る。完了時に `CURRENT_STATE` を更新する（台帳「開発スライスの進め方」参照）
- ブロック段落の左・中・右揃えは **WP-004 Phase 3 には含めない**。`spec-rich-text-paragraph-alignment.md` と `spec-richtext-enhancement.md`（P2）で別トラック
- 機能の台帳登録: `docs/FEATURE_REGISTRY.md`、E2E 境界: `docs/AUTOMATION_BOUNDARY.md`

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
