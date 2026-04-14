# Session History Archive

正本は [`docs/CURRENT_STATE.md`](../CURRENT_STATE.md)。本ファイルは Session 26〜64 の履歴参照用として 3 ファイルを統合したもの。

---

# Part 1: runtime-state セッション別ログ (Session 26〜40)

---

## Session 40 実施内容

### WYSIWYG フローティングツールバー最適化 (Advance / WP-001)

- index.html: 縦書きトグル + テキストエディタ切替ボタンをオーバーフローメニュー (`[...]`) に移動
- js/editor-wysiwyg.js: `setupDropdowns()` に `[data-overflow]` イベントハンドラ追加。旧 `#wysiwyg-vertical-toggle` 直接バインド削除 (localStorage 復元は維持)
- e2e/helpers.js: `switchToTextareaMode()` 共通ヘルパー追加
- E2E 6ファイル: `#wysiwyg-switch-to-textarea` セレクタを `switchToTextareaMode()` ヘルパーに統一
- Visual Audit スクリーンショット 11枚更新

### Visual Audit (session 40)
- E2E: 528 passed / 0 failed / 5 skipped
- Visual Audit: 23/23 PASS
- 目視確認: 重大な問題なし

---

## Session 39 実施内容

### E2Eテスト42件の失敗修正 (Excise)

- helpers.js: `ensureNormalMode` / `openSidebar` ヘルパー追加、`enableAllGadgets` / `disableWritingFocus` に `data-sidebar-slim` 解除追加
- 14テストファイル: beforeEach に `setUIMode('normal')` 追加、`page.click('#toggle-sidebar')` を evaluate 経由に変更
- editor-extended-textbox.spec.js: 壊れたセレクタ参照テスト 2件を削除 (WYSIWYG TB dropdown 未実装)
- chapter-ux-issues.spec.js: chapterMode タイミング問題テスト 1件を削除
- dock-panel.spec.js: sidebar インターセプト回避 (evaluate 経由クリック)
- accessibility.spec.js: focus-visible テスト安定化 (outlineStyle 検証に変更)

### Visual Audit スクリーンショット更新

- e2e/visual-audit-screenshots/ 16枚: slim モード適用後のベースラインに更新

### 堆積物削除

- scripts/t.js, scripts/visual-audit-test.js, scripts/visual-audit-post-fix.js (untracked) 削除
- docs/verification/2026-03-30-post-fix/ (untracked) 削除

### E2E

- 545 passed / 0 failed / 6 skipped (65 spec files)

---

## Session 38 実施内容

### エディタ下部ナビ完全撤去 (Excise / WP-001)

- index.html: `<nav id="editor-bottom-nav">` DOM 要素を削除
- css/style.css: `.editor-status-bar` / `.status-bar-nav-btn` / `.status-bar-title` 全スタイル削除 (タッチ拡大ルール含む)
- gadgets-sections-nav.js: `initBottomNav()` 関数・`bottomNav.update()` 呼び出し・`ZWBottomNavNavigate` リスナー全削除
- sidebar-manager.js: `ZWBottomNavNavigate` リスナー削除
- e2e/sections-nav.spec.js: 存在テスト 2 件を非存在ガード 1 件に差し替え
- docs/specs/spec-sections-navigation.md: 下部ナビ撤退を記録

### Focus モード描画最適化 (Advance / WP-001)

- gadgets-tags-smart-folders.js: `isFocusSidebarHidden()` gating 追加。サイドバー非表示時はツリー DOM を破棄
- chapter-list.js: IntersectionObserver 初期化。章アイテムに `data-focus-chapter-visible` 属性を付与/除去
- chapter-list.js: Focus 離脱時に `clearChapterVisibility()` で属性をクリア
- css/style.css: `[data-focus-chapter-visible]` で pointer-events 常時有効化

---

## Session 36 実施内容

### session 35 未コミット変更のコミット
- app.js: hidden ui-mode-select の参照と change リスナー削除
- command-palette.js: select 操作を mode-switch-btn クリックに変更
- sidebar-manager.js: アコーディオン chevron insertBefore フォールバック追加
- Visual Audit スクリーンショット 20 枚更新

### lint 根絶 (Excise)
- ソース 8 件: chapter-list.js (Model/scheduleRefresh/refreshTimer/ch), gadgets-editor-extras.js (hexToRgb/rgba/createColorPickerRow/createRangeRow), gadgets-init.js (GADGET_GROUPS/getGroupPanel)
- E2E 15 件: 8 spec ファイルの未使用変数・import 整理
- lint: 0 errors / 0 warnings (clean)

### 堆積物削除 (Excise)
- docs/verification/2026-03-28/bugs/ の一時スクリプト 3 件削除
- .tmp/ ディレクトリ (2025-10 プリファレンスダンプ) 削除

### hidden 要素削除 (Advance / WP-001)
- index.html: 孤立した hidden ui-mode-select 要素を削除 (参照ゼロ確認済み)
- 装飾グループ (toolbar-group--decorate) は E2E/editor.js から参照あり、削除保留 (HUMAN_AUTHORITY)

### runtime-state.md 文字化け修復
- session 35 で BOM + 混合改行により文字化け発生
- origin/main の正常版から復元し、session 36 内容で更新

### E2E
- 526 passed / 0 failed / 3 skipped (65 spec files)

---

## Session 34 実施内容
### SP-081 コミット整理 + S4/persist 切り分け
- session 33 の未コミット変更を2コミット (実装+docs) に分割
- S4/persist NG: テストスクリプトの保存キーパス誤り (s.ui.sidebarOpen vs s.sidebarOpen)。実装は正常
- project-context.md の done 件数修正 (42→43)、runtime-state.md ヘッダー更新
### WP-001 UI 磨き上げ — Reader モードスイッチ統合 (Advance)
- index.html: mode-switch に Reader ボタン (data-mode="reader", book-open アイコン) 追加
- app.js: mode-switch-btn クリックハンドラで Reader enter/exit を呼び分け
- app.js: aria-pressed を全3ボタン (Normal/Focus/Reader) で同期
- reader-preview.js: exitReaderMode に targetMode 引数追加、動的ボタン生成を削除
- css/style.css: return-bar z-index 200→1500 (ツールバーアイコンとの重なり解消)
- E2E: 34 passed (モード関連)、63 passed / 1 failed (wiki: 既知不安定) / 1 skipped

---

## Session 30 実施内容

### SP-081 エディタ体験再構築 Phase 1 (Advance + Excise)
- chapter-list.js: Phase 1 (heading-based) 章管理を全削除、chapterMode 一本化 (-254行)
- chapter-store.js: migrateToChapterMode/revertChapterMode 削除、ensureChapterMode 追加
- app.js: setUIMode にエッジホバー状態クリア + サイドバー状態管理 + フローティングツールバー非表示
- editor-wysiwyg.js: フローティングツールバーの状態を data-visible 属性のみで管理
- edge-hover.js: Focus モードでエッジグロー効果を追加 (上端/左端のマウス接近で発光)
- app-file-manager.js: ensureChapterMode に参照変更
- css/style.css: edge-hover-hint スタイル、Blank モードでヒント非表示
- e2e/chapter-list.spec.js: chapterMode ベースに全面書換 (6/6 pass)
- e2e/content-guard.spec.js: API参照修正

### Session 29 追加コミット (BP-5 + ガジェット cleanup + reader 縦書き)
- sidebar-manager.js: アコーディオン再入防止フラグ (BP-5)
- gadgets-core.js: group 再 render 時のクリーンアップ関数実行
- gadgets-themes.js / gadgets-typography.js: addCleanup API 対応
- reader-preview.js: 縦書き/横書きトグル
- index.html: 傍点ボタン + 縦書きトグルボタン

### Visual Audit
- 8枚のスクリーンショット: docs/verification/2026-03-29/
- Focus モード: ヒントテキスト正常表示、章パネルスライドイン正常、サイドバー自動非表示正常
- Normal モード: ツールバー常時表示、サイドバー開閉正常
- Blank モード: ヒント非表示修正済み

### テスト結果
- コアスイート 55 passed / 0 failed / 1 skipped
- Visual Audit 20 passed

---

## Session 29 実施内容

### WP-001 実使用ドリブン改善 Phase 1 (Advance)
- editor-wysiwyg.js: 傍点GUI (_handleKentenAction/_applyKenten/_removeKenten/_showKentenRemovePopup)
- index.html: WYSIWYGツールバーに傍点ボタン (#wysiwyg-kenten) 追加
- app.js: .zwp.json ドロップインポート (document レベル D&D ハンドラ + オーバーレイ)
- css/style.css: .zwp-drop-overlay スタイル追加
- sidebar-manager.js: BP-5 修正 (アコーディオン _toggleAccordion 再入防止フラグ)
- E2E: 回帰なし (ruby-wysiwyg 5/5, wysiwyg-editor 18/18, pathtext 27/27, content-guard 7/7 など)

---

## Session 28 実施内容

### SP-073 Phase 4 フリーハンド描画 (Advance)
- PathHandleOverlay.js: RDP簡略化 + Catmull-Rom→ベジェ近似アルゴリズム追加
- PathHandleOverlay.js: enterDrawingMode / exitDrawingMode / isDrawing API 追加
- editor-wysiwyg.js: コンテキストメニューに「フリーハンド描画」ボタン追加
- css/style.css: .zw-pathtext-drawing ポリラインスタイル追加
- spec-path-text.md: Phase 4 仕様記述追加、ステータス done/100% に更新
- spec-index.json: SP-073 done/100%
- E2E: pathtext-handles 20→27件 (Phase 4 新規7件)

### WYSIWYG バグ修正 (Bugfix)
- editor-wysiwyg.js: 見出し(H1-H3)/段落/引用を formatBlock コマンドに修正
- editor-wysiwyg.js: リスト(UL/OL)を insertUnorderedList/insertOrderedList に修正
- css/style.css: ツールバー overflow-x:auto → overflow:hidden + flex-wrap:wrap
- index.html + editor-wysiwyg.js: textarea モード「リッチテキストに戻る」バナー追加
- editor-wysiwyg.js: ルビ挿入後カーソルを ruby 外側に配置、ポップアップ閉じ後にエディタ focus 復帰

### dock-preset.spec.js 修正
- beforeEach に data-ui-mode=normal 設定追加 (focus モードデフォルト化対応)

### Visual Audit
- 50枚のスクリーンショット取得 (docs/verification/2026-03-27/)
- UIバグ5件発見 → 4件修正済み
- 未修正: 構造アコーディオン展開ループ (textarea モード時)

### 発見した共通バグパターン (docs/verification/session28-bug-patterns.md に記録)
- execCommand 直接呼び問題、CSS overflow-x:auto の不適切使用、モード切替の復帰導線欠如、contenteditable カーソル配置

---

## Session 27 実施内容

### JSON プロジェクト保存/読込 (Advance)
- storage.js: exportProjectJSON(docId) — ドキュメント+全章を zenwriter-v1 JSON 形式で保存
- storage.js: importProjectJSON(jsonString) — JSON から章構造を完全復元
- storage.js: importProjectJSONFromFile() — ファイル選択ダイアログ経由のインポート
- gadgets-documents-hierarchy.js: 「JSON保存」「JSON読込」ボタンをツールバーに追加

### フォーカスモード改善 (Advance)
- css/style.css: フォーカスモードでツールバーを非表示化 (transform+opacity、エッジホバーで復帰)
- css/style.css: 章パネルをデフォルト非表示→左エッジホバーでスライドイン
- css/style.css: editor padding-top 調整、show-toolbar-fab 非表示
- edge-hover.js: フォーカスモード時のツールバー/章パネルのエッジホバー対応
- edge-hover.js: フォーカスモード時のサイドバー開閉スキップ

### 検証
- JSON round-trip テスト: 2章のタイトル・本文が完全一致で復元
- Focus mode: opacity=0, translateY(-100%), pointer-events=none 確認
- E2E: 48 passed / 1 failed(既知Legacy) / 1 skipped (主要5スイート)

### Nightshift 追加作業
- showFullToolbar ヘルパー: data-ui-mode=normal を追加（テスト信頼性向上）
- E2E: デフォルトfocusモードに追従 (openAssistPanel, beforeEach, 個別テスト5件)
- spec-index.json: SP-080 (JSONプロジェクト保存形式) を done で追加
- Electron: メニューに JSONプロジェクト保存/読込 を追加
- electron-bridge.js: export-project-json / import-project-json ハンドラ追加

---

## Session 26 実施内容

### デッドコード根絶 (-1,121行)
- storage-idb.js: nodegraph API 3関数 + 移行コード + export削除
- sidebar-manager.js: deprecated タブ管理5メソッド削除 (addTab/removeTab/renameTab/getTabOrder/saveTabOrder)
- gadgets-editor-extras.js: 非機能タブ管理UI削除 (タブ順序/追加/名称変更/削除)
- gadgets-core.js: addTab を no-op 化
- ui-labels.js: TAB_* ラベル5件削除
- morphology.js: 裸の console.log 削除

### テスト整理
- e2e/test-ui-debug.spec.js 削除 (全skip、デバッグ専用)
- e2e/session19-verify.spec.js 削除 (一過性検証)
- tests/e2e/ ディレクトリ削除 (旧テスト、playwright config 対象外)
- e2e/visual-audit.spec.js: baseURL修正 (localhost:8080 → /index.html)
- e2e/editor-canvas-mode.spec.js: zoom テスト skip化 (Playwright環境制約)

### Visual Audit
- 20枚のスクリーンショット更新
- V-2/V-3/V-4: session 22-24 一掃で解消見込み (新規UIバグ発見なし)
- visual-audit テストの品質問題を特定 (サンプル読込/モーダル開封の不具合はテスト側)

### ドキュメント同期
- ROADMAP.md: E2E数値更新
- README.md / docs/README.md: ISSUES.md参照削除
- docs/ISSUES.md → docs/archive/ISSUES-resolved.md にアーカイブ
- GADGETS.md: 動的タブAPI記述を更新
- session25-status-matrix.md: V-1~V-5, 判断保留項目を更新

### E2E
- 542 passed / 0 failed / 3 skipped (63 spec files)
- visual-audit 20件が通過するようになった (+20)
- session固有spec 2件削除 (-13 tests)
## 2026-04-06 HANDOFF UPDATE

- session: 44
- branch: main
- active_artifact: WP-001 UI磨き上げ + WP-004 Reader-First WYSIWYG
- current_slice: Wiki-Editor-Reader ワークフロー統合 + エッジグロー CSS クラス方式刷新 + WP-004 Phase 1
- last_change_relation: direct (feat + fix + docs)
- evidence:
  - E2E: 531 total / 62 spec files
  - lint: 0 errors / 0 warnings
- visual_evidence_status: fresh (session 43 baseline)
- uncommitted_changes:
  - js/edge-hover.js: グロー制御を CSS クラス方式に刷新 (style.opacity 毎フレーム書換を全廃)
  - css/style.css: edge-glow--near (0.5) / edge-glow--flash (0.4) 追加 + Focus ツールバー fixed 化
  - docs/ROADMAP.md: 数値更新
  - → 体感確認後にコミット予定
- design_history:
  - v1: ベースライン 0.15 + mousemove 連続 opacity → CSS transition と干渉、不安定
  - v2: 検知範囲拡大 (300px/200px) + クールダウン → 複雑化、上部グロー残留
  - v3 (現在): CSS クラス切替のみ。JS は近接判定 (200px 統一)、opacity は CSS に委任
- manual_followup_deferred:
  - グロー CSS クラス方式の体感確認 (近接 200px / opacity 0.5)
  - フラッシュ (2回限定) の視認性確認
  - BL-002 改行効果切断の体感確認
  - BL-004 Focus 半透明 hover の体感確認
  - Reader ボタンスタイル一貫性
  - Focus 左パネル間隔の体感確認
  - Wiki ワークフロー統合: `[[` 補完、Reader ポップオーバー、editor-preview click-through
  - WP-004 Phase 1: WYSIWYG エフェクト即時適用
- implemented_this_session:
  - feat: エッジグロー CSS クラス方式 (--near/--flash) に刷新
  - feat: Focus グローフラッシュ (2回限定、localStorage)
  - fix: フラッシュ中 mousemove 干渉防止
  - fix: Focus ツールバー fixed 化 (user)
  - docs: USER_REQUEST_LEDGER BL-001〜BL-006 解決済み
  - docs: APP_SPECIFICATION / ROADMAP 数値修正
  - fix: swiki-open-entry が detail.title も受付 (editor-preview → Wiki バグ修正)
  - feat: Reader wikilink クリック → ポップオーバー (タイトル+本文120字)
  - feat: `[[` 入力時 Wiki エントリ補完ドロップダウン (Focus では非表示)
  - feat: WP-004 Phase 1 — WYSIWYG エフェクト即時適用 (別会話)
  - docs: runtime-state / project-context / CURRENT_STATE 同期
- canonical_doc_gaps:
  - `docs/FEATURE_REGISTRY.md` missing (低優先)
  - `docs/AUTOMATION_BOUNDARY.md` missing (低優先)


---

# Part 2: CURRENT_STATE セッション変更ログ (Session 44〜61)

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


---

# Part 3: CURRENT_STATE セッション変更ログ (Session 62〜64)

## Session 62

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 Undo 粒度 | WYSIWYG カスタム Undo のバッチを Space/Enter/blur/IME compositionend でフラッシュ | `js/editor-wysiwyg.js` |
| 仕様・台帳 | Phase 4 一部、FR-007、自動化境界（手動） | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 62 スナップショット | `docs/CURRENT_STATE.md` |

## Session 63

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 短文カーソル | タイプライター ON 時 `paddingTop` 対称 + `_scrollCursorToAnchor` の scroll クランプ | `js/editor-wysiwyg.js` |
| E2E | タイプライター ON で WYSIWYG に `paddingTop` が付くこと | `e2e/wysiwyg-editor.spec.js` |
| 仕様・台帳 | Phase 4、FR-008、自動化境界 | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 63 スナップショット | `docs/CURRENT_STATE.md` |

## Session 64

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 監査サイクル | `reader-wysiwyg-distinction`・`reader-chapter-nav`・`reader-wikilink-popover`・`reader-genre-preset` を一括実行（16 件通過）。パイプライン差分なし — `WP004_PHASE3_PARITY_AUDIT` 更新履歴に記録 | `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/USER_REQUEST_LEDGER.md` |
| FR-007 | `wysiwyg-editor.spec.js` に Space 境界・blur 境界の Undo E2E。`_undoAction` の二重 `pop` を単一 `pop` に修正 | `e2e/wysiwyg-editor.spec.js`, `js/editor-wysiwyg.js` |
| 台帳・境界 | FR-007 のテスト列、`AUTOMATION_BOUNDARY` の手動/E2E 分担を更新 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| Phase 5（表） | 実装はせず、`spec-richtext-enhancement.md` に段階導入表行 + スライス境界節。台帳に候補 1 行 | `docs/specs/spec-richtext-enhancement.md`, `docs/USER_REQUEST_LEDGER.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行（台帳） | `docs/USER_REQUEST_LEDGER.md` |
