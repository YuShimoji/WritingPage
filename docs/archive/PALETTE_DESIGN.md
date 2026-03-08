# PALETTE DESIGN — カラーパレットUI 設計

## 目的

- 配色を「プリセット」や「パレット（色チップ）」から素早く選択できる
- 適用前にプレビュー可能（ホバーで一時適用）
- 決定/取消を明確にして、誤操作を防止

## UI案

- 既存のサイドバー（`index.html` の `aside.sidebar` 内）にセクション追加
  - 見出し: 「パレット」
  - コンポーネント: `div.palette` 内に色チップ（`button.palette-swatch`）をグリッド表示
  - 操作: `プレビュー（hover）/ 適用（click）/ 取消（Undoボタン）`
- 代替案: フローティングパレット（エディタ右下）
  - パレットをトグルで表示し、少ない移動で選択可能

## 振る舞い

- ホバー: 一時的に `--bg-color` / `--text-color` を上書き（プレビュー）
- ホバー解除: 元の状態に戻す
- クリック: 確定適用し、`settings` を保存（`storage.js`）
- 取消: 直前の状態に戻す（直前の `settings` を一時保持して復元）

## アクセシビリティ

- 色チップには `aria-label`（例: "Warm Sepia", "High Contrast"）
- キーボード操作: `Tab` でフォーカス移動、`Enter/Space` で適用、`Esc` でプレビュー解除
- コントラスト: ダーク背景/ライト背景ともに十分な視認性

## データモデル

- プリセットの定義（例）

```json
{
  "name": "Warm Sepia",
  "bgColor": "#f3e7d3",
  "textColor": "#4a3b2a",
  "accent": "#9c6b48"
}
```

- 配列で管理して `theme.js` から参照
- `accent` は `--focus-color` に適用

## 保存

- `window.ZenWriterStorage.saveSettings()` により `theme/bg/text/accent` を保存
- ユーザー定義のプリセットは `zenWriter_userPalettes`（LocalStorage）に配列で保存

## 実装ポイント

- `theme.js`
  - `applyCustomColors(bg, text, accent?)` に `accent` を追加対応
  - プレビュー用に現在値を退避しておくヘルパー
- `app.js`
  - パレット生成（定義配列からDOM作成）
  - ホバー/フォーカス/クリック/取消のイベント設定
- `style.css`
  - `.palette` グリッドレイアウト、`.palette-swatch` のサイズ・枠線・フォーカスリング

## テスト（TESTING.mdへの追補）

- パレットホバーでの一時適用/解除
- パレットクリックでの確定適用と永続化
- 取消操作での復元
- キーボード操作（フォーカス移動/適用/解除）

## 将来拡張

- ユーザー定義プリセット（保存/読み込み/削除、JSONエクスポート/インポート）
- システムのダーク/ライトに追従（`prefers-color-scheme`）
