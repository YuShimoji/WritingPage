# spec-textbox-render-targets — テキストボックス投影の `target`（preview / reader / wysiwyg）

## 目的

[`js/modules/editor/TextboxRichTextBridge.js`](../../js/modules/editor/TextboxRichTextBridge.js) が `projectRenderedHtml(html, { settings, target })` に渡す **`target`** の意味と、現行実装での **実効差分** を一文書に固定する。WP-004 Phase 3 のフォローアップ（面別調整が必要か）の判断材料とする。

## 呼び出し元

| 経路 | `target` 値 |
|------|-------------|
| [`js/zw-postmarkdown-html-pipeline.js`](../../js/zw-postmarkdown-html-pipeline.js) | `preview` または `reader`（`surface` に連動） |
| [`js/editor-wysiwyg.js`](../../js/editor-wysiwyg.js) `markdownToHtml` | `wysiwyg` |

## 現行実装（コード準拠）

- `TextboxRichTextBridge.projectRenderedHtml` → `TextboxEffectRenderer.renderSegments` → セグメントごとに `TextExpressionPresetResolver.resolveTextbox(attrs, settings, options)` を呼ぶ。`options` には `settings` と **`target` がそのまま含まれる**。
- [`TextExpressionPresetResolver.resolveTextbox`](../../js/modules/editor/TextExpressionPresetResolver.js): `options` から参照しているのは **`reduceMotion` の意味を持つ経路**（`isReducedMotionRequested(options)`）のみ。**`options.target` は未参照**。
- したがって **現時点では preview / reader / wysiwyg で HTML 生成ロジックに差はない**（同一 preset・同一 settings なら同一出力）。

## 将来の面別調整が必要になる例（仕様化トリガー）

以下の要望が出た場合のみ、`target` を `resolveTextbox` または `TextboxEffectRenderer` で分岐させる仕様を **本ファイルに追記**してから実装する。

- Reader ではアニメーション層を常に落とし、preview のみフル表現にする  
- WYSIWYG では編集用に装飾クラスを薄くし、preview/reader は読了用のままにする  
- 読者プレビュー専用のタイポグラフィトークンを data 属性で付与する  

## 関連

- [`docs/INTERACTION_NOTES.md`](../INTERACTION_NOTES.md) — WP-004 Phase 3  
- [`docs/WP004_PHASE3_PARITY_AUDIT.md`](../WP004_PHASE3_PARITY_AUDIT.md) — 差分監査  
- [`docs/specs/spec-text-expression-architecture.md`](spec-text-expression-architecture.md) — Tier1 アーキテクチャ  
