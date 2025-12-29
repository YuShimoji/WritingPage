# AI_CONTEXT — 開発プロトコルと自律的再開のための前提情報

この文書は、エージェント/開発者が作業を中断/再開する際に必要な前提情報をコンパクトに提供します。

- 最終更新: 2025-12-19T15:09:00+09:00

## 中央ルール参照（SSOT）

- SSOT（latest）: `.shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md`
- 運用者の入口: `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md`
- オーケストレーション（毎回コピペ）: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_METAPROMPT.md`
- オーケストレーション手順（参照）: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
- 運用ストレージ: `docs/HANDOVER.md`, `docs/tasks/`, `docs/inbox/`
- async_mode: true

- 現在のミッション: サイドバータブ/ガジェット基盤の安定化（customTabsグループ認識・登録先単一化）
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
  - 2025-12-16: `docs/KNOWN_ISSUES.md` の改善済みバージョン表記を現行 `0.3.18` に同期
  - 2025-12-17: グラフィックノベル向けロードアウト（graphic-novel）を追加。
    サンプル作成ガジェット（Samples）を追加し、ワンクリックでサンプル文書＋SVG画像アセット（asset://）を生成できるようにした。
    `npm run lint` / `npm run test:smoke` / `npm run test:e2e:ci` green
  - 2025-12-17: PR #95 を作成。`npm run test:smoke` / `npm run test:e2e:ci` green
  - 2025-12-17: PR #95 を squash merge し main へ反映。`npm run lint` / `npm run test:smoke` / `npm run test:e2e:ci` green
- 次の中断可能点: 次タスク着手前

## OpenSpec changes の分類（暫定）

### アーカイブ済み（Issue #91）

- add-ui-design-gadget-and-dynamic-tabs
- polish-ui-feedback-response
- ui-future-enhancements

### アーカイブ候補（実装は完了、Follow-ups残）

- add-gadgets-modularization（ユニットテスト/拡張APIドキュメント化）
- add-lucide-icons（追加アイコン導入/ダークモード対応アイコン検討）

### 継続（未完了）

- add-modular-ui-wiki-nodegraph
- graphic-novel-font-decoration
- hud-customization-enhancement
- polish-ui-from-test-feedback
- story-wiki-implementation
- ui-enhancements

### 下書き/整備不足（タスク形式・粒度の再整理が必要）

- ui-stability-and-cleanup（`openspec list` 上は No tasks）

## VERSION

- `VERSION`: 0.3.18
- `package.json`: 0.3.18
- バージョンは現状、実装/CI では参照されておらず（docs の運用・リリース手順で参照）、差分は主にリリース運用上の不一致
- 2025-12-14: `VERSION` と `package.json` を 0.3.18 に同期

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
  - 参照タグ: `v0.1.0`
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

- [pending] Investigate missing reports for completed tasks (ref: docs/tasks/TASK_005_missing_reports.md, Status: OPEN)
- [completed] 他プロジェクトへの参照方法を標準化（導入手順の最短化） (ref: docs/tasks/TASK_002_OnboardingRefStandard.md, Status: DONE)

### Worker完了ステータス
- TASK_001: completed
- TASK_005: completed
- TASK_002: completed
- TASK_003: completed
- TASK_004: completed
- TASK_006: completed
- **Worker完了ステータス**: TASK_001: completed, TASK_005: completed, TASK_002: completed, TASK_003: completed, TASK_004: completed, TASK_006: completed
