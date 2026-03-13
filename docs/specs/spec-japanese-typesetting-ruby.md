# SP-059 日本語組版/ルビ拡張仕様（v0.3）

## 目的

ルビを中心に、日本語小説で必要な組版機能（ルビサイズ/位置、傍点・圏点、表示切替）を段階導入する。

## 背景（現状 v0.3.29）

- ルビ入力は `{漢字|かんじ}` 記法に統一済み（`js/app-editor-bridge.js`）。
- Preview 側は `{Kanji|Kana}` を `<ruby>Kanji<rt>Kana</rt></ruby>` に変換（`js/editor-preview.js`）。
- レガシー記法 `|漢字《かな》` もプレビュー時に自動変換される（後方互換）。
- `ruby/rt` の基本CSSスタイルを `css/style.css` に定義済み。
- 傍点/圏点の仕様・保存形式・変換ルールは未定義（Phase 3 以降）。

## Phase 1 実装済み（v0.3.29）

### 記法

- **正規記法**: `{漢字|かんじ}` — 入力・保存・表示すべてこの形式
- **レガシー互換**: `|漢字《かな》` — プレビュー時に自動で `<ruby>` に変換
- **Markdownリファレンスガジェット**: `{漢字|かんじ}` 記法を案内済み

### CSS

- `rt` のフォントサイズ: `0.5em`
- 色: `var(--text-color)` / opacity: `0.85`
- 印刷時もスタイル保持

### E2Eテスト

- `{漢字|かんじ}` プレビュー変換テスト
- 複数ルビ連続テスト
- レガシー記法 `|漢字《かな》` プレビュー変換テスト

## Phase 2 実装済み（v0.3.30）

### ルビ表示設定

Typography ガジェット (theme グループ) に「ルビ」セクションを追加。

| 設定 | ストレージキー | CSS変数/属性 | 範囲 | デフォルト |
|------|---------------|-------------|------|-----------|
| ルビサイズ比 | `settings.ruby.sizeRatio` | `--ruby-size-ratio` | 0.3~0.7 (step 0.05) | 0.5em |
| ルビ位置 | `settings.ruby.position` | `--ruby-position` | over / under | over |
| ルビ表示 | `settings.ruby.visible` | `data-ruby-hidden` 属性 | true / false | true |

### 非表示時の挙動

`html[data-ruby-hidden='true'] rt` ルールにより:
- `visibility: hidden` + `font-size: 0` + `line-height: 0` で完全にコラプス
- ベーステキスト (`<ruby>` 内の本文) はそのまま表示
- DOM変更なし (属性切り替えのみ)
- 印刷時も非表示設定を尊重

### 変更ファイル

- `js/storage.js` — `DEFAULT_SETTINGS.ruby` 追加、normalize/merge 対応
- `js/theme.js` — `applyRubySettings()` メソッド追加
- `css/style.css` — ルビCSS変数化 + `data-ruby-hidden` ルール
- `js/gadgets-typography.js` — 「ルビ」セクション (スライダー + セレクト + チェックボックス)

### E2Eテスト

- ルビサイズ変更: `--ruby-size-ratio` CSS変数の反映確認
- ルビ非表示: `data-ruby-hidden` 属性の切り替え確認
- ルビ位置: `--ruby-position` CSS変数の反映確認

## Phase 3（未実装）

### 傍点・圏点

- 記法（例: `[kenten]...[/kenten]`）
- CSS `text-emphasis` の対応方針
- 印刷/PDF 時のフォールバック規定

## 優先順位

- Phase 1: done (記法統一 + CSS)
- Phase 2: done (表示設定)
- Phase 3: todo (傍点・圏点)

## 依存関係

- 前提: `SP-055`（Markdown/WYSIWYG 往復品質）
- 連携: `SP-057`（段落組版）、`SP-061`（Visual Profile パック）

## 受け入れ基準

1. ルビ入力から preview/print まで `{漢字|かな}` 記法で崩れず表示できる。 -- done
2. レガシー記法 `|漢字《かな》` をプレビュー時に互換変換できる。 -- done
3. ルビの表示ON/OFFを切替えても本文内容は不変。 -- done
4. ルビサイズ比・位置の変更がリアルタイムに反映される。 -- done
5. 傍点・圏点が未対応環境でも可読なフォールバックになる。 -- Phase 3

## 実装リスク

- 既存保存データの記法混在 → レガシー変換で対応済み（Phase 1）
- ブラウザごとの `ruby-position: under` サポート差 → Chrome v129+, Firefox 対応。Safari 部分対応。フォールバックは `over`
- WYSIWYG DOM 編集時に `ruby/rt` ノードが壊れやすい → CSS のみで制御、DOM 操作なし
