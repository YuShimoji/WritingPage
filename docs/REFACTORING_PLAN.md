# Zen Writer リファクタリング計画

## 1. 現状分析

### 1.1 ファイルサイズ分析（行数順、更新: 2025-12-11）

| ファイル | 行数 | 状態 | 優先度 |
|---------|------|------|--------|
| editor.js | 1466 | 要整理（縮小中） | 中 |
| app.js | 1437 | 要整理 | 中 |
| storage.js | 640 | 許容範囲 | 低 |
| gadgets-editor-extras.js | 518 | 許容範囲 | 低 |
| images.js | 495 | 許容範囲 | 低 |
| gadgets-builtin.js | 477 | 許容範囲 | 低 |
| gadgets-core.js | 432 | 許容範囲 | 低 |
| ui-labels.js | 402 | 許容範囲 | 低 |
| wiki.js | 380 | 許容範囲 | 低 |
| sidebar-manager.js | 368 | 許容範囲 | 低 |
| gadgets-help.js | 364 | 許容範囲 | 低 |

> ✅ **gadgets.js (2994行)** はモジュール化完了、`js/_legacy/gadgets.js` にアーカイブ済み

### 1.2 特定された問題点

#### A. コード品質の問題

1. **gadgets.js の肥大化 → 解決済み**
   - `gadgets-core.js`: ZWGadgetsクラス定義
   - `gadgets-utils.js`: ユーティリティ関数
   - `gadgets-loadouts.js`: ロードアウト管理
   - `gadgets-init.js`: UI初期化
   - `gadgets-builtin.js`: ビルトインガジェット
   - `gadgets-themes.js`: Themesガジェット
   - `gadgets-typography.js`: Typographyガジェット
   - `gadgets-visual-profile.js`: VisualProfileガジェット
   - → **単一責任の原則に準拠**

2. **重複コード**
   - StoryWiki ガジェットが gadgets.js 内でコメントアウト（wiki.js に別実装あり）
   - 似たようなUI生成コード（makeSection, makeRow等）の重複

3. **ハードコーディング**
   - DEFAULT_LOADOUTS のガジェット名がハードコード
   - パネルIDがコード内に散在

#### B. テストとの不整合

1. **smoke test 失敗項目**
   - `plugins-panel` ID が存在しない
   - `gadgets-panel` ID が存在しない（個別パネルIDに変更済み）
   - `gadget-export`, `gadget-import`, `gadget-prefs-input` UIが存在しない

2. **DOM構造の変化に対応していないテスト**
   - 旧UI構造を期待するテストが残っている

#### C. 未実装・仮実装

1. **UIモード（Normal/Focus/Blank）**
   - 仕様は定義済みだが、完全な実装は未完了

2. **ツールレジストリ**
   - `js/tools-registry.js` はスケルトン実装のみ
   - 既存ガジェット/ボタンとの接続なし

3. **プラグインシステム**
   - `js/plugins/` にファイルはあるが、UIパネルなし

## 2. リファクタリング計画

### フェーズ1: テスト整合性の修正（即時対応）

1. `scripts/dev-check.js` を現在のUI構造に合わせて更新
   - `gadgets-panel` → `structure-gadgets-panel` 等に変更
   - プラグインパネルのチェックをオプション化
   - import/export UIの期待値を現実に合わせる

### フェーズ2: gadgets.js の分割 ✅ 完了

```text
js/gadgets.js (2994行) → js/_legacy/gadgets.js にアーカイブ
  ↓ 分割完了
js/
  ├── gadgets-core.js       # ZWGadgetsクラス、基本API (432行)
  ├── gadgets-loadouts.js   # ロードアウト管理
  ├── gadgets-utils.js      # ユーティリティ関数
  ├── gadgets-init.js       # UI初期化
  ├── gadgets-builtin.js    # Documents, Outline, Clock等 (477行)
  ├── gadgets-themes.js     # Themesガジェット (244行)
  ├── gadgets-typography.js # Typographyガジェット (218行)
  └── gadgets-visual-profile.js # VisualProfileガジェット (194行)
```

### フェーズ3: 命名規則の統一

1. **CSSクラス**: `kebab-case` (gadget-wrapper, sidebar-tab)
2. **JavaScript変数/関数**: `camelCase` (loadPrefs, savePrefs)
3. **定数**: `UPPER_SNAKE_CASE` (STORAGE_KEY, KNOWN_GROUPS)
4. **DOM ID**: `kebab-case` (structure-gadgets-panel)

### フェーズ4: 重複コードの統合

1. **UI生成ユーティリティ**
   - `makeSection`, `makeRow` 等を `js/ui-utils.js` に集約

2. **ストレージ操作**
   - localStorage操作を `storage.js` に統一

### フェーズ5: 未実装機能の完成

1. **プラグインパネル**（低優先度）
2. **ガジェット設定のimport/export UI**
3. **UIモードの完全実装**

## 3. 実行順序

### 即時（完了）

1. [x] リモート更新の同期とコンフリクト解消
2. [x] smoke test を現在のUI構造に合わせて修正
3. [x] コメントアウトされた重複コードの削除

### 短期（完了）

1. [x] gadgets.js の分割（core.js, loadouts.js, utils.js, init.js）
2. [x] ビルトインガジェットの個別ファイル化
3. [x] TypographyThemes ガジェットを Themes/Typography/VisualProfile に分割
4. [x] gadgets.js を `js/_legacy/` にアーカイブ

### 中期（次フェーズ）

1. [ ] editor.js, app.js の整理（各 500行以下を目標）
2. [ ] 未実装機能の実装（フローティングパネル、ドラッグ&ドロップ）

## 4. 品質基準

- **単一責任の原則**: 1ファイル1責務、最大500行を目標
- **テストカバレッジ**: smoke test 100% パス、e2e test 主要フロー対応
- **命名規則**: 上記ルールに100%準拠
- **ドキュメント**: 主要関数にJSDocコメント

## 5. リスク管理

- **段階的移行**: 一度に大きな変更を避け、小さなコミットで進める
- **テスト駆動**: 変更前後でテストを実行し、リグレッションを防止
- **バックアップ**: 主要な変更前にブランチを作成

## 6. editor.js / app.js 分割方針（ドラフト）

### 6.1 目標と制約

- 目標行数: 各ファイル 500 行程度を目安に、責務ごとに分割する。
- 互換性: `window.ZenWriterEditor` / 既存のグローバル関数・ショートカットの挙動は維持する（呼び出し側 API は極力変更しない）。
- 段階的移行: まずは「中身を別ファイルに移す」形でラップし、最終的に app.js から責務を徐々に削っていく。

### 6.2 editor.js 分割案

現状の EditorManager（単一ファイル 1763 行）を、主に以下の責務に分割する想定。

- `editor-core.js`
  - EditorManager 本体のコンストラクタ
  - コンテンツロード/保存、カーソル位置/スクロール位置の復元
  - 基本的な入力ハンドラ（input, keydown など）と `updateWordCount()` まわり
- `editor-preview.js`
  - Markdown レンダリング、デバウンス版/即時版のプレビュー更新
  - morphdom ベースの差分適用処理
- `editor-search.js`
  - エディタ内検索/置換 UI とマッチリスト管理
  - `getTextPosition()` を含む検索用ハイライト座標計算
- `editor-overlays.js`
  - エディタオーバーレイ（文字数スタンプ等）の描画・更新
  - スクロール/リサイズ時の overlay 再配置ロジック
- `editor-images.js`
  - 画像ペースト/ドラッグ&ドロップ処理
  - 画像挿入キューやストレージ連携（あれば）

移行ステップ（例）:

1. 既存 editor.js から、明確に独立している関数群（画像処理、検索 UI など）をそのままコピーし、新ファイルにモジュールとして切り出す。
2. editor.js 側には「インポート＋薄い委譲関数」のみを残し、外部 API (`window.ZenWriterEditor`) は維持する。
3. 開発サーバー＋ `npm run test:smoke` で挙動確認。
4. 安定後、徐々に editor.js 本体からロジックを削除し、「EditorManager 定義＋エントリポイント」程度の薄いファイルに縮小していく。

**進捗メモ（2025-12-07〜2025-12-11 時点）**
- `editor-preview.js` に Markdown プレビュー処理を抽出し、EditorManager からは `editorPreview_renderMarkdownPreview*` を経由して委譲。
- `editor-images.js` に画像ペースト/ドラッグ&ドロップ、画像挿入用 Markdown 生成、旧 `data:image` 埋め込みの Asset 化、および画像プレビュー生成処理を抽出し、EditorManager からは薄いラッパーのみ残す構成に変更。
- `editor-overlays.js` にオーバーレイ描画（画像オーバーレイ・インラインスタンプ）、ドラッグ/リサイズハンドラ、mirror HTML 構築処理を抽出し、EditorManager 側には薄いラッパーのみ残す構成に変更。
- `editor-search.js` に検索・置換機能（`updateSearchMatches`, `navigateMatch`, `replaceSingle`, `replaceAll`, `getTextPosition` 等）を抽出し、EditorManager からは薄い委譲メソッドのみ残す構成に変更（2025-12-11）。
- 各抽出ステップ後に `npm run test:smoke` を実行し、最新状態でも **ALL TESTS PASSED** を確認済み。
- **editor.js**: 1763 行 → 1466 行（約 300 行削減）

### 6.3 app.js 分割案

app.js（1437 行）についても、以下のような UI レイヤ別の分割を想定する。

- `app-core.js`
  - DOMContentLoaded 相当のエントリポイント
  - ElementManager の初期化とグローバル設定ロード
- `app-layout.js`
  - サイドバー開閉、UI モード (Normal/Focus/Blank) 切り替え
  - ツールバー/ヘッダー/FAB の表示制御
- `app-gadgets-bridge.js`
  - Gadgets 系モジュールとのブリッジ（ロードアウト初期化、パネルへのガジェット割り当て）
- `app-editor-bridge.js`
  - EditorManager との接続（ショートカット、HUD/プレビューとの連携）
  - Selection Tooltip など Editor 依存 UI の初期化
- `app-embed.js`
  - 埋め込みモード（`embed=1`）関連の軽量初期化ロジック

移行ステップ（例）:

1. app.js の末尾にある初期化処理を `app-core.js` に移し、app.js 側は「レガシー互換レイヤ」として段階的に薄くしていく。
2. サイドバー/ツールバーなどレイアウト系の関数群を `app-layout.js` に移動し、依存するグローバル変数・セレクタを最小限のインポートで受け取る構造に変更。
3. Gadgets 初期化・ロードアウト処理を `app-gadgets-bridge.js` に移し、将来的にガジェット側からも再利用しやすい形にする。
4. Editor 関連のショートカット・HUD 接続・Selection Tooltip 初期化を `app-editor-bridge.js` に分離し、editor.js の分割結果と合わせて責務境界を明確化。
5. 各ステップごとに `npm run test:smoke` を実行し、Phase ごとの安定ポイントを HANDOVER / AI_CONTEXT に記録する。
