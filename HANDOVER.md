# 作業申し送り: Zen Writer

## 概要

Zen Writer — ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
コードベースのリファクタリング・品質向上を進行中。

- **バージョン**: 0.3.25
- **最終更新**: 2026-02-26
- **ブランチ**: main（origin/main と同期済み）

## 再開手順

```bash
git checkout main && git pull --ff-only
npm ci
npm run test:smoke      # node scripts/dev-check.js
npm run test:e2e:ci     # Playwright E2E (46 specs)
```

## 現在のプロジェクト状態

### テスト状況

| テスト | 状態 | コマンド |
|--------|------|----------|
| Smoke | ✅ ALL PASSED | `npm run test:smoke` |
| E2E | ⚠️ 63 passed / 21 skipped / 83 failed | `npm run test:e2e:ci` |
| Lint | ✅ ALL PASSED | `npm run lint` |

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js`
- **サイドバー**: `SidebarManager`（SSOT）→ 3グループ: structure / wiki / assist (v0.3.25でtypographyタブを削減)
- **エディタモジュール**: `js/modules/editor/` に EditorCore / EditorUI / EditorSearch を分割済み
- **テーマ**: `ThemeRegistry` で集中管理（light/dark/night/sepia/high-contrast/solarized）
- **フローティングパネル**: `js/panels.js` — ドッキング/フローティング切替、透明度、折りたたみ
- **Embed SDK**: `js/embed/` — 同一/クロスオリジン対応

### 主要ファイルサイズ（要リファクタリング）

| ファイル | 行数 | 状態 |
|----------|------|------|
| `js/editor.js` | ~500行 | モジュール分割済み（EditorCore/UI/Search抽出後） |
| `js/app.js` | ~1400行 | 未分割（HUD/ショートカット/初期化が混在） |

## オープンタスク

| タスク | 内容 | 優先度 | 状態 |
|--------|------|--------|------|
| TASK_045 | 柔軟なタブ配置システム | P2 | OPEN |
| TASK_046 | editor.js リファクタリング | P1 | OPEN |
| TASK_047 | app.js リファクタリング | P1 | OPEN |
| TASK_048 | 汎用フローティングパネル | P1 | OPEN |
| TASK_051 | プラグインシステム設計 | P2 | OPEN |
| TASK_052 | ガジェットAPI型安全性 | P2 | OPEN |
| TASK_054 | グラフィックノベル ルビテキスト | P2 | OPEN |
| TASK_055 | E2E残件64の失敗パターン分析・修正 | P1 | COMPLETED |
| TASK_057 | サイドバー再設計 | P1 | COMPLETED |

詳細: `docs/tasks/TASK_***.md`

## 完了済みマイルストーン

- ✅ gadgets.js モジュール分割（core/utils/loadouts/init/builtin）
- ✅ TypographyThemes → Themes/Typography/VisualProfile 3分割
- ✅ ThemeRegistry 導入（テーマ集中管理）
- ✅ UI/エディタ配色レイヤ分離（C-3/C-4完了）
- ✅ editor.js Phase A 分割（preview/images/overlays/search 抽出）
- ✅ editor.js Phase B 分割（EditorCore/EditorUI/EditorSearch モジュール化）
- ✅ フローティングパネル PoC → 本実装（Phase E）
- ✅ Selection Tooltip v1
- ✅ Wikilinks/バックリンク/グラフ機能（TASK_044）
- ✅ Embed SDK origin検証修正（TASK_039, PR #114）
- ✅ ドキュメント整合監査（TASK_040）
- ✅ smoke/dev-check監査（TASK_041, TASK_049）
- ✅ OpenSpecトリアージ・アーカイブ（TASK_050）
- ✅ GadgetPrefs Import/Export UI
- ✅ UIモード（Normal/Focus/Blank）
- ✅ Markdownライブプレビュー（morphdom差分適用）

## OpenSpec

### アーカイブ済み

- add-ui-design-gadget-and-dynamic-tabs
- polish-ui-feedback-response
- ui-future-enhancements
- add-gadgets-modularization
- add-lucide-icons
- ui-stability-and-cleanup

### 継続中

- add-modular-ui-wiki-nodegraph
- graphic-novel-font-decoration
- hud-customization-enhancement
- polish-ui-from-test-feedback
- story-wiki-implementation
- ui-enhancements

## 決定事項

- 全機能はガジェットとして実装（「メモ帳以上はガジェット化」原則）
- SidebarManager がタブ管理のSSOT
- Lucide アイコンセット採用（CDN暫定、将来ローカルSVG）
- CI成功PRはAI自動マージ（CI連携マージルール）
- E2E は Playwright、`scripts/run-two-servers.js` で同一/クロスオリジン検証
- CSS変数で UI/Editor 配色レイヤを分離（`--ui-*` / `--editor-*`）

## ローカル検証

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー（8080） |
| `npm run test:smoke` | smokeテスト（dev-check.js） |
| `npm run test:e2e:ci` | Playwright E2E |
| `npm run lint` | ESLint |
| `node scripts/run-two-servers.js` | 2ポート同時起動（8080/8081） |

## 参照ドキュメント

- `docs/PROJECT_HEALTH.md` — プロジェクト健全性レポート
- `docs/tasks/README.md` — タスク管理インデックス
- `AI_CONTEXT.md` — AI再開用コンテキスト
- `docs/ARCHITECTURE.md` — アーキテクチャ概要
- `docs/TESTING.md` — テスト方針
- `docs/GADGETS.md` — ガジェットAPI仕様
- `docs/THEMES.md` — テーマシステム
- `docs/UI_ARCHITECTURE.md` — UIアーキテクチャ設計
- `docs/AUDIT_TASK_BREAKDOWN.md` — 監査SSOT
- `docs/BACKLOG.md` — バックログ

---

## 追加引き継ぎ（作業途中・2026-02-25T13:52:05+09:00）

### 現在の状態（未コミット）
- ブランチ: main（origin/main との差分あり）
- 変更ファイル: .shared-workflows, AI_CONTEXT.md, css/style.css, docs/BACKLOG.md, docs/tasks/TASK_057_sidebar_redesign.md, index.html, js/gadgets-builtin.js, js/gadgets-clock.js, js/gadgets-goal.js, js/sidebar-manager.js, package.json, package-lock.json, smoke_result.txt
- 差分規模: 12 files changed, 375 insertions(+), 233 deletions(-)

### 今回反映済みの主変更
- バージョン更新: package.json を 0.3.24 から 0.3.25 へ更新
- TASK更新: TASK_057_sidebar_redesign を COMPLETED に更新
- バックログ更新: v0.3.25 (REDESIGN) の実施内容を追記
- サイドバー再設計: タブ構成を structure / wiki / assist に整理（typography タブを削減）
- ドキュメントガジェット刷新（js/gadgets-builtin.js）: Explorer 風ドキュメント一覧UIへ変更
- ガジェット配置調整: Clock と 執筆目標 を assist にも表示（settings との複数所属）
- ツールバー整理（index.html）: 非表示WIP操作を整理し主要操作中心へ簡素化
- スタイル調整（css/style.css）: サイドバー/ドキュメント一覧/ミニアイコンボタンのスタイルを追加

### 注意点
- .shared-workflows が def2c99 を指しており、サブモジュール更新差分あり
- AI_CONTEXT.md は先頭BOM除去のみ（内容変更なし）
- smoke_result.txt は未追跡ファイル

### 次アクション（推奨）
1. npm run test:smoke を実行して回帰確認
2. 必要なら npm run test:e2e:ci を実行
3. 問題なければ git add -A && git commit で v0.3.25 の中間確定

