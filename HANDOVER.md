# 作業申し送り: Zen Writer

## 概要

Zen Writer -- ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
Electron デスクトップアプリとしても動作（v0.3.29 で CDN バンドル化によりオフライン完全対応）。

- **バージョン**: 0.3.29
- **最終更新**: 2026-03-19
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
| E2E | 389 passed / 0 failed / 1 skipped (52 spec files, 399 total) | `npx playwright test` |
| Lint | ALL PASSED (0 errors) | `npm run lint` |

### 既知の E2E スキップ (2026-03-19)

- editor-canvas-mode.spec.js: 1件 skip (Canvas Mode は betaEnabled:false で延期中)
- +9件: 条件付きskip (Images系/xorigin/split-view等のガジェットloadout依存)

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js` -- 33個登録済み (+1 開発専用)
- **サイドバー**: `SidebarManager`(SSOT) -- 6カテゴリアコーディオン: structure / edit / theme / assist / advanced / sections
- **ツールバー**: コンテキストベース (Layer 1-4) -- ミニマルヘッダー / フローティング装飾バー / サイドバー / エッジホバーUI
- **エディタモジュール**: `js/modules/editor/` に EditorCore / EditorUI / EditorSearch を分割済み
- **WYSIWYG**: `editor-wysiwyg.js` (RichTextEditor, 全15種装飾対応)
- **テーマ**: `ThemeRegistry` で集中管理 (6テーマ: light/dark/night/sepia/high-contrast/solarized)
- **モードアーキテクチャ**: Normal / Focus / Blank / Reader の4モード (SP-070/078)
- **チャプター管理**: ChapterStore + ChapterList 2ペイン (SP-071)
- **ストレージ**: IndexedDB (SP-077完了) + メモリキャッシュ + localStorageフォールバック
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
| `js/storage.js` | 1612 | IDB移行完了 |
| `js/sidebar-manager.js` | 1370 | SSOT |
| `js/editor-wysiwyg.js` | 1583 | リンク挿入モーダル + DSL退避方式追加 |
| `js/story-wiki.js` | 1432 | Phase 2 Step 1-3 完了 (グラフ/バックリンク/AI生成) |
| `js/chapter-list.js` | 1026 | Phase 3 目次生成 |
| `js/gadgets-editor-extras.js` | 1227 | TB DSL / プリセット / ゲームブック分岐UI |
| `js/gadgets-core.js` | 1020 | 適正 |
| `js/app.js` | 644 | Phase 3 分割完了 |

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

- `docs/ROADMAP.md` -- 機能強化ロードマップ
- `docs/ARCHITECTURE.md` -- アーキテクチャ概要
- `docs/TESTING.md` -- テスト方針
- `docs/GADGETS.md` -- ガジェットAPI仕様
- `docs/APP_SPECIFICATION.md` -- アプリケーション仕様書
- `docs/spec-context-toolbar.md` -- コンテキストツールバー仕様
- `docs/specs/` -- 個別仕様書 (spec-index.json で索引)
- `CLAUDE.md` -- AI再開用コンテキスト
