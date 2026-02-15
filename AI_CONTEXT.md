# AI_CONTEXT — 開発プロトコルと自律的再開のための前提情報

この文書は、エージェント/開発者が作業を中断/再開する際に必要な前提情報をコンパクトに提供します。

- 最終更新: 2026-02-16T03:50:00+09:00
- **Worker完了ステータス**: TASK_001-030: completed, TASK_049: completed, TASK_050: completed, TASK_053: completed (実装確認済み)

## 再開ログ（2026-02-13）

- `git pull --rebase origin main` 実施（親リポジトリは最新）
- サブモジュール `.shared-workflows` を `origin/main` 最新へ更新（`3e62f33425eacd1c9959ffe1deab05cfa3b9f2d8`）
- `npm ci` 実行済み
- `npm run test:smoke` 成功（ALL TESTS PASSED）
- `npm run test:e2e:ci` 再実行結果: `64 failed / 104 passed`（前回から横ばい）
- 次タスク: `docs/tasks/TASK_055_e2e_remaining64_continuation.md`

## Worker引き渡し（着手順）

1. `responsive-ui.spec.js` と `accessibility.spec.js` の表示/フォーカス前提を共通ヘルパー化
2. `ui-editor.spec.js` と `decorations.spec.js` の hidden 要素操作失敗を panel open wait で統一修正
3. `collage.spec.js` と `image-position-size.spec.js` と `tags-smart-folders.spec.js` のガジェット前提をロードアウト準拠へ調整
4. クラスターごとの局所再実行後、`npm run test:e2e:ci` で全体再測定

## 中央ルール参照（SSOT）

- **中央リポジトリ（shared-workflows）**:
  - GitHub URL: `https://github.com/YuShimoji/shared-workflows`
  - ローカルパス（submodule）: `.shared-workflows/`
  - 参照方法: Git Submodule として導入済み（`.shared-workflows/` 配下）
- SSOT（latest）: `.shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md`
- 運用者の入口: `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md`
- オーケストレーション（毎回コピペ）: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_METAPROMPT.md`
- オーケストレーション手順（参照）: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
- 運用ストレージ: `docs/HANDOVER.md`, `docs/tasks/`, `docs/inbox/`
- async_mode: true

- 現在のミッション: Phase 1d-6（E2E残件64の失敗クラスター解消）
- ブランチ: main
- 関連PR: #95（Merged）
- 関連: gadgets.jsモジュール化、TypographyThemes分割、ThemeRegistry導入、ドキュメント整理
- 進捗:
  - gadgets.js→_legacy移動
  - TypographyThemes→Themes/Typography/VisualProfile分割
  - テーマdark/night調整
  - dev-check.js更新
  - REFACTORING_PLAN・BACKLOG・THEMES更新
  - Selection Tooltip v1 実装（EDITOR_EXTENSIONS 準拠）
  - editor-preview.js・editor-images.js・editor-overlays.js 抽出（editor.js 分割 Phase A の一部完了）
  - ThemeRegistry 導入（C-2 完了: テーマ定義の集中管理基盤）
  - C-3 Step1: editor 用 CSS 変数（`--editor-bg`, `--editor-text`）導入
  - C-3 Step2: UI 用 CSS 変数（`--ui-bg`, `--ui-text`）導入、CSS 全体で UI/Editor レイヤを分離（挙動は従来と同一、論理的な分離のみ）
  - C-3 Step3: UI/Editor 独立配色の拡張基盤を実装（ThemeRegistry に uiColors/editorColors 追加、applyCustomColors 拡張、カラーピッカー Editor 優先）
  - C-4: UI配色と執筆エリア配色の分離を完了（UI は `--ui-*` を参照し、カスタム色は Editor レイヤに反映。テーマ切替時の UI 配色は ThemeRegistry の既定色を優先）
  - A-1: editor-search.js 抽出完了（検索/置換ロジックを分離、editor.js 1763→1466 行）
  - B-1: フローティングパネルUI改善完了（透明度調整スライダー、折りたたみ/展開ボタン、状態永続化）
  - 2025-12-12: 改行コード正規化（`.gitattributes` の eol=lf に合わせ、テーマ関連 JS の LF 正規化を実施）
  - 2025-12-12: ガジェット設定のImport/Export UI（GadgetPrefs）を追加（`js/gadgets-prefs.js`）
  - 2025-12-12: `npm run test:smoke` を更新し、GadgetPrefs UI の存在を検証するように変更
  - 2025-12-12: Playwright E2E（セレクタ/タブ切替）を修正し `npm test` が green（46 passed）
  - 2025-12-13: E2E の固定URL参照（`http://localhost:8080`）を廃止し、Playwright の baseURL に追従（`page.goto('/')`）するよう修正。`npm run test:e2e` green
  - 2025-12-14: markdownlint/ESLint を全て解消し、E2E フレーク（タブ切替/大文字小文字検索）を待ち条件強化で安定化。`npm run lint` / `npx playwright test --workers=2` green（46 passed）
  - 2025-12-14: OpenSpec の specデルタを strict に適合（MUST/SHALL + Requirement/Scenario 体裁）させ、`openspec validate --changes --strict` を全通し（9 passed）。smoke（dev-check）は dev server 未起動時に自動起動するよう更新
  - 2025-12-14: （運用）このリポジトリのみ `core.autocrlf=false` に設定し、`.gitattributes`（`*.md eol=lf`）を優先
  - 2025-12-14: OpenSpec 完了 change 3件を `openspec archive -y` でアーカイブ（add-ui-design-gadget-and-dynamic-tabs / polish-ui-feedback-response / ui-future-enhancements）
  - 2025-12-14: PR #92 を作成（CI green）→ マージ済み。Issue #91 クローズ。
  - 2025-12-14: docs/PROMPT_TEMPLATES.md を追加し、作業依頼/再開テンプレを標準化（Issue #93）
  - 2025-12-15: Assistタブにヘルプリンク（Wiki/エディタ/UI Lab）を追加し、`editor-help-button` のイベント/ElementManager登録を実装
  - 2025-12-15: `scripts/dev-check.js`（smoke）にヘルプ導線（ID存在/ドキュメント200）チェックを追加し、`npm run test:smoke` green
  - 2025-12-15: Helpガジェットの絵文字（ナビ/本文内）をLucide化し、`createIcons({ icons })` 呼び出しを統一（index.html / gadgets-help.js）
  - 2025-12-15: Helpガジェット内Lucideのサイズ/整列CSSを追加（.help-nav-icon svg / .help-inline-icon svg）
  - 2025-12-15: `npm run test:smoke` green（ALL TESTS PASSED）
  - 2025-12-15: main にマージし、origin/main へ push 済み
  - 2025-12-16: OpenSpecのPurpose(TBD)整備、ui specのGoal×Calendar/ClockをBacklog化、
    docsの現行実装同期（GADGETS/ARCHITECTURE/BACKLOG/TROUBLESHOOTING）、
    dev-checkのポート誤判定修正（8080占有時の安定化）。`npm run test:smoke` green
  - 2025-12-16: SidebarManager をサイドバータブ管理のSSOTとする方針を継続し、
    `ZWGadgets.addTab()` のDOM直操作フォールバックを撤去（`window.sidebarManager.addTab()` への委譲のみ）。
    `npm run lint` / `node scripts/dev-check.js` / `npm run test:e2e:ci` green
  - 2025-12-16: 監査SSOT `docs/AUDIT_TASK_BREAKDOWN.md` を作成し、`docs/ISSUES.md` に導線を追加。`npm run lint` / `npm run test:smoke` green
  - 2025-12-16: `docs/BACKLOG.md` に監査項目（`docs/AUDIT_TASK_BREAKDOWN.md` 参照）の追跡導線を追加
  - 2026-01-29: `docs/KNOWN_ISSUES.md` の改善済みバージョン表記を現行 `0.3.24` に同期
  - 2025-12-17: グラフィックノベル向けロードアウト（graphic-novel）を追加。
    サンプル作成ガジェット（Samples）を追加し、ワンクリックでサンプル文書＋SVG画像アセット（asset://）を生成できるようにした。
    `npm run lint` / `npm run test:smoke` / `npm run test:e2e:ci` green
  - 2025-12-17: PR #95 を作成。`npm run test:smoke` / `npm run test:e2e:ci` green
  - 2025-12-17: PR #95 を squash merge し main へ反映。`npm run lint` / `npm run test:smoke` / `npm run test:e2e:ci` green
  - 2026-02-03: smoke test（dev-check.js）を最新UI（Typography/Wikiパネル、サイドバータブ、フローティングパネル）に対応。TASK_049 完了
  - 2026-02-03: OpenSpec changes をアーカイブ・整理（add-gadgets-modularization, add-lucide-icons, ui-stability-and-cleanup）。TASK_050 完了
  - 2026-02-07: index.html のマージコンフリクトマーカー（`<<<<<<< HEAD` / `=======` / `>>>>>>> origin/main`）を解消。旧バージョン（古いサイドバー/エディタ HTML）を除去し origin/main のモダン UI を保持。全 JS エラー解消、サイト正常動作を確認
  - 2026-02-07: `scripts/capture-screenshots.js` を改修 — 日付別サブフォルダ出力（`YYYY-MM-DD/`）、タブ切替検証（`data-group`）、コンソールエラー検出、タブ名ファイル名含有。壊れたスクリーンショットを `2026-02-07-broken/` にアーカイブ
  - 2026-02-09: TASK_047 Phase 1 — app.js から app-shortcuts.js / app-hud.js / app-settings-handlers.js / app-file-manager.js を抽出（2072行 → 1377行）。smoke ALL PASSED
  - 2026-02-09: TASK_047 Phase 2 — app-ui-events.js を抽出（1377行 → 919行）。smoke ALL PASSED。P0/P1 全解消確認済み
  - 2026-02-09: TASK_047 Phase 3 — app-gadgets-init.js / app-autosave-api.js 抽出 + 未使用関数削除（919行 → 462行、77.7%削減）。smoke ALL PASSED。TASK_047 完了
- 次の中断可能点: 次タスク着手前

### アーカイブ済み（Issue #91, #今日）

- add-ui-design-gadget-and-dynamic-tabs
- polish-ui-feedback-response
- ui-future-enhancements
- add-gadgets-modularization
- add-lucide-icons
- ui-stability-and-cleanup

### 継続（未完了）

- add-modular-ui-wiki-nodegraph
- graphic-novel-font-decoration
- hud-customization-enhancement
- polish-ui-from-test-feedback
- story-wiki-implementation
- ui-enhancements

## VERSION

- `VERSION`: 0.3.24
- `package.json`: 0.3.24
- バージョンは現状、実装/CI では参照されておらず（docs の運用・リリース手順で参照）、差分は主にリリース運用上の不一致
- 2026-01-29: VERSION と package.json を 0.3.24 に同期

## 決定事項

- 全プロジェクトで「複合ミッション・ワークフロー」と「CI 連携マージ」を採用
- リポジトリ直下で AI_CONTEXT.md を維持し、作業の区切りで更新
- E2E は Playwright を採用。`scripts/run-two-servers.js` を webServer で起動し、同一/クロスオリジンを自動検証する
- Mission 9 では sidebar の開閉とアニメーションをテスト中に制御する暫定措置を採用（Issue #78 でフォローアップ）
- Mission 10 では DocFX を用いたドキュメントサイト構築と GitHub Pages 自動デプロイを実装する
- Mission 12 以降では、サイドバーの利便性機能（例: 執筆目標）は原則ガジェット化し、ガジェット/アコーディオン内の並び替え・表示制御を計画的に整備する
- CSS変数 `--app-bg-gradient` を導入し、背景グラデーションはガジェットから制御
- SidebarManager に `addTab/removeTab/renameTab` を追加し、UI Settings ガジェットから操作・永続化（`settings.ui.customTabs`）
- OpenSpec 変更票は `openspec/changes/add-ui-design-gadget-and-dynamic-tabs/` に配置（proposal/tasks/specs）
- Lucide アイコンセットを導入し、最小サブセット（Eye, EyeOff, Settings）でUIテキストラベルを置き換え
- dev-check.js を現行UI構造（multi-panel）に対応し、プラグイン廃止・ガジェット構造チェックを更新
- マジックナンバーを定数化（SidebarManager.TRANSITION_TIMEOUT_MS, EditorManager タイマー関連定数）
- 重複コード削減のため updateSettingsPatch() ヘルパーを導入し、設定更新パターンを統一

## リポジトリ構成（中央ワークフロー採用）

- 共有リポジトリ: `YuShimoji/shared-workflows`
  - 目的: 再利用可能な GitHub Actions ワークフローを提供
  - 参照タグ: `v2.0`
  - 提供ワークフロー:
    - `.github/workflows/ci-smoke.yml`（workflow_call）

## ブランチ戦略

- `main`: 安定ブランチ。PRは基本 Squash Merge。
- `develop`: 統合ブランチ。`feat/**`, `chore/**`, `docs/**`, `fix/**` からの集約。
- 命名規則: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`。

## CI/Sync 運用

- CI Smoke: push（`main`, `develop`, `feat/**`）、pull_request、workflow_dispatch で起動。
- Sync Issues: `docs/ISSUES.md` 変更で起動、または手動実行。
- 共有ワークフローは `secrets: inherit` で呼び出し。

## ローカル検証

- 開発サーバー: `node scripts/dev-server.js`（PORT 可変: `--port` / `-p` / `PORT`）
- 2ポート同時起動: `node scripts/run-two-servers.js`（8080/8081）
- スモークテスト: `node scripts/dev-check.js` → `ALL TESTS PASSED` を確認
- クロスオリジン検証手順: `docs/EMBED_TESTING.md`（v1.1 付録参照）

## 自律的再開プロトコル（チェックリスト）

1. 状況把握
   - `git status -sb` で未コミット/見慣れないブランチ有無を確認
   - ワークフローが共有版を参照しているか（`uses: YuShimoji/shared-workflows/...@v0.1.0`）
   - 共有リポジトリが参照可能か（`gh repo view YuShimoji/shared-workflows`）

2. 計画
   - 完了済みの作業はスキップし、未着手/未完了のタスクのみを実行
   - 変更は Issue 起票 → ブランチ作成 → 小さくコミット → PR → CI 確認 → マージ
   - 変更は必ずファイルを直接編集し、コマンドはローカルで実行
   - PR は `gh` で作成、Squash Merge を既定

3. セーフガード
   - コンフリクトや手動解決が必要な場合は即時停止し、状況/推奨解を報告

## 参考

- プロジェクト健全性: `docs/PROJECT_HEALTH.md`
- タスク管理: `docs/tasks/README.md`
- テスト方針: `docs/TESTING.md`
- 利用手順: `docs/USAGE.md`
- 埋め込みSDK: `docs/EMBED_TESTING.md`

## リスク/懸念

- ルール適用の浸透（コントリビュータ周知）

## Backlog（将来提案）

### 最近解決

- ✅ gadgets.js モジュール化完了（core/utils/loadouts/init/builtin に分割）
- ✅ TypographyThemes ガジェットを Themes/Typography/VisualProfile に分割
- ✅ 旧 gadgets.js を js/_legacy/ にアーカイブ
- ✅ dev-check.js を新モジュール構造に対応
- ✅ ドキュメント更新（GADGETS.md, VISUAL_PROFILE.md, REFACTORING_PLAN.md）
- ✅ フェーズ C/D 完了（サイドバー構造安定化、HUD拡張）
- ✅ テーマプリセット調整（dark のグレー化、night 追加）と THEMES/BACKLOG 更新
- ✅ フローティングパネルのタイトル編集とタイトル永続化（Phase E）
- ✅ Selection Tooltip v1 実装（テキスト選択に連動した装飾/挿入ツールチップ、EDITOR_EXTENSIONS.md 準拠）
- ✅ Wikilinks/バックリンク/グラフ機能実装 (TASK_044)

### 残存課題

- editor.js (1763行) / app.js (1437行) の整理（各 500行以下を目標）
- Typora風ツリーペインの実装（ドキュメント管理の階層化）
- 汎用フローティングパネル機能（任意ガジェットの切り離し）
- ガジェットD&D機能の実装（将来機能）
- ガジェット登録APIの型安全性強化

### 将来機能

- **Phase E: パネル・レイアウト機能**
  - フローティングパネル機能（サイドバーから切り離し、透明度調整）
  - 柔軟なタブ配置システム（上下左右への配置）
  - タブへのガジェット動的割り当て（ドラッグ&ドロップ）
- **長期課題**
  - Typora風ツリーペイン（ドキュメント階層管理）
  - live preview差分適用（morphdom等によるDOM差分更新）
  - プラグイン拡張システム（ユーザー定義ガジェット）
- Mission 13: 表現力の強化（グラフィックノベル対応・フォント装飾）
- Mission 14: 管理能力の向上（高度なドキュメント管理機能）
- CONTRIBUTING.md に v1.1 へのリンク追加
- PR テンプレートに「中断可能点」欄を標準化
- dev-check に AI_CONTEXT.md の存在と最終更新日時の妥当性チェックを追加

## タスク管理（短期/中期/長期）

### 短期（Next）

- [pending] コラージュレイアウト機能実装 (ref: docs/tasks/TASK_019_collage_layout.md, Status: CLOSED)
- [pending] テキストアニメーション機能実装 (ref: docs/tasks/TASK_020_text_animation.md, Status: CLOSED)
- [pending] ビジュアルUIエディタ実装 (ref: docs/tasks/TASK_033_visual_ui_editor.md, Status: CLOSED)
- [pending] レスポンシブUI改善（モバイル/タブレット対応） (ref: docs/tasks/TASK_036_responsive_ui_improvement.md, Status: CLOSED)
- [pending] アクセシビリティ向上（キーボード操作、スクリーンリーダー対応） (ref: docs/tasks/TASK_037_accessibility_improvement.md, Status: CLOSED)
- [pending] Embed SDK の same-origin 判定と origin 検証の正規化 (ref: docs/tasks/TASK_039_audit_embed_sdk.md, Status: CLOSED)
- [pending] smoke/dev-check の期待値と現行実装の整合監査 (ref: docs/tasks/TASK_041_audit_smoke_dev_check.md, Status: COMPLETED)
- [pending] 柔軟なタブ配置システム (Flexible Tab Placement) (ref: docs/tasks/TASK_045_flexible_tab_placement.md, Status: OPEN)
- [pending] editor.js Refactoring (ref: docs/tasks/TASK_046_refactor_editor_js.md, Status: OPEN)
- [pending] app.js Refactoring (ref: docs/tasks/TASK_047_refactor_app_js.md, Status: OPEN)
- [pending] Generic Floating Panel (ref: docs/tasks/TASK_048_generic_floating_panel.md, Status: OPEN)
- [x] Audit Smoke Test Expectations (ref: docs/tasks/TASK_049_audit_smoke_expectations.md, Status: COMPLETED)
- [x] Audit OpenSpec Triage (ref: docs/tasks/TASK_050_audit_openspec_triage.md, Status: COMPLETED)
- [pending] Plugin System Design (ref: docs/tasks/TASK_051_plugin_system_design.md, Status: OPEN)
- [pending] Gadget API Type Safety (ref: docs/tasks/TASK_052_gadget_api_type_safety.md, Status: OPEN)
- [x] UI Stability and Cleanup (ref: docs/tasks/TASK_053_ui_stability_cleanup.md, Status: COMPLETED)
- [pending] Graphic Novel Ruby Text (ref: docs/tasks/TASK_054_graphic_novel_ruby_text.md, Status: OPEN)

### Worker完了ステータス

- **Worker完了ステータス**: TASK_001: completed, TASK_005: completed, TASK_002: completed, TASK_003: completed, TASK_004: completed, TASK_006: completed, TASK_044: completed
