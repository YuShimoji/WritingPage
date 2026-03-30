# 作業申し送り: Zen Writer

## 概要

Zen Writer -- ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
Electron デスクトップアプリとしても動作（v0.3.29 で CDN バンドル化によりオフライン完全対応）。

- **バージョン**: 0.3.29
- **最終更新**: 2026-03-30
- **ブランチ**: main（origin/main と同期済み）

## 再開手順

```bash
git checkout main && git pull --ff-only
npm ci                    # postinstall で vendor/ にライブラリコピー
npm run dev               # 開発サーバー (8080)
npx playwright test       # E2E テスト
npm run lint              # ESLint
```

最初に読む順番:

1. `docs/CURRENT_STATE.md`
2. `HANDOVER.md`
3. 必要なら対象仕様 (`docs/specs/` または `docs/ROADMAP.md`)

## 現在のプロジェクト状態

### 直近の状態

| 項目 | 状態 |
|------|------|
| 主軸 | UI/UX の磨き上げと未完了機能の安全な局所化 |
| 直近修正 | 執筆集中サイドバーを `focus` 限定化 / UI モード経路の一本化 / `+追加` 自然レベル修正 |
| 重点仕様 | `SP-053` 執筆集中サイドバー, `SP-062` テキスト表現アーキテクチャ |
| 現在地の正本 | `docs/CURRENT_STATE.md` |

### テスト状況

| テスト | 状態 | コマンド |
|--------|------|----------|
| 重点 UI suite | ✅ 27 passed | `npx playwright test e2e/accessibility.spec.js e2e/ui-regression.spec.js e2e/command-palette.spec.js e2e/sidebar-writing-focus.spec.js --reporter=line` |
| Lint | ✅ passed | `npm run lint:js:check` |
| 全件 E2E | 未再確認 | `npx playwright test` |

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js`
- **サイドバー**: `SidebarManager`(SSOT) -- structure / edit / theme / assist / advanced を中心に管理
- **ツールバー**: コンテキストベース (Layer 1-4) -- ミニマルヘッダー / フローティング装飾バー / サイドバー / エッジホバーUI
- **エディタモジュール**: `js/modules/editor/` に EditorCore / EditorUI / EditorSearch を分割済み
- **WYSIWYG**: `editor-wysiwyg.js` (RichTextEditor, 全15種装飾対応)
- **テーマ**: `ThemeRegistry` で集中管理 (6テーマ: light/dark/night/sepia/high-contrast/solarized)
- **モードアーキテクチャ**: Normal / Focus / Blank / Reader の4モード (SP-070/078)
- **チャプター管理**: ChapterStore + ChapterList 2ペイン (SP-071)
- **ストレージ**: IndexedDB (SP-077完了) + メモリキャッシュ + localStorageフォールバック
- **Embed SDK**: `js/embed/` -- 同一/クロスオリジン対応
- **Electron**: `electron/` -- オフライン完全対応 (vendor/ ローカルバンドル)

### 直近の重要判断

- UI モードは `setUIMode` を単一入口として扱う
- 執筆集中サイドバーは `focus` モード限定の partial 機能として扱う
- Electron の「超ミニマル」は `setUIMode` 経由で通常モード系へ正規化する
- hidden 互換 UI は残っていても、周辺機能はまず `ZenWriterApp` API を使う

## 既知の課題

- `docs/spec-index.json` に現ワークツリーで欠けている historical entry が残っている
- UI まわりに旧経路/互換レイヤが残っている
- テキスト表現 (`SP-062`) は in-progress のため追加整備が必要
- handoff 指示で想定される canonical docs の一部 (`docs/runtime-state.md`, `docs/project-context.md`, `docs/INVARIANTS.md` など) はこの repo に未作成

## 決定事項

-> CLAUDE.md の DECISION LOG を参照

## ローカル検証

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー (8080) |
| `npx playwright test` | Playwright E2E |
| `npm run lint` | ESLint |
| `npm run electron:dev` | Electron 開発モード (cmd.exe から実行) |
| `npm run electron:build` | Electron ビルド |
| `node scripts/run-two-servers.js` | 2ポート同時起動 (8080/8081, embed検証用) |

## 参照ドキュメント

- `docs/CURRENT_STATE.md` -- 最新の現在地・直近修正・検証結果
- `docs/PROJECT_HEALTH.md` -- 健全性・主要リスク・次の確認ポイント
- `docs/ROADMAP.md` -- 機能強化ロードマップ
- `docs/ARCHITECTURE.md` -- アーキテクチャ概要
- `docs/TESTING.md` -- テスト方針
- `docs/GADGETS.md` -- ガジェットAPI仕様
- `docs/APP_SPECIFICATION.md` -- アプリケーション仕様書
- `docs/spec-context-toolbar.md` -- コンテキストツールバー仕様
- `docs/specs/spec-writing-focus-sidebar.md` -- 執筆集中サイドバー仕様
- `docs/specs/spec-text-expression-architecture.md` -- テキスト表現 SSOT
- `CLAUDE.md` -- AI再開用コンテキスト
