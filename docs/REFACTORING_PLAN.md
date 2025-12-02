# Zen Writer リファクタリング計画

## 1. 現状分析

### 1.1 ファイルサイズ分析（行数順、更新: 2025-12-03）

| ファイル | 行数 | 状態 | 優先度 |
|---------|------|------|--------|
| editor.js | 1763 | 要整理 | 中 |
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
