# 作業申し送り: Zen Writer

## 概要

Zen Writer — ブラウザベースの小説執筆エディタ。ガジェットアーキテクチャによるモジュラー設計。
コードベースのリファクタリング・品質向上を進行中。

- **バージョン**: 0.3.29
- **最終更新**: 2026-03-05
- **ブランチ**: main（origin/main より14コミット先行）

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
| E2E | 🔧 126 passed / 5 skipped / 73 failed | `npm run test:e2e:ci` |
| Lint | ✅ ALL PASSED | `npm run lint` |

### アーキテクチャ概要

- **ガジェットシステム**: `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js`
- **サイドバー**: `SidebarManager`（SSOT）→ 5カテゴリのアコーディオン形式: structure / edit / theme / assist / advanced
- **ツールバー**: ミニマル表示がデフォルト（`data-toolbar-mode="full"` で全ボタン表示）
- **メインハブパネル**: `#main-hub-panel` — 検索・全文検索・ノートなどをタブ統合
- **エディタモジュール**: `js/modules/editor/` に EditorCore / EditorUI / EditorSearch を分割済み
- **テーマ**: `ThemeRegistry` で集中管理（light/dark/night/sepia/high-contrast/solarized）
- **Embed SDK**: `js/embed/` — 同一/クロスオリジン対応

### 主要ファイルサイズ（要リファクタリング）

| ファイル | 行数 | 状態 |
|----------|------|------|
| `js/editor.js` | ~500行 | モジュール分割済み（EditorCore/UI/Search抽出後） |
| `js/app.js` | ~1400行 | 未分割（HUD/ショートカット/初期化が混在） |

## オープンタスク

| タスク | 内容 | 優先度 | 状態 |
|--------|------|--------|------|
| TASK_045 | 柔軟なタブ配置システム | P2 | COMPLETED |
| TASK_046 | editor.js リファクタリング | P1 | COMPLETED |
| TASK_047 | app.js リファクタリング | P1 | COMPLETED |
| TASK_048 | 汎用フローティングパネル | P1 | COMPLETED |
| TASK_051 | プラグインシステム設計 | P2 | Phase 1 DONE |
| TASK_052 | ガジェットAPI型安全性 | P2 | COMPLETED |
| TASK_054 | グラフィックノベル ルビテキスト | P2 | COMPLETED |
| TASK_055 | E2E残件64の失敗パターン分析・修正 | P1 | COMPLETED |
| TASK_056 | テキストアニメーション再生機能の修正 | P2 | COMPLETED |
| TASK_057 | サイドバー再設計 | P1 | COMPLETED |

詳細: `docs/tasks/TASK_***.md`

## 完了済みマイルストーン

- ✅ gadgets.js モジュール分割（core/utils/loadouts/init/builtin）
- ✅ TypographyThemes → Themes/Typography/VisualProfile 3分割
- ✅ ThemeRegistry 導入（テーマ集中管理）
- ✅ UI/エディタ配色レイヤ分離（C-3/C-4完了）
- ✅ editor.js Phase A 分割（preview/images/overlays/search 抽出）
- ✅ editor.js Phase B 分割（EditorCore/EditorUI/EditorSearch モジュール化）
- ✅ editor.js リファクタリング完了（TASK_046: 1700→189行）
- ✅ app.js リファクタリング完了（TASK_047: 2072→464行、77.6%削減）
- ✅ フローティングパネル PoC → 本実装（Phase E）
- ✅ Selection Tooltip v1
- ✅ Wikilinks/バックリンク/グラフ機能（TASK_044）
- ✅ Embed SDK origin検証修正（TASK_039, PR #114）
- ✅ ドキュメント整合監査（TASK_040）
- ✅ smoke/dev-check監査（TASK_041, TASK_049）
- ✅ OpenSpecトリアージ・アーカイブ（TASK_050）
- ✅ E2Eテスト改善（83失敗→30失敗、64%改善）
- ✅ GadgetPrefs Import/Export UI
- ✅ UIモード（Normal/Focus/Blank）
- ✅ Markdownライブプレビュー（morphdom差分適用）
- ✅ ガジェットAPI型安全性（TASK_052: TypeScript型定義、JSDoc追加）
- ✅ ガジェット復帰機能（TASK_048 Phase 2: フローティングパネル → サイドバー）
- ✅ タブ順序ドラッグ&ドロップ入替（TASK_045: 永続化対応）
- ✅ プラグインシステム Phase 1（TASK_051: APIブリッジ/設計）
- ✅ ルビテキスト対応（TASK_054: {漢字|かんじ} 構文）
- ✅ テキストアニメーション再生・装飾（TASK_056: プレビュー再生対応）
- ✅ 新規E2Eテスト17件追加（100%合格）

## OpenSpec

### アーカイブ済み

- add-ui-design-gadget-and-dynamic-tabs
- polish-ui-feedback-response
- ui-future-enhancements
- add-gadgets-modularization
- add-lucide-icons
- ui-stability-and-cleanup (2026-03-02)

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
- `docs/ROADMAP_2026_Q1.md` — 2026 Q1 開発ロードマップ
- `docs/E2E_TEST_ANALYSIS_2026_03_02.md` — E2Eテスト分析レポート
- `docs/OPENSPEC_TRIAGE_2026_03_02.md` — OpenSpecトリアージ分析
- `docs/REFACTORING_COMPLETION_2026_03_02.md` — リファクタリング完了確認
- `docs/SESSION_LOG_2026_03_02.md` — 開発セッションログ
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

## 追加引き継ぎ（2026-03-05）

### 今回のセッションで実施した作業

#### 1. コード品質改善

- `sidebar-manager.js`: `_saveAccordionState()` の null チェック追加
- `sidebar-manager.js`: `_setAccordionState()` 失敗時のデバッグログ追加

#### 2. E2Eテスト安定化（122失敗 → 73失敗、49テスト修正）

**修正した失敗パターン:**

| パターン | 対応 | 影響ファイル数 |
|----------|------|----------------|
| ツールバーボタン非表示 | `showFullToolbar(page)` ヘルパー追加、各テストで呼出 | 15+ |
| `#search-panel` 消失 | `#main-hub-panel` セレクタに移行 | 5 |
| `#global-search-panel` 消失 | メインハブパネルのタブに移行 | 1 |
| アコーディオンセレクタ不一致 | `aria-controls`/`aria-expanded` ベースに修正 | 4 |
| Wikiガジェット所在変更 | `edit` カテゴリに移行 | 2 |

**追加したE2Eヘルパー関数 (`e2e/helpers.js`):**
- `showFullToolbar(page)` — ミニマルツールバーをフル表示に切替
- `openGlobalSearchPanel(page)` — 全文検索パネルを開く
- `expandAccordion(page, categoryId)` — アコーディオンカテゴリを展開
- `openSettingsModal(page)` — 設定モーダルを開く

#### 3. 残り73件の失敗分析

| 原因 | 件数 | 対応方針 |
|------|------|----------|
| ツールバーボタン非表示（修正漏れ） | ~30 | `showFullToolbar` 追加で修正可能 |
| アコーディオン展開不足 | ~15 | `expandAccordion` 呼出追加 |
| `data-group` セレクタ残存 | ~10 | `aria-controls` に置換 |
| `#toggle-ui-editor` 未対応 | ~9 | ツールバー表示 + セレクタ確認 |
| xorigin通信問題 | 1 | 別途調査必要 |

### サイドバーアーキテクチャ変更（未記載仕様）

#### アコーディオンシステム
- **HTML構造**: `<section class="accordion-category" data-category="{id}">`
  - `<button class="accordion-header" aria-expanded="true/false" aria-controls="accordion-{id}">`
  - `<div class="accordion-content" id="accordion-{id}" aria-hidden="true/false">`
- **状態管理**: `aria-expanded` + `aria-hidden` + `display: block/none`
- **永続化**: `ZenWriterStorage` の `ui.accordionState` に保存
- **5カテゴリ**: structure(構造), edit(編集), theme(テーマ), assist(補助), advanced(詳細)
- **注意**: `data-group` 属性はヘッダーに存在しない。`aria-controls` でセレクタ指定する

#### ツールバー最小化
- デフォルト: サイドバー開閉ボタン + 文字数カウントのみ表示
- `.toolbar-actions` は `display: none`
- `data-toolbar-mode="full"` を `<html>` に設定するとフル表示
- フルモード設定UI: 未実装（次アクション候補）

#### メインハブパネル統合
- 旧 `#search-panel` → `#main-hub-panel` の `#tab-search` タブ
- 旧 `#global-search-panel` → `#main-hub-panel` の `#tab-global-search` タブ
- `MainHubPanel.toggle('search')` / `MainHubPanel.toggle('global-search')` で開閉

### 次アクション（推奨）

1. **E2Eテスト残り73件の修正** — パターン別に修正（推定2-3時間）
2. **origin/main へ push** — 14コミット分
3. **ツールバーモード設定UI** — ユーザーがフル/ミニマルを切替可能にする
4. **`data-group` 属性の追加検討** — テストで使いやすいセレクタとして
