# 作業申し送り: Zen Writer

## 概要

Zen Writer — ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
コードベースのリファクタリング・品質向上を進行中。

- **バージョン**: 0.3.24
- **最終更新**: 2026-02-16
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
| E2E | ⚠️ 101 failed / 66 passed（167 total, 2026-02-16再計測） | `npm run test:e2e:ci` |
| Lint | ✅ PASSED（本体コード対象） | `npm run lint:js:check` |

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js`
- **サイドバー**: `SidebarManager`（SSOT）→ 4グループ: structure / typography / assist / wiki
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

| タスク | 内容 | 優先度 |
|--------|------|--------|
| TASK_055 | E2E残件64の失敗パターン分析・修正（継続） | P1 |
| TASK_058 | E2E高頻度失敗クラスター収束（Phase 1d-7） | P1 |
| TASK_045 | 柔軟なタブ配置システム | P2 |
| TASK_046 | editor.js リファクタリング | P1 |
| TASK_047 | app.js リファクタリング | P1 |
| TASK_048 | 汎用フローティングパネル | P1 |
| TASK_051 | プラグインシステム設計 | P2 |
| TASK_052 | ガジェットAPI型安全性 | P2 |
| TASK_054 | グラフィックノベル ルビテキスト | P2 |

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
- ✅ Lint実行境界の整理（TASK_059, .shared-workflows除外）

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
