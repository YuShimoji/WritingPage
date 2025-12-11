# AI_CONTEXT — 開発プロトコルと自律的再開のための前提情報

この文書は、エージェント/開発者が作業を中断/再開する際に必要な前提情報をコンパクトに提供します。

- 最終更新: 2025-12-11T22:30:00+09:00
- 現在のミッション: テーマ集中管理基盤の構築・editor.js/app.js の段階的分割とUI基盤リファクタリング継続
- ブランチ: main
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
  - A-1: editor-search.js 抽出完了（検索/置換ロジックを分離、editor.js 1763→1466 行）
  - B-1: フローティングパネルUI改善完了（透明度調整スライダー、折りたたみ/展開ボタン、状態永続化）
- 次の中断可能点: C-4（マイグレーションとテスト）、E-3（柔軟なタブ配置）、editor/app 分割続行

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
