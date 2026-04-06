# Current State

最終更新: 2026-04-06 (session 49)

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 49 |
| 現在の主軸 | WP-001 UI/UX 磨き上げ + WP-004 Reader-First WYSIWYG |
| 直近のスライス | 推奨開発プランを `USER_REQUEST_LEDGER` / `ROADMAP` に反映 + WP-001 Reader 導線ボタン見た目の統一（`style.css`） |

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
- 開発スライスの進め方（1 トピック・完了時に `CURRENT_STATE` 更新・WP-004 Phase 3 の単発差分修正）は [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)「開発スライスの進め方（推奨）」を正とする
- Normal サイドバーは「セクション」「構造」カテゴリを既定で折りたたみ。初回も `app-gadgets-init.js` で両グループのガジェットをマウント
- Reader 終了時は復帰先 UI モードを正規化し、編集面へフォーカスを戻す（WP-004 Phase 2）。wikilink/傍点/ルビは `js/zw-inline-html-postmarkdown.js`、MD プレビューと読者の装飾〜章リンク順序は `js/zw-postmarkdown-html-pipeline.js`（Reader は `convertChapterLinks` → `convertForExport`、Phase 3）
- Focus で閉じた `#sidebar` の右端がビューポート左縁と一致する場合、`box-shadow` / `border-right` が画面内に漏れないよう非オーバーレイ時は抑制する（`css/style.css`）
- Focus かつ `data-edge-hover-top='true'` の間、`--toolbar-height`（`syncToolbarHeightWithCSSVar` 実測）分だけ `.editor-container` に `padding-top` を付与し、上端スライドインしたツールバーと本文が重ならないようにする
- ツールバー実高とレイアウトの関係は `e2e/toolbar-editor-geometry.spec.js` で検証（Normal 広幅・狭幅フル・狭幅コンパクト・Focus+上端ホバー）。`--toolbar-height` は実測高と 2px 以内で一致することを assert
- 768px 以下の `.toolbar` は折り返し行を上揃え（`align-items` / `align-content: flex-start`）、`min-height: var(--toolbar-height)` は使わない。狭幅の `.toolbar` / `.editor-container` は `height` を transition 対象外にし高さ変化時の伸縮アニメーションを抑制
- 段落の左・中央・右揃え（ブロック `text-align`）はキャンバス列配置と別概念。仕様の正本は `docs/specs/spec-rich-text-paragraph-alignment.md`（実装は未着手）
- `ZWChapterNav.convertForExport` は `class` に修飾子（例: `chapter-link--broken`）が付いても章リンクを `#` アンカーへ変換する
- コマンドパレット: Normal/Focus 切替後は rAF 二重で執筆面へフォーカス復帰。Reader 切替後は `#reader-back-fab` へフォーカス（隠し textarea へ奪わない）

## Session 44 の変更

### コミット済み

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| グローフラッシュ | Focus 進入時 2回限定ヒント (localStorage カウント) | `js/edge-hover.js`, `css/style.css` |
| フラッシュバグ修正 | glowFlashTimer null化 + mousemove上書き抑制ガード | `js/edge-hover.js` |
| Focus不整合根絶 | Blank仕様書更新 + モバイルresponsive + flaky E2E修正 | `docs/specs/spec-mode-architecture.md`, `css/style.css`, `e2e/ui-mode-consistency.spec.js` |
| APP_SPEC数値修正 | E2E 64→62, CSS 9→4, spec 54→56 | `docs/APP_SPECIFICATION.md` |
| BL全解決確認 | USER_REQUEST_LEDGER BL-001〜BL-006 を解決済みに移動 | `docs/USER_REQUEST_LEDGER.md` |
| 堆積物削除 | docs/issues/ 空ディレクトリ削除 | — |
| Wiki Slice 1 | swiki-open-entry が detail.title も受付、title→entryId 変換 (バグ修正) | `js/story-wiki.js` |
| Wiki Slice 2 | Reader wikilink クリック → ポップオーバー (タイトル+本文120字) | `js/reader-preview.js`, `css/style.css` |
| Wiki Slice 3 | `[[` 入力時 Wiki エントリ補完ドロップダウン (Focus では非表示) | `js/editor-wysiwyg.js`, `css/style.css` |
| WP-004 Phase 1 | WYSIWYG エフェクト即時適用 (EditorUI/EditorCore/classMap/CSS) | `js/modules/editor/EditorUI.js`, `js/modules/editor/EditorCore.js`, `css/style.css` |

### Session 45（ユーザー確認済み・コミット対象に含める）

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| グロー安定化 | CSS クラス方式 (--near/--flash)、近接 200px 統一（session 44 由来の未コミットを含む） | `js/edge-hover.js`, `css/style.css` |
| Focus ツールバー | `position: fixed` + 上端ホバー時の本文 `padding-top`（`--toolbar-height`） | `css/style.css` |
| Focus サイドバー漏れ | 閉じたサイドバーの影・境界のビューポート内漏れ抑制 | `css/style.css` |
| geometry E2E | Normal / 狭幅 / Focus+上端ホバーの gap 検証 | `e2e/toolbar-editor-geometry.spec.js` |
| 段落揃え仕様 | キャンバス配置とブロック揃えの分離（記録のみ） | `docs/specs/spec-rich-text-paragraph-alignment.md`, `docs/specs/spec-mode-architecture.md` |

### Session 46

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| convertForExport | `chapter-link--broken` 等の複合 class を正規表現でマッチ | `js/chapter-nav.js` |
| パイプライン E2E | preview/reader の章リンク差分、wikilink/傍点の同一経路 | `e2e/reader-wysiwyg-distinction.spec.js` |
| コマンドパレットフォーカス | UI モード別のフォーカス復帰 | `js/command-palette.js`, `e2e/command-palette.spec.js` |
| FEATURE_REGISTRY | FR-001〜005 を登録 | `docs/FEATURE_REGISTRY.md` |
| AUTOMATION_BOUNDARY | 上記 E2E の記載 | `docs/AUTOMATION_BOUNDARY.md` |

### Session 47

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| Reader 導線 a11y | `#reader-preview` に `aria-describedby`、FAB・HTML 保存・縦横切替の `aria-label`、モードスイッチ Reader に `aria-label`、目アイコンと用語統一 | `index.html` |
| 縦横切替 | `applyVerticalMode` で `aria-label` を表示状態に同期 | `js/reader-preview.js` |
| コマンドパレット | MD プレビュー／WYSIWYG の説明を「読者プレビュー UI ではない」に統一 | `js/command-palette.js` |
| E2E | 読者プレビュー a11y 属性の回帰テスト | `e2e/reader-preview.spec.js` |

### Session 48

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 狭幅ツールバー | 折り返し・余白: モバイル `.toolbar` から循環しうる `min-height` を除去、行上揃え、高さ系 transition 抑制 | `css/style.css` |
| geometry E2E | `--toolbar-height` と実測の一致、520px コンパクト（`data-toolbar-mode` なし）ケース追加 | `e2e/toolbar-editor-geometry.spec.js` |

### Session 49

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 推奨開発プラン | スライス運用・WP-004 Phase 3 の単発修正・正本参照を `USER_REQUEST_LEDGER` に明文化。`ROADMAP` に進め方へのポインタ | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md` |
| canonical | FR-003 概要に Phase 3 運用、`AUTOMATION_BOUNDARY` にガードレール記載 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| Reader ボタン見た目 | フルツールバー目アイコンをモードスイッチ Reader と同系に | `css/style.css` |

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

体感確認（ユーザー OK、優先度低のまま残すもの）:

- BL-002 / BL-004 / Reader ボタン / Focus 左パネル間隔（障害なければ次スライス時にまとめてよい）
- Wiki ワークフロー統合・WP-004 Phase 1 の継続体感

## 現在の優先課題

| 優先 | テーマ | 内容 | Actor |
| ---- | ------ | ---- | ----- |
| A | WP-004 次スライス | Reader/WYSIWYG 境界を崩さない小改善（`docs/ROADMAP.md`「次スライス候補」参照） | shared |
| B | WP-001 次スライス | ユーザー要望に基づく 1 トピック単位の摩擦削減 | user / shared |
| C | canonical docs | `FEATURE_REGISTRY.md` / `AUTOMATION_BOUNDARY.md` をテンプレート作成し、随時追記 | shared |

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

## 再開時の最短ルート

1. `docs/CURRENT_STATE.md` を読む (このファイル)
2. `docs/runtime-state.md` で session 詳細とカウンターを確認する
3. `docs/project-context.md` で HANDOFF SNAPSHOT と IDEA POOL を確認する
4. 今回の UI/状態管理の文脈が必要なら `docs/specs/spec-writing-focus-sidebar.md` を読む
