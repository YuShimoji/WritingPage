# WP-004 Phase 3 — preview / Reader HTML 整合（監査台帳）

> 目的: MD プレビューと読者プレビューの **パイプライン直前〜適用後** の差分を追跡し、1 件ずつ E2E または仕様で固定する。  
> 正本の運用ルール: [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)「開発スライスの進め方」、ガードレール E2E: [`e2e/reader-wysiwyg-distinction.spec.js`](../e2e/reader-wysiwyg-distinction.spec.js)。

## アーキテクチャ（2026-04 時点）

| 段階 | コンポーネント | 備考 |
|------|----------------|------|
| Markdown→素 HTML | [`js/zw-markdown-it-body.js`](../js/zw-markdown-it-body.js) `ZWMdItBody.renderToHtmlBeforePipeline` | preview は `editorManager` 渡しで `_markdownRenderer` 共用。Reader は `richTextEditor.markdownRenderer` または共有フォールバック |
| 後処理 | [`js/zw-postmarkdown-html-pipeline.js`](../js/zw-postmarkdown-html-pipeline.js) `surface: 'preview' \| 'reader'` | Reader のみ最終 `convertForExport` |
| インライン記法 | [`js/zw-inline-html-postmarkdown.js`](../js/zw-inline-html-postmarkdown.js) | wikilink / 傍点 / ルビ |
| Reader 専用 DOM 後処理 | [`js/reader-preview.js`](../js/reader-preview.js) `injectToc` / `injectNavBars` 等 | 本台帳の「パイプライン出力」とは別層（FR-003 の境界はパイプラインまで） |

## 自動検証でカバー済み（列挙）

| 観点 | テスト（概要） |
|------|----------------|
| chapter:// → preview `.chapter-link` / reader `#` | `reader-wysiwyg-distinction` |
| `\|漢字《かな》` ルビ preview=reader | 同上 |
| `[bold]…[/bold]` 装飾（ZWMdItBody 経由）preview=reader | 同上 |
| wikilink / 傍点 | 同上 |
| UI モードと WYSIWYG 切替 | 同上 |

## 手動で並べる価値があるシナリオ（差分チケット用）

以下は **原稿の組み合わせ** で初めて出る差分がありうるため、リリース前またはスライス単位で MD プレビューと Reader を並べて確認する。

1. **chapterMode 複数章** + 章末ナビ + `chapter://` 相互リンク  
2. **:::zw-textbox** にプリセット・tilt・anim 付き + 同段落に `[italic]…[/italic]`  
3. **:::zw-typing** / **:::zw-dialog** とルビ記法の混在  
4. **壊れ Wiki リンク**（`is-broken`）と Reader ポップオーバー  
5. **ジャンルプリセット**（Reader 専用 UI）適用後の見え方（パイプライン後の CSS 層）

差分を見つけたら: **1 トピック = 1 PR**、可能なら `reader-wysiwyg-distinction.spec.js` に最小の `evaluate` アサーションを追加。

## 既知の技術メモ

- **`TextboxRichTextBridge.projectRenderedHtml` の `target`（preview / reader / wysiwyg）**: 現行の [`TextExpressionPresetResolver.resolveTextbox`](js/modules/editor/TextExpressionPresetResolver.js) は `options.target` を解像度に使わず、`reduceMotion` と設定のみ参照する。preview と reader のテキストボックス HTML は **同一解決経路**（面別差分が必要になったら別仕様で明示する）。詳細は [`docs/specs/spec-textbox-render-targets.md`](specs/spec-textbox-render-targets.md)。

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-04-06 | 初版。ZWMdItBody 導入後の監査台帳として追加 |
