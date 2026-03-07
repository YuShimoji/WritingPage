# 作業申し送り: Zen Writer

## 概要

Zen Writer -- ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
Electron デスクトップアプリとしても動作（v0.3.29 で CDN バンドル化によりオフライン完全対応）。

- **バージョン**: 0.3.29
- **最終更新**: 2026-03-08
- **ブランチ**: main（origin/main と同期済み）

## 再開手順

```bash
git checkout main && git pull --ff-only
npm ci                    # postinstall で vendor/ にライブラリコピー
npm run dev               # 開発サーバー (8080)
npx playwright test       # E2E テスト
npm run lint              # ESLint
```

## 現在のプロジェクト状態

### テスト状況

| テスト | 状態 | コマンド |
|--------|------|----------|
| Smoke | ✅ ALL PASSED | `npm run test:smoke` |
| E2E | ✅ 203 cases (197 passed / 5 flaky / 1 skipped) | `npx playwright test` |
| Lint | ✅ ALL PASSED (0 errors) | `npm run lint` |

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js` -- 29個登録済み
- **サイドバー**: `SidebarManager`(SSOT) -- 5カテゴリアコーディオン: structure / edit / theme / assist / advanced
- **ツールバー**: コンテキストベース (Layer 1-4) -- ミニマルヘッダー / フローティング装飾バー / サイドバー / エッジホバーUI
- **エディタモジュール**: `js/modules/editor/` に EditorCore / EditorUI / EditorSearch を分割済み
- **WYSIWYG**: `editor-wysiwyg.js` (RichTextEditor, 全15種装飾対応)
- **テーマ**: `ThemeRegistry` で集中管理 (6テーマ: light/dark/night/sepia/high-contrast/solarized)
- **Embed SDK**: `js/embed/` -- 同一/クロスオリジン対応
- **Electron**: `electron/` -- オフライン完全対応 (vendor/ ローカルバンドル)

### CDN バンドル化 (v0.3.29)

| ライブラリ | ソース | パス |
|-----------|--------|------|
| markdown-it | npm + postinstall | `vendor/markdown-it.min.js` |
| turndown | npm + postinstall | `vendor/turndown.js` |
| morphdom | npm + postinstall | `vendor/morphdom-umd.min.js` |
| lucide | npm + postinstall | `vendor/lucide.min.js` |
| Noto Serif JP | npm + postinstall | `vendor/fonts/` (gitignored, Electron用) |

- JS: 常にローカル vendor/ (CDN廃止)
- フォント: Electron=ローカル / ブラウザ=Google Fonts CDN

### 主要ファイルサイズ

| ファイル | 行数 | 状態 |
|----------|------|------|
| `js/app.js` | 462 | ✅ Phase 3 分割完了 (77.7%削減) |
| `js/editor.js` | 189 | ✅ モジュール分割済み |
| `js/gadgets-core.js` | 584 | 適正 |
| `js/gadgets-editor-extras.js` | ~700 | 10ガジェット統合ファイル |

## 既知の課題

-> `docs/ROADMAP.md` に統合

## 決定事項

- 全機能はガジェットとして実装 (「メモ帳以上はガジェット化」原則)
- SidebarManager がタブ管理の SSOT
- Lucide アイコンセット採用 (ローカル vendor/)
- CSS変数で UI/Editor 配色レイヤを分離 (`--ui-*` / `--editor-*`)
- ツールバーはコンテキストベース (spec-context-toolbar.md 準拠)
- CDN廃止: JSライブラリは常にローカル vendor/、フォントは Electron のみローカル

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

- `docs/ROADMAP.md` -- 機能強化ロードマップ
- `docs/PROJECT_HEALTH.md` -- プロジェクト健全性レポート
- `docs/ARCHITECTURE.md` -- アーキテクチャ概要
- `docs/TESTING.md` -- テスト方針
- `docs/GADGETS.md` -- ガジェットAPI仕様
- `docs/APP_SPECIFICATION.md` -- アプリケーション仕様書
- `docs/spec-context-toolbar.md` -- コンテキストツールバー仕様
- `CLAUDE.md` -- AI再開用コンテキスト
