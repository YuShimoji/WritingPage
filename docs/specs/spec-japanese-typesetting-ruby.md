# SP-059 日本語組版/ルビ拡張仕様（Draft v0.1）

## 目的
ルビを中心に、日本語小説で必要な組版機能（ルビサイズ/位置、傍点・圏点、表示切替）を段階導入する。

## 背景（現状）
- ルビ挿入導線はある（`js/app-editor-bridge.js`: `|漢字《かんじ》`）。
- Preview 側の変換は `{Kanji|Kana}` 形式で、記法が分断されている（`js/editor-preview.js`）。
- 傍点/圏点の仕様・保存形式・変換ルールは未定義。

## 仕様候補
- ルビ記法を単一仕様へ統一（内部ASTまたは正規タグ）
- ルビ表示設定:
  - `rubySizeRatio`（本文比）
  - `rubyPosition`（`over` / `under`）
  - `rubyVisibility`（表示/非表示）
- 傍点・圏点:
  - 記法（例: `[kenten]...[/kenten]`）
  - CSS `text-emphasis` の対応方針
- 印刷/PDF 時のフォールバック規定

## 優先順位
- 優先度: `P2`（中）
- 理由: 作品表現の価値は高いが、記法統一と互換運用に設計コストがかかる。

## 依存関係
- 前提: `SP-055`（Markdown/WYSIWYG 往復品質）
- 連携: `SP-057`（段落組版）、`SP-061`（Visual Profile パック）
- 参考: `docs/EDITOR_EXTENSIONS.md`, `docs/ROADMAP.md`

## 受け入れ基準
1. ルビ入力から preview/print まで同一記法で崩れず表示できる。
2. 既存記法（`|漢字《かな》` と `{Kanji|Kana}`）を読み込み時に互換変換できる。
3. ルビの表示ON/OFFを切替えても本文内容は不変。
4. 傍点・圏点が未対応環境でも可読なフォールバックになる。

## 実装リスク（CTO観点）
- 既存保存データの記法混在により、変換ミスで本文破損するリスク。
- ブラウザごとの `ruby` / `text-emphasis` 実装差。
- WYSIWYG DOM 編集時に `ruby/rt` ノードが壊れやすい。

## 実装メモ
- 正規化関数を `EditorCore` に追加し、入出力の最前段で適用。
- AST を導入しない場合でも、変換順序（decor/anim/ruby）を仕様化して衝突回避。
- E2E は「挿入→保存→再読込→printプレビュー」の回帰を重点化。
