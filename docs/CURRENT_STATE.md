# Current State

最終更新: 2026-04-06 (session 63)

## Snapshot


| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 63 |
| 現在の主軸 | WP-001 UI/UX 磨き上げ + WP-004 Reader-First WYSIWYG |
| 直近のスライス | session 63: リッチテキスト P1（レーン C2）— タイプライター **短文時アンカー**（`paddingTop` 対称 + `scrollTop` クランプ）+ `wysiwyg-editor.spec.js`・仕様・FR-008・自動化境界・WP-001 スキップ・台帳更新 |


## この時点で信頼できること

- UI モードは `normal / focus / reader` の 3 種を `setUIMode` で切り替える
- 執筆集中サイドバーは `focus` モード時だけ有効
- `normal` モードでは従来のサイドバーアコーディオンを維持する
- `blank` 指定は互換のため `focus` にフォールバックする
- サイドバー slim モード (`data-sidebar-slim="true"`) でガジェット chrome (detach/help/chevron) が非表示
- コマンドパレットの UI モード切替は `ZenWriterApp.setUIMode()` と可視モードボタン経由に統一
- hidden `ui-mode-select` 要素は HTML から完全削除済み (session 36)
- 装飾グループ (toolbar-group--decorate) と Canvas Mode ボタンは HTML から完全削除済み (session 40)
- WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー経由 (session 40)
- E2Eテストの beforeEach では `ensureNormalMode(page)` で Normal モードを保証する
- `page.click('#toggle-sidebar')` は使わず `openSidebar(page)` (evaluate 経由) を使用する
- Wiki ワークフロー: editor-preview wikilink クリック → Wiki ガジェット表示が正常動作 (session 44 バグ修正)
- Reader wikilink クリック → ポップオーバー (タイトル + 本文120字) 表示 (session 44 新規)
- `[[` 入力時に Wiki エントリ補完ドロップダウン表示、Focus モードでは非表示 (session 44 新規)
- WYSIWYG でアニメーション/テクスチャエフェクトが即時適用される (WP-004 Phase 1)
- 編集面（Markdown / リッチ編集）と UI モード（通常・フォーカス・読者プレビュー）の説明・用語の正本は `docs/INTERACTION_NOTES.md`（状態モデル節）
- 読者プレビュー UI は `#reader-preview` に `aria-describedby="reader-mode-hint"`、FAB・保存・縦横切替に用途別 `aria-label`。モードスイッチ Reader ボタンは `aria-label` とツールバー目アイコンのラベルを用語で揃える
- フルツールバー表示時、`#toggle-reader-preview`（目アイコン）の既定色・ホバー・アイコン寸法はモードスイッチの Reader（本アイコン）と同系に揃える（`css/style.css` の `.toolbar-group--editor #toggle-reader-preview`）
- 開発スライスの進め方（1 トピック・完了時に `CURRENT_STATE` 更新・WP-004 Phase 3 の単発差分修正）は `[docs/USER_REQUEST_LEDGER.md](USER_REQUEST_LEDGER.md)`「開発スライスの進め方（推奨）」を正とする
- WP-004 Phase 3 は MD→HTML パイプラインの preview/reader 整合。ブロック段落の左・中・右揃えは **リッチテキスト・プログラム**（`[docs/specs/spec-richtext-enhancement.md](specs/spec-richtext-enhancement.md)` P2 + `[docs/specs/spec-rich-text-paragraph-alignment.md](specs/spec-rich-text-paragraph-alignment.md)`）で扱い、Phase 3 スライスには含めない
- リッチテキストの実装正本は `spec-richtext-enhancement.md` の「実装の正（canonical paths）」（`js/modules/editor/RichTextCommandAdapter.js` 等）。設計書 `RICHTEXT_ENHANCEMENT.md` は分割案の歴史として参照し、変更判断は仕様を優先
- Normal サイドバーは「セクション」「構造」カテゴリを既定で折りたたみ。初回も `app-gadgets-init.js` で両グループのガジェットをマウント
- Reader 終了時は復帰先 UI モードを正規化し、編集面へフォーカスを戻す（WP-004 Phase 2）。wikilink/傍点/ルビは `js/zw-inline-html-postmarkdown.js`、MD プレビューと読者の装飾〜章リンク順序は `js/zw-postmarkdown-html-pipeline.js`（Reader は `convertChapterLinks` → `convertForExport`、Phase 3）
- Focus で閉じた `#sidebar` の右端がビューポート左縁と一致する場合、`box-shadow` / `border-right` が画面内に漏れないよう非オーバーレイ時は抑制する（`css/style.css`）
- Focus かつ `data-edge-hover-top='true'` の間、`--toolbar-height`（`syncToolbarHeightWithCSSVar` 実測）分だけ `.editor-container` に `padding-top` を付与し、上端スライドインしたツールバーと本文が重ならないようにする
- ツールバー実高とレイアウトの関係は `e2e/toolbar-editor-geometry.spec.js` で検証（Normal 広幅・狭幅フル・狭幅コンパクト・Focus+上端ホバー）。`--toolbar-height` は実測高と 2px 以内で一致することを assert
- 768px 以下の `.toolbar` は折り返し行を上揃え（`align-items` / `align-content: flex-start`）、`min-height: var(--toolbar-height)` は使わない。狭幅の `.toolbar` / `.editor-container` は `height` を transition 対象外にし高さ変化時の伸縮アニメーションを抑制
- 段落の左・中央・右揃え（ブロック `text-align`）はキャンバス列配置と別概念。仕様の正本は `docs/specs/spec-rich-text-paragraph-alignment.md`（WYSIWYG の `align*`・paste・Turndown・**コマンドパレット**・**WYSIWYG「その他」メニュー**。**MD プレビュー** `#markdown-preview-panel` と **読者本文** `.reader-preview__content` は `data-zw-align` を `css/style.css` で投影（session 57））
- `ZWChapterNav.convertForExport` は `class` に修飾子（例: `chapter-link--broken`）が付いても章リンクを `#` アンカーへ変換する
- コマンドパレット: Normal/Focus 切替後は rAF 二重で執筆面へフォーカス復帰。Reader 切替後は `#reader-back-fab` へフォーカス（隠し textarea へ奪わない）
- WP-004 Phase 3 の差分列挙・手動シナリオは [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。**複数 `#` + `chapter://`**（パイプライン層は `reader-wysiwyg-distinction.spec.js`、**Reader の章末ナビ DOM 注入**は `reader-chapter-nav.spec.js`）、**存在しない Wiki の `[[…]]`（`is-broken`）**（パイプライン HTML は同上、**Reader 未登録ポップオーバー**は `reader-wikilink-popover.spec.js`）、`:::zw-textbox` 複合、`:::zw-typing` / `:::zw-dialog` 内ルビ等を E2E で監視。`TextboxRichTextBridge` の `target` は [`docs/specs/spec-textbox-render-targets.md`](specs/spec-textbox-render-targets.md)
- 改行と装飾: `effectBreakAtNewline`（既定オン＝改行で切断、BL-002）は **`js/editor-wysiwyg.js`**。**サイドバー詳細設定の UI Settings** からチェックで永続化（session 61、`js/gadgets-editor-extras.js`）。`effectPersistDecorAcrossNewline === true` のとき Enter 後も **decor-* 内にカーソルを残す**（`effectBreakAtNewline !== false` のときのみ）。`effectPersistDecorAcrossNewline` 既定 `false`。WYSIWYG フォーカス時 **Ctrl+Shift+Alt+D**（macOS は ⌘+Shift+Option+D）でトグル永続化（session 57）。同キーは **UI Settings** からもチェックで永続化（session 60）。論点は [`docs/specs/spec-rich-text-newline-effect.md`](specs/spec-rich-text-newline-effect.md)
- WYSIWYG カスタム Undo（`Ctrl+Z` / `Ctrl+Shift+Z`）: 入力はデバウンスバッチに加え、**Space / Enter / blur / IME compositionend** で `_flushPendingUndoSnapshot` により区切る（session 62、`js/editor-wysiwyg.js`）。仕様・台帳は [`docs/specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)、[`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) FR-007
- WYSIWYG **タイプライター** ON 時: **`paddingTop: calc(100vh * (1 - anchorRatio))`** で上方向スクロール域を確保し、短文でも `_scrollCursorToAnchor` が働きやすい（session 63）。`scrollTop` は更新後クランプ。台帳 [`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) FR-008
- スライス完了時の更新手順は [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)「スライス完了時チェックリスト」

## Session 44 の変更

### コミット済み


| 項目             | 変更内容                                                        | 影響ファイル                                                                                     |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| グローフラッシュ       | Focus 進入時 2回限定ヒント (localStorage カウント)                       | `js/edge-hover.js`, `css/style.css`                                                        |
| フラッシュバグ修正      | glowFlashTimer null化 + mousemove上書き抑制ガード                    | `js/edge-hover.js`                                                                         |
| Focus不整合根絶     | Blank仕様書更新 + モバイルresponsive + flaky E2E修正                   | `docs/specs/spec-mode-architecture.md`, `css/style.css`, `e2e/ui-mode-consistency.spec.js` |
| APP_SPEC数値修正   | E2E 64→62, CSS 9→4, spec 54→56                              | `docs/APP_SPECIFICATION.md`                                                                |
| BL全解決確認        | USER_REQUEST_LEDGER BL-001〜BL-006 を解決済みに移動                  | `docs/USER_REQUEST_LEDGER.md`                                                              |
| 堆積物削除          | docs/issues/ 空ディレクトリ削除                                      | —                                                                                          |
| Wiki Slice 1   | swiki-open-entry が detail.title も受付、title→entryId 変換 (バグ修正) | `js/story-wiki.js`                                                                         |
| Wiki Slice 2   | Reader wikilink クリック → ポップオーバー (タイトル+本文120字)                | `js/reader-preview.js`, `css/style.css`                                                    |
| Wiki Slice 3   | `[[` 入力時 Wiki エントリ補完ドロップダウン (Focus では非表示)                   | `js/editor-wysiwyg.js`, `css/style.css`                                                    |
| WP-004 Phase 1 | WYSIWYG エフェクト即時適用 (EditorUI/EditorCore/classMap/CSS)        | `js/modules/editor/EditorUI.js`, `js/modules/editor/EditorCore.js`, `css/style.css`        |


### Session 45（ユーザー確認済み・コミット対象に含める）


| 項目            | 変更内容                                                            | 影響ファイル                                                                                     |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| グロー安定化        | CSS クラス方式 (--near/--flash)、近接 200px 統一（session 44 由来の未コミットを含む）  | `js/edge-hover.js`, `css/style.css`                                                        |
| Focus ツールバー   | `position: fixed` + 上端ホバー時の本文 `padding-top`（`--toolbar-height`） | `css/style.css`                                                                            |
| Focus サイドバー漏れ | 閉じたサイドバーの影・境界のビューポート内漏れ抑制                                       | `css/style.css`                                                                            |
| geometry E2E  | Normal / 狭幅 / Focus+上端ホバーの gap 検証                               | `e2e/toolbar-editor-geometry.spec.js`                                                      |
| 段落揃え仕様        | キャンバス配置とブロック揃えの分離（記録のみ）                                         | `docs/specs/spec-rich-text-paragraph-alignment.md`, `docs/specs/spec-mode-architecture.md` |


### Session 46


| 項目                  | 変更内容                                        | 影響ファイル                                                 |
| ------------------- | ------------------------------------------- | ------------------------------------------------------ |
| convertForExport    | `chapter-link--broken` 等の複合 class を正規表現でマッチ | `js/chapter-nav.js`                                    |
| パイプライン E2E          | preview/reader の章リンク差分、wikilink/傍点の同一経路     | `e2e/reader-wysiwyg-distinction.spec.js`               |
| コマンドパレットフォーカス       | UI モード別のフォーカス復帰                             | `js/command-palette.js`, `e2e/command-palette.spec.js` |
| FEATURE_REGISTRY    | FR-001〜005 を登録                              | `docs/FEATURE_REGISTRY.md`                             |
| AUTOMATION_BOUNDARY | 上記 E2E の記載                                  | `docs/AUTOMATION_BOUNDARY.md`                          |


### Session 47


| 項目             | 変更内容                                                                                                           | 影響ファイル                       |
| -------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Reader 導線 a11y | `#reader-preview` に `aria-describedby`、FAB・HTML 保存・縦横切替の `aria-label`、モードスイッチ Reader に `aria-label`、目アイコンと用語統一 | `index.html`                 |
| 縦横切替           | `applyVerticalMode` で `aria-label` を表示状態に同期                                                                    | `js/reader-preview.js`       |
| コマンドパレット       | MD プレビュー／WYSIWYG の説明を「読者プレビュー UI ではない」に統一                                                                      | `js/command-palette.js`      |
| E2E            | 読者プレビュー a11y 属性の回帰テスト                                                                                          | `e2e/reader-preview.spec.js` |


### Session 48


| 項目           | 変更内容                                                                     | 影響ファイル                                |
| ------------ | ------------------------------------------------------------------------ | ------------------------------------- |
| 狭幅ツールバー      | 折り返し・余白: モバイル `.toolbar` から循環しうる `min-height` を除去、行上揃え、高さ系 transition 抑制 | `css/style.css`                       |
| geometry E2E | `--toolbar-height` と実測の一致、520px コンパクト（`data-toolbar-mode` なし）ケース追加       | `e2e/toolbar-editor-geometry.spec.js` |


### Session 49


| 項目            | 変更内容                                                                              | 影響ファイル                                                    |
| ------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 推奨開発プラン       | スライス運用・WP-004 Phase 3 の単発修正・正本参照を `USER_REQUEST_LEDGER` に明文化。`ROADMAP` に進め方へのポインタ | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`          |
| canonical     | FR-003 概要に Phase 3 運用、`AUTOMATION_BOUNDARY` にガードレール記載                             | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| Reader ボタン見た目 | フルツールバー目アイコンをモードスイッチ Reader と同系に                                                  | `css/style.css`                                           |


### Session 50


| 項目             | 変更内容                                                                              | 影響ファイル                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WP-004 Phase 3 | `ZWPostMarkdownHtmlPipeline` で `|漢字《かな》` ルビが preview/reader で同一 HTML になることを E2E 化 | `e2e/reader-wysiwyg-distinction.spec.js`                                                                                                                           |
| トラック分離         | 段落揃え・リッチテキスト・プログラムを仕様・INTERACTION_NOTES・台帳・ROADMAP に明記                            | `spec-richtext-enhancement.md`, `spec-rich-text-paragraph-alignment.md`, `INTERACTION_NOTES.md`, `USER_REQUEST_LEDGER.md`, `ROADMAP.md`, `RICHTEXT_ENHANCEMENT.md` |
| JSDoc          | `TextboxRichTextBridge.projectRenderedHtml` の `options.target` を文書化               | `js/modules/editor/TextboxRichTextBridge.js`                                                                                                                       |

### Session 51

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 次候補準備（WP-001） | deferred 項目（BL-002 / BL-004 / Focus 左パネル間隔）の簡易再現手順を台帳に追加し、次トピック選定を容易化 | `docs/USER_REQUEST_LEDGER.md` |
| ROADMAP 整備 | 次スライス候補の `aria-*` 表記崩れを修正 | `docs/ROADMAP.md` |

### Session 52

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 監査台帳 | preview/Reader 整合の手動シナリオ・自動カバー表を追加 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| テキストボックス target | `resolveTextbox` が `options.target` を未参照であることを仕様化 | `docs/specs/spec-textbox-render-targets.md` |
| E2E | 最小 `:::zw-textbox` DSL が ZWMdItBody+パイプラインで preview=reader | `e2e/reader-wysiwyg-distinction.spec.js` |
| 今後のプラン実装 | 台帳に deferred コード確認メモ・スライス完了チェックリスト。段落揃え P2 に推奨スライス順。richtext 仕様に着手順のポインタ | `USER_REQUEST_LEDGER.md`, `spec-rich-text-paragraph-alignment.md`, `spec-richtext-enhancement.md`, `INTERACTION_NOTES.md`, `AUTOMATION_BOUNDARY.md`, `FEATURE_REGISTRY.md` |

### Session 53

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| レーン確定 | 次スライスは **WP-004**（監査シナリオ3）を優先実装 | — |
| WP-004 E2E | `:::zw-typing` / `:::zw-dialog` 内ルビの preview=reader 同一性を `reader-wysiwyg-distinction.spec.js` に追加 | `e2e/reader-wysiwyg-distinction.spec.js`, `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| WP-001 | deferred（BL-002 / BL-004 / Focus 左パネル）は **体感で問題が出たときのみ** 1 トピック化する旨を台帳に明記（コード変更なし） | `docs/USER_REQUEST_LEDGER.md` |
| P2 段落揃え | 永続化モデル案（`data-zw-align` 等）を `spec-rich-text-paragraph-alignment.md` に追記 | 同上、`docs/specs/spec-richtext-enhancement.md` |
| 改行・装飾 | 将来の持続モード／ショートカットの置き場として `spec-rich-text-newline-effect.md` を新規 | `docs/specs/spec-rich-text-newline-effect.md` |

### Session 54

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 E2E | `:::zw-textbox` 複合（preset・tilt・anim + italic）の preview=reader 同一性を `reader-wysiwyg-distinction.spec.js` に追加 | `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-004 台帳 | シナリオ3に「基本=E2E・複合は手動」脚注、シナリオ2の E2E 追記、自動カバー表に textbox 複合を追加 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| WP-001 | deferred に **新規再現なし** → 専用スライスはスキップ（台帳記録のみ） | `docs/USER_REQUEST_LEDGER.md` |
| P2 段落揃え | 永続化モデルを **確定**、Turndown 往復の固定範囲を本文に追記 | `docs/specs/spec-rich-text-paragraph-alignment.md` |
| 改行・装飾 | `effectBreakAtNewline` のキー・既定・ショートカット未割当を spec と INTERACTION_NOTES に表で固定 | `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md` |
| 台帳 | FR-003 概要、自動化境界の文言を session 54 内容に同期 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |

### Session 55

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 E2E | 複数見出し MD + `chapter://` のパイプライン整合（preview の `data-chapter-target`・reader の `chapter://` 非残留・章リンク正規化後の構造一致）を `reader-wysiwyg-distinction.spec.js` に追加 | `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-004 台帳 | シナリオ1 脚注（パイプライン E2E 済み・章末ナビは手動）、自動カバー表を更新 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行（USER_REQUEST_LEDGER） | `docs/USER_REQUEST_LEDGER.md` |
| P2 段落揃え | `RichTextCommandAdapter` に `alignstart/center/end`、`sanitizeHtml` で `data-zw-align`、Turndown `zwBlockAlign`、WYSIWYG CSS、E2E `rich-text-block-align.spec.js` | `js/modules/editor/RichTextCommandAdapter.js`, `js/editor-wysiwyg.js`, `css/style.css`, `e2e/rich-text-block-align.spec.js` |
| 改行・装飾 | `effectPersistDecorAcrossNewline` の仕様確定 + `storage` 既定 | `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md`, `js/storage.js` |
| 台帳 | FR-006 登録、自動化境界、仕様スライス表の追記 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/specs/spec-rich-text-paragraph-alignment.md` |

### Session 56

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 E2E | 存在しない Wiki への `[[…]]` が preview/reader で同一かつ `is-broken` になることを `reader-wysiwyg-distinction.spec.js` に追加 | `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-004 台帳 | シナリオ4 脚注・自動カバー表 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| P2 UI | 段落揃えをコマンドパレット（左・中央・右）と WYSIWYG「その他」メニューから実行 | `js/command-palette.js`, `index.html`, `js/editor-wysiwyg.js`, `e2e/rich-text-block-align.spec.js` |
| 改行・装飾 | `effectPersistDecorAcrossNewline` を Enter 後の decor カーソル移動に接続 | `js/editor-wysiwyg.js`, `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md` |
| 台帳 | FR-003/FR-006、自動化境界、`spec-rich-text-paragraph-alignment` スライス2行 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/specs/spec-rich-text-paragraph-alignment.md` |

### Session 57

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P2 スライス3 | `#markdown-preview-panel` と `.reader-preview__content` に `data-zw-align` 用 `text-align` 投影。パイプラインは属性を維持する前提のまま | `css/style.css`, `e2e/reader-wysiwyg-distinction.spec.js`, `docs/INTERACTION_NOTES.md`, `docs/specs/spec-rich-text-paragraph-alignment.md` |
| WP-004 シナリオ5 | `GenrePresetRegistry.apply` / `clear` の浅い E2E | `e2e/reader-genre-preset.spec.js`, `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| 改行・装飾 | `effectPersistDecorAcrossNewline` のキーボードトグル + E2E | `js/editor-wysiwyg.js`, `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md`, `e2e/rich-text-block-align.spec.js` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| 台帳 | FR-003/FR-006、自動化境界、CURRENT_STATE | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/CURRENT_STATE.md` |

### Session 58

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 Reader wikilink | 壊れリンク（Story Wiki 未登録）クリック時もポップオーバーでタイトル＋説明を表示。`reader-wiki-popover--broken` スタイル | `js/reader-preview.js`, `css/style.css`, `e2e/reader-wikilink-popover.spec.js`, `docs/INTERACTION_NOTES.md` |
| WP-004 台帳 | シナリオ4 脚注・自動カバー表を E2E 追記に合わせ更新 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| 台帳 | FR-003、自動化境界、CURRENT_STATE | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/CURRENT_STATE.md` |

### Session 59

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 Reader 章末ナビ | `chapterNav.enabled` かつ複数章 chapterMode で Reader 本文に `.chapter-nav-bar` が注入される結合 smoke | `e2e/reader-chapter-nav.spec.js`, `docs/INTERACTION_NOTES.md` |
| WP-004 台帳 | シナリオ1 脚注・自動カバー表 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| 台帳 backlog | 改行まわり backlog をショートカット済みに合わせ短文化 | `docs/USER_REQUEST_LEDGER.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| 台帳 | FR-003、自動化境界、CURRENT_STATE | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/CURRENT_STATE.md` |

### Session 60

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 改行 UX（decor 持続） | UI Settings ガジェットに `effectPersistDecorAcrossNewline` チェックボックス | `js/gadgets-editor-extras.js`, `e2e/editor-settings.spec.js` |
| 仕様同期 | 設定 UI の場所 | `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| 台帳 | FR-006、自動化境界、CURRENT_STATE | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/CURRENT_STATE.md` |

### Session 61

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 改行 UX（BL-002） | UI Settings ガジェットに `effectBreakAtNewline` チェック（既定オン） | `js/gadgets-editor-extras.js`, `e2e/editor-settings.spec.js` |
| 仕様同期 | 設定 UI の場所（`effectBreakAtNewline`） | `docs/specs/spec-rich-text-newline-effect.md`, `docs/INTERACTION_NOTES.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| 台帳 | FR-006、自動化境界、CURRENT_STATE | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/CURRENT_STATE.md` |

### Session 62

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 Undo 粒度 | WYSIWYG カスタム Undo のバッチを Space/Enter/blur/IME compositionend でフラッシュ | `js/editor-wysiwyg.js` |
| 仕様・台帳 | Phase 4 一部、FR-007、自動化境界（手動） | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 62 スナップショット | `docs/CURRENT_STATE.md` |

### Session 63

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 短文カーソル | タイプライター ON 時 `paddingTop` 対称 + `_scrollCursorToAnchor` の scroll クランプ | `js/editor-wysiwyg.js` |
| E2E | タイプライター ON で WYSIWYG に `paddingTop` が付くこと | `e2e/wysiwyg-editor.spec.js` |
| 仕様・台帳 | Phase 4、FR-008、自動化境界 | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 63 スナップショット | `docs/CURRENT_STATE.md` |

## 検証結果

実行済み (session 44):

- `npx eslint js/edge-hover.js` → clean
- `npx playwright test` (ui-mode-consistency 12/12, visual-audit 35/35) → pass

実行済み (session 45 推奨コマンド):

- `npx playwright test e2e/toolbar-editor-geometry.spec.js` → pass（ローカル）
- `npx playwright test e2e/ui-mode-consistency.spec.js` → pass（回帰）

実行済み (session 46):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` `e2e/command-palette.spec.js` → pass（ローカル）

実行済み (session 48):

- `npx playwright test e2e/toolbar-editor-geometry.spec.js` → pass（4 件）

実行済み (session 49):

- `npx playwright test e2e/toolbar-editor-geometry.spec.js` `e2e/reader-preview.spec.js` `e2e/reader-wysiwyg-distinction.spec.js` → pass

実行済み (session 50):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（6 件）

実行済み (session 52):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（8 件）

実行済み (session 53):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（9 件）

実行済み (session 54):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（10 件）

実行済み (session 55):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` `e2e/rich-text-block-align.spec.js` → pass（11 + 3 件）

実行済み (session 56):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（12 件）
- `npx playwright test e2e/rich-text-block-align.spec.js` → pass（4 件）
- `npx eslint js/command-palette.js js/editor-wysiwyg.js` → clean

実行済み (session 57):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（13 件）
- `npx playwright test e2e/reader-genre-preset.spec.js` → pass（1 件）
- `npx playwright test e2e/rich-text-block-align.spec.js` → pass（5 件）

実行済み (session 58):

- `npx playwright test e2e/reader-wikilink-popover.spec.js` → pass（1 件）

実行済み (session 59):

- `npx playwright test e2e/reader-chapter-nav.spec.js` → pass（1 件）

実行済み (session 60):

- `npx playwright test e2e/editor-settings.spec.js -g "effectPersistDecorAcrossNewline"` → pass（1 件）

実行済み (session 61):

- `npx playwright test e2e/editor-settings.spec.js -g "effectBreakAtNewline"` → pass（1 件）
- `npx eslint js/gadgets-editor-extras.js` → clean

実行済み (session 62):

- `npx eslint js/editor-wysiwyg.js` → clean
- `npx playwright test e2e/rich-text-block-align.spec.js` → pass（5 件・回帰）

実行済み (session 63):

- `npx eslint js/editor-wysiwyg.js` → clean
- `npx playwright test e2e/wysiwyg-editor.spec.js -g "タイプライター ON"` → pass（1 件）

体感確認（ユーザー OK、優先度低のまま残すもの）:

- WYSIWYG: Space / Enter / フォーカス移動 / IME 確定のあと **Ctrl+Z** の戻り幅が期待どおりか（session 62・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md)）
- WYSIWYG + タイプライター ON: **短文**（数行以下）でカーソル行がアンカー付近に寄る体感（session 63・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) FR-008）
- BL-002 / BL-004 / Focus 左パネル間隔（障害なければ次スライス時にまとめてよい）。Reader フルツールバー目アイコンは session 49 でモードスイッチと同系に済み
- Wiki ワークフロー統合・WP-004 Phase 1 の継続体感

## 現在の優先課題


| 優先  | テーマ            | 内容                                                               | Actor         |
| --- | -------------- | ---------------------------------------------------------------- | ------------- |
| A   | WP-004 次スライス   | Reader/WYSIWYG 境界を崩さない小改善（`docs/ROADMAP.md`「次スライス候補」参照）          | shared        |
| B   | WP-001 次スライス   | ユーザー要望に基づく 1 トピック単位の摩擦削減                                         | user / shared |
| C   | canonical docs | `FEATURE_REGISTRY.md` / `AUTOMATION_BOUNDARY.md` はテンプレート済み。変更時は台帳チェックリストに従い随時追記 | shared        |


## 既知の注意点

- `docs/spec-index.json` には、現ワークツリーにファイルが存在しない historical entry も含まれる
- 現在地の正本はこのファイルと `docs/runtime-state.md`, `docs/project-context.md` を優先する
- slim モード (`data-sidebar-slim`) はアプリ起動時に常時設定される。テスト時は `enableAllGadgets` / `disableWritingFocus` で解除する

## Canonical Gaps

作成済み:

- `docs/ai/*.md` (CORE_RULESET, DECISION_GATES, STATUS_AND_HANDOFF, WORKFLOWS_AND_PHASES)
- `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/INTERACTION_NOTES.md`
- `docs/runtime-state.md`, `docs/project-context.md`

テンプレート作成済み（随時拡張）:

- `docs/FEATURE_REGISTRY.md`
- `docs/AUTOMATION_BOUNDARY.md`
- `docs/WP004_PHASE3_PARITY_AUDIT.md`（WP-004 監査）
- `docs/specs/spec-textbox-render-targets.md`（テキストボックス `target`）

## 再開時の最短ルート

1. `docs/CURRENT_STATE.md` を読む (このファイル)
2. `docs/runtime-state.md` で session 詳細とカウンターを確認する
3. `docs/project-context.md` で HANDOFF SNAPSHOT と IDEA POOL を確認する
4. 今回の UI/状態管理の文脈が必要なら `docs/specs/spec-writing-focus-sidebar.md` を読む