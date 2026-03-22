# SP-057 マイクロタイポグラフィ仕様

**ステータス**: Phase 1 完了 (done/100%)
**最終更新**: 2026-03-12

## 目的

フォント切り替え（`SP-054`）の次段として、本文の読み心地を左右する「字間・段落間・字下げ・改行ルール」を統合管理する。

## 背景（現状）

- 現在の Typography は `fontFamily / uiFontSize / editorFontSize / lineHeight` が中心（`js/gadgets-typography.js`）。
- 文字装飾は `decor-*` があるが、段落・文レベルの読みやすさ制御は未整備（`js/modules/editor/EditorCore.js`）。

## 仕様

### 設定キー (`microTypography`)

| キー | 型 | 範囲 | デフォルト | 説明 |
|------|-----|------|-----------|------|
| `letterSpacing` | number | -0.02 ~ 0.12 (em) | 0 | 本文字間 |
| `paragraphSpacing` | number | 0 ~ 3 (em) | 1 | 段落末尾マージン |
| `paragraphIndent` | number | 0 ~ 3 (em) | 0 | 段落頭字下げ |
| `lineBreakMode` | string | `normal` / `strict-ja` | `normal` | 禁則処理モード |

### CSS変数

| CSS変数 | 対応設定 | 適用先 |
|---------|---------|--------|
| `--body-letter-spacing` | letterSpacing | `#editor`, `#wysiwyg-editor`, `.editor-preview` |
| `--paragraph-spacing` | paragraphSpacing | `#editor p`, `#wysiwyg-editor p`, `.editor-preview p` |
| `--paragraph-indent` | paragraphIndent | 同上 (text-indent) |
| `data-line-break-mode` | lineBreakMode | `html` 属性 → CSS `line-break: strict` |

### UI (Typography ガジェット内)

「本文」セクションとして4コントロール:

- 字間: range スライダー (-0.02 ~ 0.12 em, step 0.01)
- 段落間: range スライダー (0 ~ 3 em, step 0.1)
- 字下げ: range スライダー (0 ~ 3 em, step 0.5)
- 禁則処理: select (標準 / 和文禁則)

### 適用メソッド

`ThemeManager.applyMicroTypographySettings(micro)` -- CSS変数設定 + `data-line-break-mode` 属性 + 保存

## 優先順位

- 優先度: `P1`（高）
- 理由: 読み心地改善の体感が大きく、既存 UI への追加入力で段階導入しやすい。

## 依存関係

- 前提: `SP-054`（保存処理のマージ方式とフォント責務分離）
- 連携: `SP-012`（Visual Profile にタイポ値を含める）
- 将来連携: `SP-059`（和文組版設定）

## 受け入れ基準

1. Typography で字間/段落間/字下げを変更すると、エディタとプレビュー両方に即時反映される。 -- done
2. リロード後に `zenWriter_settings` から復元される。 -- done
3. Quick Tools 経由の本文サイズ変更後も、新設キーが消えない。 -- done
4. `strict-ja` 時に主要な和文禁則（句読点行頭回避）が効く。 -- done (CSS `line-break: strict`)

## 実装ファイル

- `js/storage.js`: `DEFAULT_SETTINGS.microTypography` + normalizeSettingsShape + mergeSettings
- `js/theme.js`: `applyMicroTypographySettings()` メソッド
- `js/gadgets-typography.js`: 「本文」セクション UI
- `css/style.css`: CSS変数定義 + 禁則処理ルール
- `e2e/editor-settings.spec.js`: E2E テスト 2件

## 実装リスク（CTO観点）

- CSS差分だけでは禁則制御が不完全になる可能性（ブラウザ差異）。
- WYSIWYG と Markdown preview で段落DOMが異なり、表示差が出る。
- 長文時に再レイアウト頻度が増え、入力遅延の原因になりうる。
