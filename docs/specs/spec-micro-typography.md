# SP-057 マイクロタイポグラフィ仕様（Draft v0.1）

## 目的
フォント切り替え（`SP-054`）の次段として、本文の読み心地を左右する「字間・段落間・字下げ・改行ルール」を統合管理する。

## 背景（現状）
- 現在の Typography は `fontFamily / uiFontSize / editorFontSize / lineHeight` が中心（`js/gadgets-typography.js`）。
- 文字装飾は `decor-*` があるが、段落・文レベルの読みやすさ制御は未整備（`js/modules/editor/EditorCore.js`）。
- `DEFAULT_SETTINGS` に段落タイポ項目がなく、保存・復元の対象外（`js/storage.js`）。

## 仕様候補
- 本文字間: `letterSpacing`（例: `-0.02em`〜`0.12em`）
- 段落間: `paragraphSpacing`（段落末尾マージン）
- 段落頭字下げ: `paragraphIndent`（和文向け既定 `1em`）
- 行頭禁則/ぶら下げ記号: `lineBreakMode`（`normal` / `strict-ja`）
- Markdown/WYSIWYG/Preview の表示一致基準を定義

## 優先順位
- 優先度: `P1`（高）
- 理由: 読み心地改善の体感が大きく、既存 UI への追加入力で段階導入しやすい。

## 依存関係
- 前提: `SP-054`（保存処理のマージ方式とフォント責務分離）
- 連携: `SP-012`（Visual Profile にタイポ値を含める）
- 将来連携: `SP-059`（和文組版設定）

## 受け入れ基準
1. Typography で字間/段落間/字下げを変更すると、エディタとプレビュー両方に即時反映される。
2. リロード後に `zenWriter_settings` から復元される。
3. Quick Tools 経由の本文サイズ変更後も、新設キーが消えない。
4. `strict-ja` 時に主要な和文禁則（句読点行頭回避）が効く。

## 実装リスク（CTO観点）
- CSS差分だけでは禁則制御が不完全になる可能性（ブラウザ差異）。
- WYSIWYG と Markdown preview で段落DOMが異なり、表示差が出る。
- 長文時に再レイアウト頻度が増え、入力遅延の原因になりうる。

## 実装メモ
- 設定キー追加先: `js/storage.js` `DEFAULT_SETTINGS`。
- 適用基盤: `ThemeManager.applyFontSettings()` からの分離を推奨（`applyTypographySettings` 新設）。
- E2E: `e2e/editor-settings.spec.js` に復元と双方向同期の検証を追加。
