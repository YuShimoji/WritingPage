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
| 複数見出し MD + `chapter://` 相互リンク（パイプライン層・監査シナリオ1） | 同上（章末ナビ注入は別層のため本テストの対象外） |
| `\|漢字《かな》` ルビ preview=reader | 同上 |
| `:::zw-typing` / `:::zw-dialog` ブロック内の `\|漢字《かな》` ルビ（監査シナリオ3・基本パス） | 同上 |
| `:::zw-textbox` 複合（preset・tilt・anim + `[italic]…[/italic]`、監査シナリオ2） | 同上 |
| `[bold]…[/bold]` 装飾（ZWMdItBody 経由）preview=reader | 同上 |
| wikilink / 傍点 | 同上 |
| 存在しない Wiki への `[[…]]`（`is-broken`・監査シナリオ4・パイプライン層） | 同上 |
| Reader 壊れ wikilink クリック → ポップオーバー（未登録語の説明・外クリックで閉じる） | `reader-wikilink-popover.spec.js` |
| Reader 本文への章末ナビ注入（`chapterNav.enabled`・複数章 chapterMode・`.chapter-nav-bar`） | `reader-chapter-nav.spec.js`（結合層。パイプライン層の E2E とは別） |
| UI モードと WYSIWYG 切替 | 同上 |
| ジャンルプリセット（Reader 専用 UI）— `#reader-preview-inner` への `genre-*` クラス付与 | `reader-genre-preset.spec.js`（`GenrePresetRegistry.apply` / `clear` の浅い assert。見た目のピクセル比較はしない） |

## 手動で並べる価値があるシナリオ（差分チケット用）

以下は **原稿の組み合わせ** で初めて出る差分がありうるため、リリース前またはスライス単位で MD プレビューと Reader を並べて確認する。

1. **chapterMode 複数章** + 章末ナビ + `chapter://` 相互リンク  
   - **脚注**: **パイプライン層**では複数 `#` 見出し + `[t](chapter://…)` の preview/reader 整合（`data-chapter-target` 付与・reader で `chapter://` 非残留・章リンク以外の HTML 正規化一致）を E2E 済み。**章末ナビの DOM 注入**（[js/reader-preview.js](js/reader-preview.js) / [js/chapter-nav.js](js/chapter-nav.js)）は別層。**Reader 内で `.chapter-nav-bar` が注入される最小結合**は [e2e/reader-chapter-nav.spec.js](e2e/reader-chapter-nav.spec.js) で自動検証（session 59）。**長大原稿・chapter:// 相互リンク・ナビ操作の手応え**は引き続き手動で確認する。  
2. **:::zw-textbox** にプリセット・tilt・anim 付き + 同段落に `[italic]…[/italic]`  
   - **脚注**: 上記の **最小複合**（preset+tilt+anim+italic）について preview=reader の HTML 同一性は E2E 済み（`reader-wysiwyg-distinction.spec.js`）。DSL やプリセットの別組み合わせ・見た目の微差は手動で追う。  
3. **:::zw-typing** / **:::zw-dialog** とルビ記法の混在  
   - **脚注（基本パスは E2E 済み）**: 単一ブロック内で `\|漢字《かな》` ルビが入るケースの preview=reader 同一性は **E2E で固定済み**。**複数ブロックの組み合わせ・長大原稿・特殊記法の境目**は手動で確認する。  
4. **壊れ Wiki リンク**（`is-broken`）と Reader ポップオーバー  
   - **脚注**: **パイプライン層**では存在しないタイトルの `[[…]]` が preview/reader で同一 HTML かつ `is-broken` になることを E2E 済み。**Reader で壊れリンクをクリックしたときのポップオーバー**（未登録メッセージ・外クリックで閉じる）は [e2e/reader-wikilink-popover.spec.js](e2e/reader-wikilink-popover.spec.js) で自動検証（session 58）。  
5. **ジャンルプリセット**（Reader 専用 UI）適用後の見え方（パイプライン後の CSS 層）  
   - **脚注**: **クラス付与**（`genre-adv` 等）の機械的検証は `e2e/reader-genre-preset.spec.js`。**テーマ配色・タイピング演出の見た目**は手動で確認する。

差分を見つけたら: **1 トピック = 1 PR**、可能なら `reader-wysiwyg-distinction.spec.js` に最小の `evaluate` アサーションを追加。

## 既知の技術メモ

- **`TextboxRichTextBridge.projectRenderedHtml` の `target`（preview / reader / wysiwyg）**: 現行の [`TextExpressionPresetResolver.resolveTextbox`](js/modules/editor/TextExpressionPresetResolver.js) は `options.target` を解像度に使わず、`reduceMotion` と設定のみ参照する。preview と reader のテキストボックス HTML は **同一解決経路**（面別差分が必要になったら別仕様で明示する）。詳細は [`docs/specs/spec-textbox-render-targets.md`](specs/spec-textbox-render-targets.md)。

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-04-06 | 初版。ZWMdItBody 導入後の監査台帳として追加 |
| 2026-04-06 | シナリオ3（zw-typing / zw-dialog + ルビ）を `reader-wysiwyg-distinction.spec.js` で自動検証に追加 |
| 2026-04-06 | シナリオ3 に「基本=E2E・複合・境界は手動」の脚注を追加。シナリオ2（textbox 複合）を E2E に追加 |
| 2026-04-06 | シナリオ1（複数見出し + chapter://）のパイプライン層を E2E に追加。章末ナビは脚注で手動扱いを明示 |
| 2026-04-06 | シナリオ4（存在しない Wiki・`is-broken`）のパイプライン層を E2E に追加。ポップオーバーは脚注で別扱い |
| 2026-04-06 | シナリオ5（ジャンルプリセット）を `reader-genre-preset.spec.js` で浅い自動検証に追加 |
| 2026-04-06 | シナリオ4 脚注: Reader 壊れ wikilink ポップオーバーを `reader-wikilink-popover.spec.js` で E2E 化（session 58） |
| 2026-04-06 | シナリオ1 脚注: Reader 章末ナビ注入を `reader-chapter-nav.spec.js` で結合 smoke 化（session 59） |
