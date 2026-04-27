# Invariants

破ってはいけない条件・責務境界・UX不変量を保持する正本。

**用語**: UI モードと**再生オーバーレイ**の区別・編集面との関係の**説明**は [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) の「Zen Writer UI 状態モデル」を正とする。本ファイルは挙動上の不変条件のみを列挙する。

## UX / Algorithmic Invariants

## Session 129: Left Nav Category Mapping

- Left nav の category anchor は、active category の `label` / `icon` / `panelId` / gadget loadout と常に同じ対象を指す。`sections` は `セクション` + `list-tree` + `sections-gadgets-panel` + `SectionsNavigator`、`structure` は `構造` + `file-text` + `structure-gadgets-panel` + Documents / Outline / StoryWiki / LinkGraph 系を持つ。
- Lucide は初回描画後に `<i data-lucide>` を `<svg>` へ置換するため、category 切替で icon を更新するときは `<i>` だけを探して属性変更しない。既存 `<svg>` を新しい `<i data-lucide>` に差し替え、Lucide 再描画に渡す。
- `#sidebar-nav-anchor` は `data-group` と `data-current-icon` を active category と同期する表示専用 anchor。root 戻りは `#sidebar-nav-back` のみが担う。E2E は label だけでなく icon と panel/gadget 対応も見る。

## Session 121 Override: Unified Shell UI

- 以下が **現行の UI 不変条件**。下位の `normal` / `focus` 記述は internal compatibility のために残っていても、新規実装と docs 更新ではこの節を優先する。
- 公開 UI は `display mode` を第一級概念にしない。ユーザー向け状態は **top chrome visibility / left nav hierarchy / Reader・Replay surface open state** で表す。
- `setUIMode('normal'|'focus')` は移行期の内部互換 API としてのみ扱う。新規 UI 仕様・visible command・manual test の起点にしない。
- top chrome は hidden が既定で、常用ツールバーではなく **F2 / menu / command palette で明示表示する一時シェル**として扱う。fine pointer の上端 hover reveal と常時 visible handle は使わない。hidden 時に常設上部バーや seam を残さず、誤表示時は Escape / 外側操作で即時に閉じる。
- frameless Electron window の通常移動は Electron-only の小さな左上 window grip に限定する。Editor本文、リッチ編集面、sidebar、left-edge rail、buttons、inputs、contenteditable を window drag region にしない。
- left nav は root/category 階層ナビ。root rail は通常時に完全非表示で、不可視の left edge rail に触れたときだけ fade-in する。root では全トップレベルカテゴリを表示し、**直前に開いていたカテゴリには再入の cue を残す**。category では active category を左上固定、非 active category を fade-out 後に hit-test 対象外へ移す。category 展開中は toolbar / header / accordion content を最終 category 幅で保持し、狭幅折り返しによる潰れ・縦長化を出さない。カテゴリ間の直接ジャンプは初期仕様に含めず、一度 root へ戻る。
- sidebar / gadget / documents の visible UI は unified shell の共通 token（`--shell-space-*`, `--shell-control-*`, `--shell-radius-*`, `--shell-scrollbar-*`, `--shell-field-bg`）を使う。normal unified shell では dock / chrome 系の上段 clutter を常設表示せず、gadget header は collapse affordance、専用 drag handle は並び替え affordance として分離する。`aria-expanded` と gadget body `aria-hidden` は必ず同期する。
- gadget body は `.gadget` class を保持する。Story Wiki などの gadget 内 render が `root.className` を上書きする場合も `.gadget` を消してはならない。collapsed body は height だけでなく padding / margin / pointer area も残さない。
- category activation は shell を先に表示し、重い gadget render は次 frame / idle へ遅延する。表示前に hidden 幅で重い graph/canvas を同期描画しない。
- command palette と visible UI から `ui-mode-*` / `toggle-fullscreen` を外し、`F2` は top chrome 表示に割り当てる。Electron menu の visible shell wording もこれに揃える。Normal left-edge hover は sidebar を force-open せず、root rail の一時 fade-in のみを行う。

- UI モードは `normal` / `focus` の 2 種。切替の単一入口は `setUIMode`。直接 `setAttribute('data-ui-mode', ...)` は禁止
- legacy stored UI values and saved `focus` mode指定は、公開 UI 縮退後の統合シェルでは `normal` に吸収する
- 執筆集中サイドバー（writing focus 系 UI）は `focus` モード時のみ有効。`normal` では従来のサイドバーアコーディオンを維持する
- hidden `ui-mode-select` は HTML から削除済み。コマンドパレットのモード切替は `ZenWriterApp.setUIMode()` と可視の mode-switch ボタン経由に統一する
- chapterMode は全ドキュメントで自動適用 (`ensureChapterMode`)。章追加は `Store.createChapter()` 経路のみ
- **chapterMode の章内容保存は常時実行 (必須)**。`settings.autoSave.enabled` はあくまで「自動保存 **通知 HUD** の表示有無」のみを制御する。保存そのものを止める設定ではない (session 109 で SSOT 化)
- **`ZenWriterUIModeChanged` イベントは `setUIMode` から必ず発火する**。view-menu / visual-profile 等の全購読者の同期はこのイベント 1 本に寄せる。DOM attribute の直接設定や独自経路で UI を更新してはならない (session 108-109 契約化)
- **UI 文言「通常表示」が正本**。docs / 実装 / コメント / テストではこの表記に統一する
- **読者プレビュー／HTML 組み立てなどの「読み取り」経路**では `splitIntoChapters` や `saveDocuments` による章モデルの暗黙更新を行わない（分解・移行は `ensureChapterMode` や明示的な処理に限定。目安は [`REFACTORING_SAFETY_CHAPTER_STORAGE.md`](REFACTORING_SAFETY_CHAPTER_STORAGE.md)）
- `ZWChapterStore.getChaptersForDoc` / `createChapter` / `assembleFullText` には **親ドキュメント ID** を渡す。`getCurrentDocId()` が章レコードを指す可能性があるため、章 UI では正規化ヘルパ（例: `getDocumentIdForChapterOps`）を通す
- **SectionsNavigator（chapterMode）**: Store の章を virtual heading として足すとき、**タイトルだけの重複判定は禁止**（同名章が欠落する）。エディタ上の実見出しと章リストを **先頭から同タイトルで 1 対 1** で突き合わせ、余った章のみ `_chapterId` 付き virtual を追加する。クリック遷移は `_chapterId` が正本
- サイドバー開閉は `toggleSidebar()` → `s.sidebarOpen` に永続化。`setUIMode` Normal 復帰時に復元
- エッジグローは Focus モードのみ
- 再生オーバーレイ表示中（`data-reader-overlay-open='true'`）はフローティングツールバーを非表示
- WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー `[...]` 経由。直接ボタンは存在しない
- 装飾グループ (toolbar-group--decorate) と Canvas Mode ボタンは HTML から完全削除済み。復活させない
- 再生オーバーレイ exit で大きな return overlay をエディタ操作領域の上に残さない。編集面へフォーカスを戻す
- Focus モードでツールバーの top gap やサイドパネルの writing surface 重なりを生じさせない
- `ZWChapterNav.convertForExport` は `class` に修飾子（例: `chapter-link--broken`）が付いても章リンクを `#` アンカーへ変換する
- リッチ編集表示（`editor-wysiwyg.js`）でアニメーション/テクスチャエフェクトは即時適用する（WP-004 Phase 1）

## Wiki と Reader プレビュー（コンテンツ経路）

- editor-preview からの wikilink クリック → Wiki ガジェット表示が動作する
- Reader での wikilink クリック → ポップオーバー（タイトル + 本文抜粋）を表示する
- `[[` 入力時の Wiki エントリ補完は Normal モードのみ。Focus では非表示にする
- wikilink / 傍点 / ルビのインライン後処理は `js/zw-inline-html-postmarkdown.js`。MD プレビューと読者本文の装飾〜章リンク順序は `js/zw-postmarkdown-html-pipeline.js`（Reader は `convertChapterLinks` → `convertForExport`、Phase 3 範囲）

## a11y（再生オーバーレイ UI）

- `#reader-preview` に `aria-describedby="reader-mode-hint"`。戻る・保存・縦横切替などに用途別 `aria-label`
- フルツールバーの `#toggle-reader-preview`（目アイコン）は、再生オーバーレイ導線として用語・色・アイコン寸法を一貫化する（`css/style.css` の `.toolbar-group--editor #toggle-reader-preview`）

## レイアウト（ツールバー・Focus サイドバー）

- Normal サイドバーは「セクション」「構造」カテゴリを既定で折りたたみ。初回 category open の体感を優先し、`app-gadgets-init.js` で structure / sections を eager mount せず、表示時に遅延初期化する
- Focus で閉じた `#sidebar` の右端がビューポート左縁と一致する場合、`box-shadow` / `border-right` が画面内に漏れないよう非オーバーレイ時は抑制する
- Focus かつ `data-edge-hover-top='true'` の間、`--toolbar-height`（`syncToolbarHeightWithCSSVar` 実測）分だけ `.editor-container` に `padding-top` を付け、上端スライドインしたツールバーと本文を重ねない
- ツールバー実高とレイアウトは `e2e/toolbar-editor-geometry.spec.js` で検証する。`--toolbar-height` は実測高と 2px 以内で一致すること
- 768px 以下の `.toolbar` は折り返し行を上揃え（`align-items` / `align-content: flex-start`）。`min-height: var(--toolbar-height)` は使わない。狭幅の `.toolbar` / `.editor-container` は `height` を transition 対象外にし、高さ変化時の伸縮アニメーションを抑制する

## コマンドパレット（フォーカス移動）

- Normal/Focus 切替後は rAF 二重で執筆面へフォーカス復帰する
- 再生オーバーレイ切替後は `#reader-back-fab` へフォーカスする（隠し textarea へ奪わない）

## Slim Mode Invariants

- `data-sidebar-slim="true"` はアプリ起動時に `bootstrapAccordion()` で常時設定される
- normal unified shell の slim mode では gadget collapse affordance を消さない。detach / help / bulk toggle は隠してよいが、`gadget-chevron` と `gadget-header` の toggle は visible / clickable を維持する
- テスト時は必要に応じて `enableAllGadgets` / `disableWritingFocus` で slim を解除するが、session 127 以後は slim 中の collapse affordance も回帰対象にする

## E2E Test Invariants

- テストの beforeEach では `ensureNormalMode(page)` を呼び、保存設定が Focus の場合の暴走を防ぐ
- `page.click('#toggle-sidebar')` は viewport 外エラーの原因になるため、`openSidebar(page)` (evaluate 経由) を使用する
- Visual Audit は screenshot refresh だけでは有効ではない。実 UI フローを通じた状態証明 + 重複画像検出が必要

## Test Discipline (テスト過剰禁止 — session 94/108 方針 + session 109 例外)

- テスト追加は「検証目的が明確」かつ「回帰リスクが顕在化している」ときだけ行う
- 成功済みパスの定期再実行・確認目的の手動チェックリスト拡張は行わない
- 存在確認 (`toBeAttached` / `toBeVisible` のみで挙動未検証) テストは書かない
- **user 実機で発覚した不具合に対しては、同種の回帰を防ぐ最小テストの追加を許容する** (session 109 例外: session 108 の 4 件は既存 E2E で検出不能だったため追加が正当化された)
- E2E・手動チェックリストの件数は凍結ではなく慎重に管理。追加時は LEDGER に理由を記録
- **Web 自動検証と package/Electron 手動検証は混同しない**。package 未確認項目を「自動証拠化完了」とは書かない

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
- Windows の package 実機確認は、`cmd /c start` ではなく **PowerShell `Start-Process` の安全起動導線**を正とする。起動環境汚染 (`NODE_OPTIONS` / Playwright preload) を抱えたまま packaged exe を評価しない
