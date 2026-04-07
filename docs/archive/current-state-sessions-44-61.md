# CURRENT_STATE セッション変更ログ（Session 44〜61）

[`docs/CURRENT_STATE.md`](../CURRENT_STATE.md) から巻き上げ。直近のセッションは正本ファイルを参照。

---

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
