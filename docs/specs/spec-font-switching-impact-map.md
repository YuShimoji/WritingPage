# フォント切り替え 影響マップ（2026-03-10）

## 目的

`spec-font-switching.md` の実装を進めるにあたり、**既存の未コミット差分と共存**しながら安全に変更できる範囲を明確化する。

## 差分棚卸し（フォント仕様との関連）

### A. 直接関連（今回の実装対象）

1. `js/modules/editor/EditorUI.js`
- 関連度: 高
- 理由: `setGlobalFontSize` / `adjustGlobalFontSize` がフォントクイック変更の中核
- 対応: 破壊的保存の排除、`editorFontSize` 優先、互換 `fontSize` 同期

2. `js/app-ui-events.js`
- 関連度: 高
- 理由: Quick Tools（フローティング）で表示・入力される本文サイズのソース
- 対応: 表示初期値を `editorFontSize || fontSize` へ統一

3. `e2e/editor-settings.spec.js`
- 関連度: 高
- 理由: 設定永続化の回帰検知
- 対応: 「フォント変更時に他設定が消えない」ケース追加

4. `docs/specs/spec-font-switching.md`
- 関連度: 高
- 理由: 仕様本体
- 対応: 実装済み項目の進捗反映、採用済み意思決定の固定化

5. `docs/spec-index.json`
- 関連度: 中
- 理由: Spec Wiki 登録/進捗表示
- 対応: `SP-054` を `partial` へ更新

### B. 間接関連（共存確認のみ）

1. `js/storage.js`
- 関連度: 中
- 現状: `editor.canvas` / `editor.extendedTextbox` 追加差分あり
- フォント観点: `loadSettings` にフォント正規化（`editorFontSize` / `uiFontSize`）を追加しても機能衝突しない

2. `js/editor.js`, `js/modules/editor/EditorCore.js`, `js/app-editor-bridge.js`, `css/style.css`, `index.html`
- 関連度: 低〜中
- 現状: Canvasモード / 拡張Textbox / RichText強化の差分
- フォント観点: 直接の保存ロジック競合なし。DOM構造変更によりフォント適用先セレクタの回帰には注意

3. `e2e/wysiwyg-editor.spec.js`
- 関連度: 低
- 現状: RichText command adapter 用ケース追加
- フォント観点: 直接競合なし

## 影響マップ（モジュール依存）

1. 設定保存層
- `js/storage.js` (`loadSettings` / `saveSettings`)
- 影響: フォントサイズの正規化・後方互換の基盤

2. フォント適用層
- `js/theme.js` (`applyFontSettings`)
- `js/modules/editor/EditorUI.js` (`setGlobalFontSize`)
- 影響: CSS変数反映、即時描画、保存トリガ

3. UI入力層
- `js/gadgets-typography.js`
- `js/app-ui-events.js`（Quick Tools）
- `js/command-palette.js`（ショートカット起点）
- 影響: フォント操作導線の責務分離

4. 表示層
- `css/layout.css` / `css/style.css`
- 影響: `--font-size` と `--editor-font-size` の混在参照（互換維持が必要）

5. 検証層
- `e2e/editor-settings.spec.js`
- 影響: 設定オブジェクト破壊の検知

## リスク評価

### 高

1. 設定破壊
- 条件: `saveSettings({...})` を部分オブジェクトで直接保存
- 対策: `load -> patch -> save` へ統一

### 中

1. 旧CSS変数参照との不整合
- 条件: `--editor-font-size` だけ更新し、`--font-size` 参照箇所が残存
- 対策: 暫定的に両変数を同期し、段階的に `--editor-font-size` へ集約

2. 複数導線間の値ずれ
- 条件: Typography / Quick Tools / Command Palette で読み取りキーが異なる
- 対策: `editorFontSize || fontSize` 優先ルールを共通化

## 共存前提での変更ガード

1. Canvas / Textbox / RichText 拡張差分には触れない
2. フォント仕様で必要な最小行のみ編集
3. `editor` 設定オブジェクトの新規キーを上書きしない
4. テストはフォント回帰に限定して追加

## 次実装の対象範囲

1. `EditorUI.setGlobalFontSize` の安全化（完了）
2. Quick Tools 初期値の正規化（完了）
3. `storage.loadSettings` のフォント正規化（完了）
4. 仕様書・テスト計画の進捗反映（継続）
