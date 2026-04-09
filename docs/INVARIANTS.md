# Invariants

破ってはいけない条件・責務境界・UX不変量を保持する正本。

**用語**: UI モードと**再生オーバーレイ**の区別・編集面との関係の**説明**は [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) の「Zen Writer UI 状態モデル」を正とする。本ファイルは挙動上の不変条件のみを列挙する。

## UX / Algorithmic Invariants

- UI モードは `normal` / `focus` の 2 種。切替の単一入口は `setUIMode`。直接 `setAttribute('data-ui-mode', ...)` は禁止
- `blank` モード指定は `focus` にフォールバックする
- 執筆集中サイドバー（writing focus 系 UI）は `focus` モード時のみ有効。`normal` では従来のサイドバーアコーディオンを維持する
- hidden `ui-mode-select` は HTML から削除済み。コマンドパレットのモード切替は `ZenWriterApp.setUIMode()` と可視の mode-switch ボタン経由に統一する
- chapterMode は全ドキュメントで自動適用 (`ensureChapterMode`)。章追加は `Store.createChapter()` 経路のみ
- **読者プレビュー／HTML 組み立てなどの「読み取り」経路**では `splitIntoChapters` や `saveDocuments` による章モデルの暗黙更新を行わない（分解・移行は `ensureChapterMode` や明示的な処理に限定。目安は [`REFACTORING_SAFETY_CHAPTER_STORAGE.md`](REFACTORING_SAFETY_CHAPTER_STORAGE.md)）
- `ZWChapterStore.getChaptersForDoc` / `createChapter` / `assembleFullText` には **親ドキュメント ID** を渡す。`getCurrentDocId()` が章レコードを指す可能性があるため、章 UI では正規化ヘルパ（例: `getDocumentIdForChapterOps`）を通す
- サイドバー開閉は `toggleSidebar()` → `s.sidebarOpen` に永続化。`setUIMode` Normal 復帰時に復元
- エッジグローは Focus モードのみ
- 再生オーバーレイ表示中（`data-reader-overlay-open='true'`）はフローティングツールバーを非表示
- WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー `[...]` 経由。直接ボタンは存在しない
- 装飾グループ (toolbar-group--decorate) と Canvas Mode ボタンは HTML から完全削除済み。復活させない
- 再生オーバーレイ exit で大きな return overlay をエディタ操作領域の上に残さない。編集面へフォーカスを戻す
- Focus モードでツールバーの top gap やサイドパネルの writing surface 重なりを生じさせない
- `ZWChapterNav.convertForExport` は `class` に修飾子（例: `chapter-link--broken`）が付いても章リンクを `#` アンカーへ変換する
- WYSIWYG でアニメーション/テクスチャエフェクトは即時適用する（WP-004 Phase 1）

## Wiki と Reader プレビュー（コンテンツ経路）

- editor-preview からの wikilink クリック → Wiki ガジェット表示が動作する
- Reader での wikilink クリック → ポップオーバー（タイトル + 本文抜粋）を表示する
- `[[` 入力時の Wiki エントリ補完は Normal モードのみ。Focus では非表示にする
- wikilink / 傍点 / ルビのインライン後処理は `js/zw-inline-html-postmarkdown.js`。MD プレビューと読者本文の装飾〜章リンク順序は `js/zw-postmarkdown-html-pipeline.js`（Reader は `convertChapterLinks` → `convertForExport`、Phase 3 範囲）

## a11y（再生オーバーレイ UI）

- `#reader-preview` に `aria-describedby="reader-mode-hint"`。FAB・保存・縦横切替などに用途別 `aria-label`
- フルツールバーの `#toggle-reader-preview`（目アイコン）は、再生オーバーレイ導線として用語・色・アイコン寸法を一貫化する（`css/style.css` の `.toolbar-group--editor #toggle-reader-preview`）

## レイアウト（ツールバー・Focus サイドバー）

- Normal サイドバーは「セクション」「構造」カテゴリを既定で折りたたみ。初回も `app-gadgets-init.js` で両グループのガジェットをマウントする
- Focus で閉じた `#sidebar` の右端がビューポート左縁と一致する場合、`box-shadow` / `border-right` が画面内に漏れないよう非オーバーレイ時は抑制する
- Focus かつ `data-edge-hover-top='true'` の間、`--toolbar-height`（`syncToolbarHeightWithCSSVar` 実測）分だけ `.editor-container` に `padding-top` を付け、上端スライドインしたツールバーと本文を重ねない
- ツールバー実高とレイアウトは `e2e/toolbar-editor-geometry.spec.js` で検証する。`--toolbar-height` は実測高と 2px 以内で一致すること
- 768px 以下の `.toolbar` は折り返し行を上揃え（`align-items` / `align-content: flex-start`）。`min-height: var(--toolbar-height)` は使わない。狭幅の `.toolbar` / `.editor-container` は `height` を transition 対象外にし、高さ変化時の伸縮アニメーションを抑制する

## コマンドパレット（フォーカス移動）

- Normal/Focus 切替後は rAF 二重で執筆面へフォーカス復帰する
- 再生オーバーレイ切替後は `#reader-back-fab` へフォーカスする（隠し textarea へ奪わない）

## Slim Mode Invariants

- `data-sidebar-slim="true"` はアプリ起動時に `bootstrapAccordion()` で常時設定される
- slim モードではガジェット chrome (detach/help/chevron ボタン) が `display: none !important` になる
- テスト時は `enableAllGadgets` / `disableWritingFocus` で slim を解除する

## E2E Test Invariants

- テストの beforeEach では `ensureNormalMode(page)` を呼び、保存設定が Focus の場合の暴走を防ぐ
- `page.click('#toggle-sidebar')` は viewport 外エラーの原因になるため、`openSidebar(page)` (evaluate 経由) を使用する
- Visual Audit は screenshot refresh だけでは有効ではない。実 UI フローを通じた状態証明 + 重複画像検出が必要

## Responsibility Boundaries

- AI は執筆しない。制作システム整備が役割
- EPUB/DOCX 出力はスコープ外 (2026-03-23 除外決定)
- OAuth / Electron 配布は現フェーズの対象外

## Prohibited Interpretations / Shortcuts

- rejected を「工程不要」と解釈しない
- ユーザー未指定の固有名詞・方式を勝手に採用しない
- 振り子判断 (「前回 UI が多かったから次はコンテンツ」) で作業を選ばない

## 運用ルール

- ユーザーが一度説明した非交渉条件は、同一ブロック内でここへ固定する
- `project-context.md` の DECISION LOG には理由を短く残し、ここには条件そのものを残す
