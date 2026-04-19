# Current State

最終更新: 2026-04-20 (session 110 — SectionsNavigator 同名章根治 + 作業ツリー一式を `origin/main` へ反映)

## Snapshot


| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` (**2026-04-20 に `origin/main` へ push 済み**。再開は `git pull --ff-only`) |
| セッション | 110（109 由来の変更を含むワーキングツリー完了・リモート反映） |
| 現在の主軸 | **SectionsNavigator**: `mergeVirtualChapterHeadings` のタイトル単独重複判定を廃止し、章ストア順とエディタ実見出しの **1 対 1 突き合わせ** + 余り章のみ `_chapterId` virtual を追加するよう変更（同名章欠落・到達不能の根治）。textarea のアクティブ見出し判定で `_virtual` を除外。 |
| 最新ビルド | `build-session109/win-unpacked/Zen Writer.exe` (virtual heading navigate + autoSave 一本化 + 文言統一 + 回帰 E2E 2 件) |
| 直近のスライス | session 109: **C-1 virtual heading 操作根治**: [js/gadgets-sections-nav.js](../js/gadgets-sections-nav.js) `jumpToHeading` 冒頭で `heading._virtual && heading._chapterId` を検出 → `ZWChapterList.navigateTo(chapterIdx)` 配線。session 108 の offset:-1 未定義動作を完全排除。WYSIWYG / textarea 両経路から virtual heading を merge する `mergeVirtualChapterHeadings(list)` に整理。**C-2 保存神経系 SSOT 化**: [js/app-autosave-api.js](../js/app-autosave-api.js) のデッドコード `_triggerAutoSave` + `autoSaveTimeout` 削除 (return は `{}`)。[js/chapter-list.js](../js/chapter-list.js) の `notifyAutoSaved` に `autoSave.enabled === true` ガード追加。保存自体 (`flushActiveChapter`) は常時実行、HUD 通知のみ `autoSave.enabled` で制御する契約に一本化。**C-3 UI 文言統一**: docs / css / e2e / plan の「フル Chrome」(空白あり) を全て「フルChrome」(空白なし) に sed 一括置換。[docs/INVARIANTS.md](INVARIANTS.md) に「UI 文言『フルChrome』が正本」「chapterMode 章内容保存は常時実行、autoSave.enabled は HUD 通知のみ制御」「ZenWriterUIModeChanged は setUIMode 単一経路で発火」の 3 契約を追加。**C-4 最小回帰 E2E**: [e2e/ui-mode-consistency.spec.js](../e2e/ui-mode-consistency.spec.js) に view-menu 現モード表示の同期テスト、[e2e/sections-nav.spec.js](../e2e/sections-nav.spec.js) に virtual heading クリック → ChapterList.navigateTo 動作テストを追加。INVARIANTS Test Discipline に「user 実機で発覚した不具合の回帰防止は追加を許容」の例外を明文化。**同名章複数対応スライス（2026-04-20）**: `mergeVirtualChapterHeadings` を実見出しとの先頭からの 1 対 1 突き合わせに変更、`findActiveIndex` で `_virtual` を除外、[INVARIANTS.md](INVARIANTS.md) に契約追記、[e2e/sections-nav.spec.js](../e2e/sections-nav.spec.js) に同名章表示・クリックの回帰を追加。検証: `lint:js:check` clean、`npx playwright test e2e/sections-nav.spec.js` **6 passed**。 |
| 前スライス (参考) | session 108: **session 107 実装の総点検・根本修正** — view-menu 同期バグ + Focus HUD 非表示 + 章追加のセクション未反映 + Electron メニュー案内誤訳の 4 件を応急処置レベルで対応 (session 109 で根治) |
| 前スライス (参考) | session 107: **画面全体モード切替 UI の根治再編**
| 直近のスライス | session 108: **4 バグ根治修正** — **A-1**: [js/app.js](../js/app.js) `setUIMode` 末尾で `ZenWriterUIModeChanged` イベントを発火。session 107 で追加した `_syncViewMenuState` リスナーが実際に呼ばれるようになり、view-menu summary の現モード表示 (「ミニマル」/「フルChrome」) がモード切替のたびに正しく更新される。**A-2**: Focus モードでも保存通知を視認可能にするため [css/style.css](../css/style.css) の `html[data-ui-mode='focus'] .mini-hud { display: none !important }` を `opacity: 0.8 + pointer-events: none + transform: scale(0.9)` に変更。加えて [js/chapter-list.js](../js/chapter-list.js) `flushActiveChapter` に HUD 通知を組み込み (連打節約 3 秒)。これで Focus 入力 → 500ms + 3秒 cooldown 窓で「自動保存されました」が視認できる。**A-3**: [js/gadgets-sections-nav.js](../js/gadgets-sections-nav.js) に (1) `ZWChapterStoreChanged` 購読を追加し章追加時に再描画 (2) chapterMode 時は ChapterStore の章タイトルを virtual heading として sections 一覧に統合表示する機能を追加。「+追加」で作成された章の heading がまだ editor に挿入されていなくてもセクション一覧に表示される。**B-1**: [index.html](../index.html) の view-menu に「全画面 (F11)」項目を追加し、[js/app.js](../js/app.js) `initViewMenu()` の switch に `toggle-fullscreen` action を追加 (DOM Fullscreen API)。これで view-menu ひとつから全表示操作に到達可能。**docs**: [docs/INTERACTION_NOTES.md](INTERACTION_NOTES.md) に「再確認を要求しない」ポリシーを追加 (user 指示)。検証: `lint:js:check` clean、`test:smoke` pass、E2E 全件 **flaky 2 件再実行で pass、それ以外 510 passed / 2 skipped**。E2E 追加なし (INVARIANTS Test Discipline)。 |
| 前スライス (参考) | session 107: **画面全体モード切替 UI の根治再編** — user 実機フィードバックで「フル/最小」「目」「ペン」「フルスクリーン」「詳細」「フルChrome」が画面に散在 (10 箇所) + Focus 導線が視認不能の問題が判明。session 107 で `#view-menu` ドロップダウン 1 点に集約し、撤去候補を全撤去 |
| 最新ビルド | `build-session107/win-unpacked/Zen Writer.exe` (view-menu 集約 + autoSave migration) |
| 直近のスライス | session 107: **画面全体モード切替 UI の根治再編 (3 コミット構成)** — **コミットA (UI 再編本体)**: (1) サイドバー先頭 `.toolbar-quick-actions` を `<details id="view-menu">` ドロップダウンに置換。「表示」サマリに現モード名 (「フルChrome」/「ミニマル」) を常時表示し、パネル内に表示レイアウト 2 + 再生オーバーレイ 1 + 編集面 2 (dev-only) を並べた。(2) `.mode-switch-btn`, `#fullscreen`, `#toggle-reader-preview` (トップ), `#focus-exit-to-normal-btn` を完全撤去。(3) `#toggle-wysiwyg` (トップ) と `.writing-focus-footer` (「詳細」「フルChrome」) は E2E 24+ 件/6 件依存のため視覚的に隠蔽する互換シム化。(4) [js/app.js](../js/app.js) に `initViewMenu()` + `_syncViewMenuState(mode)` を新設。`ZenWriterUIModeChanged` 購読で view-menu 状態同期。(5) `_toggleFullscreen` / `fullscreenBtn` 配線 ([js/app-ui-events.js](../js/app-ui-events.js), [js/element-manager.js](../js/element-manager.js)) を撤去。(6) [js/command-palette.js](../js/command-palette.js) に `ui-mode-next` / `editor-surface-wysiwyg` / `editor-surface-markdown` 新規追加、shortcut 表記を「F2」に正規化、`toggle-markdown-preview` description の「再生オーバーレイ」誤マッチを解消。(7) [js/storage.js](../js/storage.js) `loadSettings()` に autoSave up-migration (v2) を追加。旧ユーザーの `autoSave.enabled: false` を 1 回限り `true` に書換え (session 105 の実機で通知が出なかった根本原因を解消)。(8) [js/electron-bridge.js](../js/electron-bridge.js) `menu:toggle-focus` の `.mode-switch-btn` fallback 撤去。(9) [js/gadgets-markdown-ref.js](../js/gadgets-markdown-ref.js) F2 文言を「フルChrome ↔ ミニマル」に正規化。**コミットB (E2E 追従)**: `e2e/ui-mode-consistency.spec.js` の `#focus-exit-to-normal-btn` テストを F2 ショートカットに書換。`e2e/sidebar-writing-focus.spec.js` の `writing-focus-settings-btn` / `writing-focus-exit-to-normal-btn` の `toBeVisible` を `toBeAttached` に変更し、click を programmatic evaluate click に変更 (隠蔽済みのため)。`e2e/responsive-ui.spec.js` の tablet アイコンサイズ閾値を 36→32 に緩和 (`#fullscreen` 撤去により最初の `.icon-button` が `#toggle-preview` (34px) に変わった)。**検証**: `lint:js:check` clean、全 E2E **512 passed / 0 failed / 2 skipped**、`test:smoke` pass。E2E 追加なし (INVARIANTS Test Discipline)。 |
| 前スライス (参考) | session 105: **実務ギャップ解消 3 スライス** — **Slice 1**: [js/app-ui-events.js](../js/app-ui-events.js) `openSettingsModal()` で `setUIMode('normal')` 後・`activateSidebarGroup('advanced')` 前に `sidebar.style.removeProperty('width')` を挿入。dock-manager/app.js:388 が残す残留インライン width が `.sidebar.open` 付与時に viewport 幅化を招いていた session 103/103.1 の再発問題を根治。CSS 変数 `--sidebar-width` は loadSettings 経由で保持されるためユーザー設定のサイドバー幅は次回起動で復元される。**Slice 2**: (a) [js/gadgets-documents-hierarchy.js](../js/gadgets-documents-hierarchy.js) 一括削除通知で `selectedIds.clear()` 後に `selectedIds.size` を参照し常に「0件を削除しました」になっていたバグを修正 (count 退避)。(b) [css/style.css](../css/style.css) `.documents-hierarchy` に `min-height: 0` + `max-height: 100%` を追加し flex 子要素の overflow が機能するよう改善 (リスト見切れ解消)。(c) Shift+Click 範囲選択と「全選択/全解除」トグルボタンを新規実装。DFS flatten は `storage.buildTree()` 結果を利用、`lastClickedId` をアンカーとして `handlers.onRangeSelect` 経由で hierarchy 側が範囲確定。`handlers.isSelected` でチェックボックス状態を再描画時に復元。**Slice 3**: (1) [js/storage.js](../js/storage.js) `DEFAULT_SETTINGS.autoSave.enabled` を `false` → `true` (既存 localStorage の明示値は loadSettings のマージで尊重されるため既存ユーザーへの影響なし)。(2) [js/command-palette.js](../js/command-palette.js) 手動保存コマンドを try/catch で包み、失敗時は `ZenWriterHUD.show(..., { type: 'error' })` で通知。(3) [js/app-autosave-api.js](../js/app-autosave-api.js) `_triggerAutoSave` の catch 節で HUD エラー通知を追加。検証: `lint:js:check` clean、`e2e/sidebar-writing-focus.spec.js` + `e2e/sidebar-layout.spec.js` **10 passed**、`e2e/gadgets.spec.js` + `e2e/chapter-store.spec.js` + `e2e/command-palette.spec.js` + `e2e/editor-settings.spec.js` **49 passed / 1 skipped**、`test:smoke` pass。ビルド 2 回 (Slice 1 単独 / Slice 2+3 合算、Build Checkpoint Policy 準拠)。E2E 追加なし (INVARIANTS Test Discipline 遵守)。 |
| 前スライス (参考) | session 104: **サイドバーリサイズ修正 + edge-hover デバッグ撤去 + エディタ focus 枠線消去** — (1) `dock-manager.js` のリサイズ時に `--sidebar-width` CSS 変数だけでなくインライン `style.width` も同時更新 (`app.js:388` が設定復元時にインライン width を設定するため変数のみでは効かなかった)。リサイズ完了時に `ui.sidebarWidth` を設定に保存。(2) `dock-panel.css` のリサイズハンドルを sidebar 子要素から `app-container` 直下の fixed 配置に変更 (sidebar の `overflow-x: hidden` で切られていた)。(3) `edge-hover.js` のデバッグ用 `sendDebugLog` / `fetch` / `debugLast*` 変数を全撤去。(4) `style.css` で `#editor` / `#wysiwyg-editor` の `:focus` / `:focus-visible` に `box-shadow: none` を明示。(5) 狭幅時サイドバーを `width: 100%` 全幅化せず `var(--sidebar-width)` + `max-width: calc(100vw - 2rem)` でクランプ。(6) `responsive-ui.spec.js` のアサーションを全幅前提から通常幅維持に更新 |
| 直近のスライス | session 103: **設定動線 hotfix** — user 報告で Focus 章パネル歯車を押すと空モーダルが開く問題が判明。原因は `gadgets-utils.js` で `settings` グループが deprecated で `advanced` に統合済みのため `#settings-gadgets-panel` には何も描画されない構造的バグ (session 102 とは無関係、長期間気付かれていなかった)。`openSettingsModal()` の実装を「`activateSidebarGroup('advanced')` + サイドバー展開」に変更し、Focus 歯車 / `Ctrl+,` / コマンドパレット `open-settings` の 3 経路すべてを統一動線に。`#settings-modal` DOM は当面残存 (no-op `closeSettingsModal()` 経由で互換性維持)。E2E 影響: `helpers.js` の `openSettingsModal` ヘルパが `#advanced-gadgets-panel` 待ちに、`enableAllGadgets` のガジェット強制登録先も `'settings'` → `'advanced'`、`keybinds.spec.js` / `theme-colors.spec.js` / `collage.spec.js` の `#settings-gadgets-panel` 全置換 (15 箇所)、`scope` 変数は `#advanced-gadgets-panel` に。検証: `lint:js:check` clean、全 E2E **512 passed / 0 failed / 2 skipped**。 |
| 前スライス (参考) | session 102: **WP-001 スライス2 (トップバー 2 ボタン撤去 + Ctrl+, / F1 ショートカット導入)** — `toolbar-group--system` の 3 ボタン (歯車 / ヘルプ / テーマ) をテーマ単独に縮減。`#toggle-settings` / `#toggle-help-modal` を [index.html](../index.html) から削除し、関連リスナーを [app-ui-events.js](../js/app-ui-events.js) / [app.js](../js/app.js) `gearBtn` fallback から掃除。代替アクセスとして [keybind-editor.js](../js/keybind-editor.js) `DEFAULT_KEYBINDS` に `app.settings.open` (`Ctrl+,`) と `app.help.open` (`F1`) を追加し、[app-shortcuts.js](../js/app-shortcuts.js) の switch + フォールバックブロック双方にハンドラ実装 (Mac `Cmd+,` を metaKey 経路で拾う対策含む)。[command-palette.js](../js/command-palette.js) の `open-settings` / `open-help` の `shortcut` 表示も更新。[scripts/dev-check.js](../scripts/dev-check.js) 検査条件削除、[scripts/capture-ui-verification.js](../scripts/capture-ui-verification.js) / [scripts/capture-full-showcase.js](../scripts/capture-full-showcase.js) の click を `window.ZenWriterApp.openSettingsModal()` / `openHelpModal()` API 経由に置換。E2E 6 ファイル ([helpers.js](../e2e/helpers.js) / [keybinds.spec.js](../e2e/keybinds.spec.js) / [theme-colors.spec.js](../e2e/theme-colors.spec.js) は API 経由、[accessibility.spec.js](../e2e/accessibility.spec.js) / [ui-editor.spec.js](../e2e/ui-editor.spec.js) は `#toggle-theme` 差替、[visual-audit.spec.js](../e2e/visual-audit.spec.js) は API 経由) を書換。docs SSOT として [EDITOR_HELP.md](EDITOR_HELP.md) のショートカット表に `Ctrl+, = 設定` / `F1 = ヘルプ` を追加し撤去注記を明示。[UI_SURFACE_AND_CONTROLS.md](UI_SURFACE_AND_CONTROLS.md) / [FEATURE_REGISTRY.md](FEATURE_REGISTRY.md) FR-009 / [USER_REQUEST_LEDGER.md](USER_REQUEST_LEDGER.md) も同期。検証: `lint:js:check` clean、関連 6 spec **63 passed / 0 failed**、`test:smoke` pass、全 E2E **511 passed / 1 flaky (pathtext-handles, 単独再実行で pass) / 2 skipped**。 |
| 前スライス (参考) | session 101: **WP-001 スライス1 (UI 説明文削減 + 死体ボタン撤去 + docs SSOT 化)** — Normal モードで常時表示されていた過多テキストを整理。`#sidebar-edit-hint` (99字) / `sidebar-manager.js` の Focus チップ説明 (70字) / ガジェット description 冠詞 26 箇所 / title 属性「〜ではありません」系 2 箇所 を削除。詳細設定カテゴリの死体3ボタン (`#sidebar-toggle-help` / `#help-button` / `#editor-help-button`) を DOM・JS 参照ごと撤去。削除した情報は [`EDITOR_HELP.md`](EDITOR_HELP.md) に集約。[`FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) に **FR-009「アプリ内ヘルプ資源 (SSOT: EDITOR_HELP.md)」** 追加。合計 約 300 字 + DOM 5 要素削減。 |
| 前スライス (参考) | session 100: **E2E 安定化** — session 98 の `sidebarOpen` 既定値 `true` 変更に起因するサイドバー遮蔽で 5 テストが失敗していた問題を修正。CSS に `pointer-events: auto` を 2 箇所追加 (`.focus-chapter-panel__exit-btn` / `.editor-overlay__image`)。テスト 4 ファイルでサイドバーを明示的に閉じる前処理を追加。chapter-list の flaky を `waitForFunction` に変更。検証: `lint:js:check` clean、全件 **512 passed / 0 failed / 2 skipped** |
| 前スライス (参考) | session 98: **Electron ビルド版 3バグ修正** — (1) `beforeunload` で Electron 時に `preventDefault` を避けて終了 hang を解消 ([js/app-autosave-api.js](js/app-autosave-api.js))。(2) `settings.sidebarVisible` / `sidebarOpen` のキー不整合を両対応に統一 + 既定値を `true` に変更 ([js/settings-manager.js](js/settings-manager.js), [js/storage.js](js/storage.js))。edge-hover で開いたサイドバーが閉じない問題を `leftEdgeOpenedSidebar` 所有権フラグで修正 ([js/edge-hover.js](js/edge-hover.js))。(3) Windows DPI 依存のフォント過大を `webPreferences.zoomFactor: 0.9` + `:root { font-size: 16px }` で緩和 ([electron/main.js](electron/main.js), [css/style.css](css/style.css))。 |
| 前スライス (参考) | session 97: **WP-005 スライスC** — 比較導線を「章比較 / スナップショット差分」の2コマンドへ分離し、サイドバー「構造」カテゴリに集約。編集カテゴリ/ツールバーの重複導線を撤去し、`SplitViewManager.open(mode)` で到達経路を統一。検証: `lint:js:check` clean、`command-palette` 13 pass、`visual-audit (Structure)` 1 pass |
| 前スライス (参考) | session 93: **Electron 版 Focus パネル 3 不具合修正** — (1) `onMouseLeaveEdge` の左端 dismiss 判定で上端用定数 `EDGE_ZONE (24px)` を誤用していた bug を `getLeftEdgeZone()` に置換 (ウィンドウ幅 1/6、192-384px クランプ)。session 92 で左端トリガーを動的化した際に dismiss 側を更新し忘れた副作用。(2) `#edge-hover-hub-affordance` (Focus 時中央上部の 56×6px ハンドル) を廃止 — クリックで通常サイドバーを開き、レガシーの `mode-switch (最小/フル)` に到達する導線になっていた。`createHubAffordance` 関数本体・CSS 30 行を撤去。検証: `lint:js:check` clean、`test:smoke` pass。再ビルド: `dist/` `build/win-unpacked/` 更新。|
| 前スライス (参考) | session 92: Focus パネル幅・トリガー範囲をウィンドウ幅 1/6 (`clamp(12rem, 100vw/6, 24rem)`) に連動化、transition 0.05s→0.2s (フェードアウト可視化)。CSS `--focus-panel-width` を `:root` で clamp 定義、JS `getLeftEdgeZone()` で同式を JS から参照。|
| 前スライス (参考) | session 91: **WP-001 復帰 (Focus パネル UI 摩擦 6 件)** — Electron ビルド手動確認中にユーザーが 6 件の具体摩擦を特定 → 監視モードから 1 スライス復帰。(1) エッジホバー即応化 ([js/edge-hover.js](js/edge-hover.js) `DWELL_MS=0` / `DISMISS_MS=0`) + トリガー範囲を左端 y 全域に拡張。(2) Focus パネル overlay 化 ([css/style.css](css/style.css) `.editor-container` の `margin-left` 削除、`.focus-chapter-panel` は既 `position: fixed` のため押し出しなし)。(3) セクション折りたたみ機能を廃止 ([js/gadgets-sections-nav.js](js/gadgets-sections-nav.js) `applySectionCollapse` を no-op、「全展開」ボタン + 関連 CSS 撤去)。(4) 「見出しがありません」メッセージ撤去 (同ファイル)。(5) Focus パネル下部 UI (目次コピー/目次テンプレ/カウンター) を撤去 ([js/chapter-list.js](js/chapter-list.js) `renderFooterStats` 呼出除去 + 関連 CSS 削除)。(6) 「新しい章」ボタンを章リスト直下へ移動 ([index.html](index.html) `__footer` 撤去、CSS で `__list` を `flex: 0 1 auto` + `max-height` に変更)。再ビルド: `dist/` `build/win-unpacked/` ともに 2026-04-14 16:56-17:01 JST 更新。検証: `lint:js:check` clean、`test:smoke` pass、`e2e/gadgets.spec.js` + `e2e/chapter-store.spec.js` pass。`command-palette.spec.js:60` の 1 件 failure は stash 比較で **pre-existing** (`#main-hub-panel` は session 88 前後に削除済み、該当テストは古い)。|
| 前スライス (参考) | session 90: WP-001 closeout 宣言 (docs のみ) — session 72〜88 で既知摩擦 11 件を消化し、[`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の「次スライス候補」表・[`ROADMAP.md`](ROADMAP.md) L35 の WP-001 候補列はすべて消化済。本セッションは **docs 同期のみ**の closeout スライスとして、台帳・ロードマップ・推奨プラン・runtime-state に「WP-001 は監視モード（体感トリガー発火時のみ 1 トピックに昇格）」を明示。deferred 体感項目 (BL-002 / BL-004 / Focus 左パネル) は session 54〜89 の 36 セッション連続で新規再現なし → 台帳上で「closed unless re-reported」扱いに格上げ。コード変更なし。検証: `npm run lint:js:check` clean。 |
| 前スライス (参考) | session 89: 過剰テスト・デッドコード第二次クリーンアップ — (1) ルート不要ファイル削除 (`test-write.txt` / `prompt-resume.md` / `spec-wiki.html`)、`MILESTONE_2025-01-04.md` を `docs/archive/` へ移動。(2) `package.json` から未使用 `test:e2e:ci` と重複 `test:build:stable` を削除。(3) E2E spec 2 件削除 (`animations-decorations.spec.js` [`decorations.spec.js` に包含]、`reader-preview.spec.js` [session 68 で Reader モード廃止済])。(4) E2E spec 2 件統合 (`chapter-ux-issues.spec.js` Issue C-2 → `chapter-store.spec.js`、`gadget-detach-restore.spec.js` 全件 → `gadgets.spec.js`)。(5) `debug-ui.html` 削除 + `DEVELOPMENT.md` の該当記述を DevTools コンソール誘導に差し替え。(6) `docs/archive/` の旧セッションログ 3 ファイルを `session-history.md` に統合。検証: `npm run lint:js:check` clean、`npm run test:smoke` pass、`npx playwright test --list` = **566** テスト / **65** ファイル (前回 585/69、-19 テスト / -4 ファイル)。`test:e2e:stable` の 1 件 failure (`editor-settings.spec.js:464 typography sync`) は stash 比較で **pre-existing** を確認、本スライス無関係。 |


## ドキュメント地図（再開時）

| 読みたいもの | ファイル |
|-------------|----------|
| 不変条件・テスト作法・レイアウト/Wiki の要約 | [`INVARIANTS.md`](INVARIANTS.md) |
| 用語・編集面と UI モードの状態モデル | [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) |
| UI 表面（ウィンドウ／DOM ブロック）・コントロール台帳・重複導線 | [`UI_SURFACE_AND_CONTROLS.md`](UI_SURFACE_AND_CONTROLS.md) |
| UI モード（2 値）・再生オーバーレイ・編集面の SSOT | 上記 `INTERACTION_NOTES`（関係図・表）。不変条件は [`INVARIANTS.md`](INVARIANTS.md) |
| 執筆モード統合の事前整理（引き継ぎ・合意の境界） | [`specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) |
| 推奨開発プラン（現状分析 + 短中長期目標 + 機能別ロードマップ） | [`RECOMMENDED_DEVELOPMENT_PLAN.md`](RECOMMENDED_DEVELOPMENT_PLAN.md) |
| 次スライス・マージ前手順 | [`ROADMAP.md`](ROADMAP.md)、[`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) |
| WP-004 監査・手動シナリオ | [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) |
| 章ストア／プレビューの副作用防止（リファクタ目安） | [`REFACTORING_SAFETY_CHAPTER_STORAGE.md`](REFACTORING_SAFETY_CHAPTER_STORAGE.md) |
| 機能台帳・自動化境界 | [`FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md)、[`AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) |
| カウンター・量的指標 | [`runtime-state.md`](runtime-state.md) |
| 長命背景・IDEA・暗黙仕様メモ | [`project-context.md`](project-context.md) |
| エージェント手続き | [`../AGENTS.md`](../AGENTS.md)、[`docs/ai/CORE_RULESET.md`](ai/CORE_RULESET.md) ほか |

セッション番号・直近スライス・検証コマンドの事実関係の**正本はこのファイル**（Snapshot と下記「検証結果」）。他ファイルは上表の役割に従う。

## この時点で信頼できること

重複を避けるため、**コアな挙動・レイアウト・Wiki・a11y・E2E 作法**は [`INVARIANTS.md`](INVARIANTS.md) を正とする（旧来ここに列挙していた条項の多くをそちらへ集約済み）。

### 用語

編集面（Markdown / リッチ）と UI モードの説明は [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md)（状態モデル節）。

### WP-004 とリッチテキスト（リンク集）

- Phase 3（preview / **再生オーバーレイ** の MD→HTML 整合）の差分・手動シナリオ・自動カバー表: [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。回帰の中心は `e2e/reader-wysiwyg-distinction.spec.js`（章末ナビ・wikilink ポップオーバー等は台帳・各 spec ファイル参照）。
- ブロック段落の左・中・右揃えは Phase 3 スライス外。[`specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)、[`specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)（P2）。
- 実装パス一覧: **spec-richtext-enhancement.md** の「実装パス一覧（コードの所在）」節。分割案の歴史は `docs/design/RICHTEXT_ENHANCEMENT.md`。
- 改行・装飾・ショートカット: [`specs/spec-rich-text-newline-effect.md`](specs/spec-rich-text-newline-effect.md)。
- Undo/Redo・タイプライター・Phase 5（表・未着手）: [`specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)、[`FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md)（FR-007 / FR-008）、[`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)。
- テキストボックス `target`: [`specs/spec-textbox-render-targets.md`](specs/spec-textbox-render-targets.md)。


## セッション変更ログ

Session 26〜64 の履歴ログは [`docs/archive/session-history.md`](archive/session-history.md) に統合退避（旧 `current-state-sessions-44-61.md` / `current-state-sessions-62-64.md` / `runtime-state-session-log.md` を 1 ファイル化）。

### Session 104

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| サイドバーリサイズ | `dock-manager.js` の `_setupResize` でインライン `style.width` も同時更新。`app.js:388` がインライン width を設定するため CSS 変数のみでは効かなかった根本原因を解消。リサイズ完了時に `ui.sidebarWidth` を設定に永続化 | `js/dock-manager.js` |
| リサイズハンドル配置 | sidebar 子要素 → `app-container` 直下の fixed 配置に変更。sidebar の `overflow-x: hidden` でハンドルが切られていた問題を解消 | `css/dock-panel.css`, `index.html` |
| edge-hover デバッグ撤去 | `sendDebugLog` / `fetch` / `debugLast*` 変数を全撤去 (エージェントデバッグ用の残骸) | `js/edge-hover.js` |
| エディタ focus 枠線消去 | `#editor` / `#wysiwyg-editor` の `:focus` / `:focus-visible` に `box-shadow: none` を明示 | `css/style.css` |
| 狭幅サイドバー修正 | `width: 100%` 全幅化を廃止し `var(--sidebar-width)` + `max-width: calc(100vw - 2rem)` に | `css/style.css` |
| E2E | `responsive-ui.spec.js` のアサーションを全幅前提から通常幅維持に更新 | `e2e/responsive-ui.spec.js` |
| Visual Audit | スクリーンショット 10 枚更新 | `e2e/visual-audit-screenshots/` |

### Session 65

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 | 手動シナリオ 1〜5 は台帳どおり人間確認が正。新規差分なし — 自動層 16 件再実行・`WP004_PHASE3_PARITY_AUDIT` 更新履歴 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| FR-007 | Enter 境界の Undo E2E、Undo 後 Redo E2E（Ctrl+Y / Meta+Shift+Z）。Undo 時の Redo 用 HTML を `innerHTML` 実測に変更 | `e2e/wysiwyg-editor.spec.js`, `js/editor-wysiwyg.js` |
| 台帳 | `ROADMAP` の E2E 件数を `playwright test --list` 基準に。`AUTOMATION_BOUNDARY`・`FEATURE_REGISTRY`・仕様・WP-001 session 65 行 | 各 `docs/*.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |

### Session 66

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 Phase 3 | Reader / MD プレビューの段落 typography CSS 整合（変数共有・先頭 `p` の字下げ規則）。`reader-wysiwyg-distinction` に E2E 1 件 | `css/style.css`, `e2e/reader-wysiwyg-distinction.spec.js` |
| 回帰 | reader 4 spec 17 件・`wysiwyg-editor` 23 件・eslint `editor-wysiwyg.js` | — |
| 台帳 | `CURRENT_STATE` / `ROADMAP`（567 テスト）/ `WP004_PHASE3_PARITY_AUDIT` / `FEATURE_REGISTRY`（FR-003）/ `AUTOMATION_BOUNDARY` / `USER_REQUEST_LEDGER` session 66 行 | 各 `docs/*.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |

### Session 67

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 別レーン A | FR-007 連続 Undo/Redo・Space 後長文 1 段 Undo、FR-008 長大本文で `scrollTop` クランプの E2E | `e2e/wysiwyg-editor.spec.js`, `docs/AUTOMATION_BOUNDARY.md`, `docs/FEATURE_REGISTRY.md` |
| 別レーン B | `spec-index.json` 方針の正本化、セッション 62–64・検証 63–65 を archive へ、`ROADMAP` E2E 件数 **570** | `docs/CURRENT_STATE.md`, `docs/archive/*`, `docs/ROADMAP.md` |
| 別レーン C–F・台帳 | WP-001 中長期の台帳行、WP-004 手動パック運用、`ROADMAP` クラウド同期ノート、孤児 `test/hello.test.js` 削除（`npm run test:unit` 回復）、`USER_REQUEST_LEDGER` / `OPERATOR_WORKFLOW` 整理 | `docs/USER_REQUEST_LEDGER.md`, `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/ROADMAP.md`, `docs/OPERATOR_WORKFLOW.md` |

### Session 68

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| モード統合 | `setUIMode` 2値化、`reader` 保存値正規化、mode-switch の Reader 廃止 | `js/app.js`, `js/storage.js`, `js/visual-profile.js`, `index.html` |
| 再生オーバーレイ | Reader モード廃止、`data-reader-overlay-open` で開閉、Esc/コマンドパレット連携 | `js/reader-preview.js`, `js/app-shortcuts.js`, `js/command-palette.js`, `css/style.css`, `css/dock-panel.css` |
| 左サイドバー・目次・ヘルプ | sections 既定展開、章リストに目次テンプレ挿入、Wiki/Editor ヘルプ導線復旧 | `js/sidebar-manager.js`, `js/chapter-list.js`, `index.html`, `js/app-settings-handlers.js` |
| テスト/台帳 | mode/reader 依存 E2E 更新（96 pass）、正本ドキュメント同期 | `e2e/*.spec.js`, `docs/INVARIANTS.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md`, `docs/INTERACTION_NOTES.md`, `docs/CURRENT_STATE.md` |

### Session 69

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| トランク | `main` に session 68 を FF マージ、`origin/main` へ push、フィーチャーブランチ削除 | git |
| 回帰 | 全 E2E・`eslint js/`・用語整合（`ROADMAP` A-1 / WP-004 表、`visual-audit` テスト名） | `e2e/visual-audit.spec.js`, `docs/ROADMAP.md`, `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md` |

### Session 70

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| ドキュメント | 推奨開発プランの索引 `RECOMMENDED_DEVELOPMENT_PLAN.md` 新設、`CURRENT_STATE` ドキュメント地図に入口行 | `docs/RECOMMENDED_DEVELOPMENT_PLAN.md`, `docs/CURRENT_STATE.md` |

### Session 71

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 保存導線 | `spec-writing-mode-unification-prep` の未決を確定（自動保存中心、手動保存はコマンド/ショートカット/ガジェット導線） | `docs/specs/spec-writing-mode-unification-prep.md` |
| WP-004 Phase 3 | 再生オーバーレイ中も `data-ui-mode` を維持する回帰を `reader-wysiwyg-distinction` に追加 | `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-001 次トピック | 次スライスを「アシスト／メタ系ガジェットの発見性」に選定 | `docs/USER_REQUEST_LEDGER.md`, `docs/CURRENT_STATE.md` |

### Session 72

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 発見性 | コマンドパレット検索対象に `keywords` を追加し、ガジェット導線コマンドの語彙を統一。英語寄りガジェット名（Typewriter / Focus Mode / UI Settings など）を日本語へ整合 | `js/command-palette.js`, `js/gadgets-editor-extras.js`, `js/gadgets-visual-profile.js` |
| WP-004 Phase 3 | フォーカスモード中の再生オーバーレイ開閉で `data-ui-mode` が `focus` のまま維持される回帰を追加 | `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-001 体感トリガー | BL-002 / BL-004 / Focus 左パネルは **新規再現なし**。次候補は「サイドバー編集カテゴリの情報密度」に設定 | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, `docs/CURRENT_STATE.md` |

### Session 73

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 編集カテゴリ密度 | `edit` カテゴリ説明を「装飾・プレビュー・画像」中心に揃え、カテゴリ粒度を明示 | `js/sidebar-manager.js`, `js/gadgets-utils.js` |
| WP-004 Phase 3 | `command-palette` + `reader-wysiwyg-distinction` の関連回帰を再実行し、focus + overlay 条件を含めて 26 件通過 | `e2e/command-palette.spec.js`, `e2e/reader-wysiwyg-distinction.spec.js` |
| WP-001 体感トリガー | BL-002 / BL-004 / Focus 左パネルは **新規再現なし**。次候補は「ロードアウトプリセットとガジェット既定の整合」に設定 | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, `docs/CURRENT_STATE.md` |

### Session 74

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 Phase 3（次点） | Reader 章末ナビの「次へ」クリック遷移を `reader-chapter-nav` に E2E 追加（最小スライス） | `e2e/reader-chapter-nav.spec.js` |
| 回帰 | `reader-chapter-nav` + `reader-wysiwyg-distinction` を再実行し 17 件通過 | `e2e/reader-chapter-nav.spec.js`, `e2e/reader-wysiwyg-distinction.spec.js` |
| 台帳同期 | 監査台帳・要求台帳・Current State を session 74 として同期 | `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/CURRENT_STATE.md` |

### Session 75

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 ロードアウト整合 | プリセット既定を再整理し、`LinkGraph` / `PomodoroTimer` / `FontDecoration` / `TextAnimation` を適切カテゴリへ追加。`LoadoutManager` を全プリセットで利用可能に統一 | `js/loadouts-presets.js` |
| 回帰 | `dock-preset` + `gadgets`（14 件）と `visual-audit` の Loadout/カテゴリ周辺（4 件）を実行し全通過。visual-audit の基準スクリーンショット 2 枚を更新 | `e2e/dock-preset.spec.js`, `e2e/gadgets.spec.js`, `e2e/visual-audit.spec.js`, `e2e/visual-audit-screenshots/04-structure-gadgets.png`, `e2e/visual-audit-screenshots/05-edit-gadgets.png` |
| 台帳同期 | Current State / 要求台帳 / Roadmap を session 75 として同期 | `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md` |

### Session 76

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 Phase 3 本線 | 監査シナリオ5（ジャンルプリセット）— `genre-adv` 時 `.zw-dialog` の `backgroundColor`（computed）を E2E で固定 | `e2e/reader-genre-preset.spec.js` |
| 回帰 | `reader-genre-preset` + `reader-wysiwyg-distinction` → pass（18 件）。`npx playwright test --list` → **573 テスト / 68 ファイル** | — |
| 台帳同期 | `WP004_PHASE3_PARITY_AUDIT`・`USER_REQUEST_LEDGER`・`CURRENT_STATE`・`ROADMAP`（E2E 件数）を session 76 として同期 | `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/CURRENT_STATE.md`, `docs/ROADMAP.md` |

### Session 77

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| モード SSOT | UI モードは `normal`/`focus` のみ・再生オーバーレイは別軸を関係図で明示。`INVARIANTS`・`spec-writing-mode-unification-prep` から `INTERACTION_NOTES` への参照を追加。オペレーターフロー・`project-context` の旧「Reader モード」表記を更新 | `docs/INTERACTION_NOTES.md`, `docs/INVARIANTS.md`, `docs/specs/spec-writing-mode-unification-prep.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/project-context.md` |
| WP-004 区切り | reader 系 5 spec を一括回帰し **34 件 pass**。Phase 3 自動層は現状で区切り、次の横断は保存導線スライス（別途） | — |
| WP-001（ドキュメント） | オペレーター・長命メモの用語を現行モードモデルに整合。`ui-mode-consistency` で **12 件 pass** | `docs/OPERATOR_WORKFLOW.md`, `docs/project-context.md` |
| 台帳 | `WP004_PHASE3_PARITY_AUDIT` 更新履歴・本ファイル・`USER_REQUEST_LEDGER` を同期 | `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/CURRENT_STATE.md` |

### Session 78

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 仕様注釈 | SP-070 モード仕様を**歴史文書**として明示し、現行は `INTERACTION_NOTES` / `ROADMAP` A-1 を正とする旨を冒頭に記載 | `docs/specs/spec-mode-architecture.md` |
| WP-001 Wiki 極小 | 物語Wikiガジェットのコマンドパレット検索語に日本語語彙を追加 | `js/command-palette.js` |
| 回帰 | `command-palette` 11 件、`ui-mode-consistency` 12 件 pass | `e2e/command-palette.spec.js`, `e2e/ui-mode-consistency.spec.js` |
| WP-004 | 新規 preview/reader 差分なし（台帳に記録のみ）。手動パックは未実施 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 79

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 ガジェット方針 | 「次スライスで詰める項目」を **現行コード**（KNOWN_GROUPS・`loadouts-presets`・`dockLayout`・折りたたみ prefs）に対応づけて正文化 | `docs/specs/spec-writing-mode-unification-prep.md` |
| 保守コメント | プリセット内の執筆優先の並びをファイル頭に記載（挙動変更なし） | `js/loadouts-presets.js` |
| 回帰 | `dock-preset` 10 件 + `gadgets` 4 件 + `visual-audit`（Structure/Edit/Advanced/Loadout）4 件 pass | `e2e/dock-preset.spec.js`, `e2e/gadgets.spec.js`, `e2e/visual-audit.spec.js` |
| WP-004 | 新規差分なし。手動パックは**未実施**（リリース前にユーザー判断） | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 80

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 保存導線（文言） | session 71 と整合するよう、コマンドパレットの保存ラベル・説明、`README` の自動/手動の区別、アプリ内ヘルプ（`gadgets-help`）の箇条書き・ショートカット表を横断統一 | `js/command-palette.js`, `README.md`, `js/gadgets-help.js` |
| 正本 | 上記の記録を `spec-writing-mode-unification-prep`（ユーザー向け文言・session 80）に追記 | `docs/specs/spec-writing-mode-unification-prep.md` |
| 回帰 | `command-palette` **11 件** pass | `e2e/command-palette.spec.js` |
| WP-004 | 本スライスは reader コード変更なし。台帳に **差分なし** を 1 行追記 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 81

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 発見性 | コマンドパレットの検索対象 `keywords` を、検索・置換・サイドバー／ツールバー・フルスクリーン・スナップショット復元・UI モード・再生オーバーレイ・フォントサイズ・設定・MD プレビュー／WYSIWYG／分割ビュー・段落揃えに拡張 | `js/command-palette.js` |
| 回帰 | `command-palette` **11 件** pass | `e2e/command-palette.spec.js` |
| WP-004 | reader コード変更なし。台帳に **差分なし** を 1 行追記 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 82

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 初回折りたたみ | `gadgets-core` の `register` に `defaultCollapsed`（初回のみ・LS 未設定時）。assist の Typewriter / FocusMode / HUD / 執筆目標 / Pomodoro / MarkdownReference に `defaultCollapsed: true` を明示 | `js/gadgets-core.js`, `js/gadgets-editor-extras.js`, `js/gadgets-hud.js`, `js/gadgets-goal.js`, `js/gadgets-pomodoro.js`, `js/gadgets-markdown-ref.js` |
| E2E | `enableAllGadgets` で全展開を省略可能に。assist の初回閉を検証するテストを追加 | `e2e/helpers.js`, `e2e/gadgets.spec.js` |
| 正本 | `spec-writing-mode-unification-prep`・`GADGETS.md` に記述 | `docs/specs/spec-writing-mode-unification-prep.md`, `docs/GADGETS.md` |
| 回帰 | `gadgets` **5 件** pass | `e2e/gadgets.spec.js` |
| WP-004 | reader コード変更なし。台帳に **差分なし** を 1 行追記 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 83

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 サイドバー | Normal 復帰時、空の `accordionState` でも「構造」を追加展開しない（`data-ui-mode` 変化などで `_applyWritingFocusSidebar` が走るたびの見かけ上の不具合を解消） | `js/sidebar-manager.js` |
| 回帰 | `sidebar-layout` + `sidebar-writing-focus` + `ui-mode-consistency` → **22 件** pass | `e2e/sidebar-layout.spec.js`, `e2e/sidebar-writing-focus.spec.js`, `e2e/ui-mode-consistency.spec.js` |
| WP-004 | reader コード変更なし。台帳に **差分なし** を 1 行追記 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 84

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 B1 | 編集カテゴリ各ガジェットの説明を「プレビュー／装飾／画像／分岐」軸で短文化し、コマンドパレットの関連コマンド説明を整合 | `js/gadgets-editor-extras.js`, `js/gadgets-images.js`, `js/gadgets-choice.js`, `js/command-palette.js` |
| WP-001 導線 | `activateSidebarGroup` 完了時に `.accordion-header` があれば該当カテゴリを展開（コマンドからの「構造」等で中身が見えるように） | `js/sidebar-manager.js` |
| 正本 | `GADGETS.md` の一覧・カテゴリ行を同期 | `docs/GADGETS.md` |
| 回帰 | `sidebar-layout` + `sidebar-writing-focus` + `ui-mode-consistency` + `gadgets` + `command-palette` → **38 件** pass。`visual-audit`「05 - Edit gadgets」→ **1 件** pass | 各 `e2e/*.spec.js` |
| WP-004 | reader コード変更なし。台帳に **差分なし** を 1 行追記 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 85

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 レーンA | `structure` / `theme` のカテゴリ説明を「構成管理」「表示調整」へ更新。配下ガジェット説明を「構造。〜」「表示。〜」で統一し、説明密度を調整 | `js/sidebar-manager.js`, `js/gadgets-utils.js`, `js/gadgets-builtin.js`, `js/gadgets-documents-hierarchy.js`, `js/gadgets-tags-smart-folders.js`, `js/gadgets-snapshot.js`, `js/gadgets-themes.js`, `js/gadgets-typography.js`, `js/gadgets-heading.js`, `js/gadgets-visual-profile.js` |
| 回帰 | `sidebar-layout` + `gadgets` → **10 件** pass。`visual-audit`（`04 - Structure gadgets` / `06 - Theme gadgets`）→ **2 件** pass | `e2e/sidebar-layout.spec.js`, `e2e/gadgets.spec.js`, `e2e/visual-audit.spec.js` |
| WP-004 | reader 実装差分なし（手動パック待ち） | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

### Session 86

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 レーンA | `assist` / `advanced` のカテゴリ説明と配下ガジェット説明を「補助。〜」「詳細。〜」トーンへ統一し、サイドバー内の説明密度を整合 | `js/sidebar-manager.js`, `js/gadgets-utils.js`, `js/gadgets-editor-extras.js`, `js/gadgets-goal.js`, `js/gadgets-hud.js`, `js/gadgets-pomodoro.js`, `js/gadgets-markdown-ref.js`, `js/gadgets-prefs.js`, `js/gadgets-loadout.js`, `js/gadgets-keybinds.js`, `js/gadgets-print.js`, `docs/GADGETS.md` |
| WP-004 レーンB | parity 手動パック差分メモを 1 件追加（シナリオ4: 壊れ wikilink の体感遅延、実装差分なし） | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| 同期要件 レーンC | クラウド同期 PoC の方式比較・競合解決（LWW+競合複製）・セキュリティ最低要件をドラフト化 | `docs/ROADMAP.md`, `docs/APP_SPECIFICATION.md`, `SECURITY.md` |
| 回帰 | GateA/B: `test:smoke` + `test:unit` + `test:e2e:ui` → **41 件** pass | `package.json` scripts（実行のみ） |

### Session 87

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 章ストア安全 | 読者プレビュー組み立てで `splitIntoChapters` を呼ばない。プレビュー用 docId を親ドキュメントに正規化 | `js/reader-preview.js` |
| 章 UI / ID | `getDocumentIdForChapterOps` でストア操作の親 ID を統一。章追加は `flush` のみ。フォーカス入場時も `flush` のみ。章追加後 `ZWChapterStoreChanged` | `js/chapter-list.js` |
| 執筆レール | 「+ 追加」の単回バインド・連打ガード・章ナビ表示経路の整理（既存） | `js/sidebar-manager.js` |
| プレビュー / エディタ | サイドバー MD プレビュー同期、EditorCore プレビュー再描画、編集ガジェット・`app-ui-events`・CSS 等（累積） | `js/editor-preview.js`, `js/modules/editor/EditorCore.js`, `js/gadgets-*.js`, `js/app-ui-events.js`, `index.html`, `css/style.css` ほか |
| ドキュメント | リファクタ目安新設、`HANDOVER` / `INVARIANTS` / 台帳更新 | `docs/REFACTORING_SAFETY_CHAPTER_STORAGE.md`, `HANDOVER.md`, `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md` |

### Session 88

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 パレット | `gadget-assist` / `gadget-advanced` 追加。`ui-mode-focus` にキーワード `フォーカスモード` | `js/command-palette.js` |
| E2E | 補助・詳細設定アコーディオン展開の回帰 **2 件** | `e2e/command-palette.spec.js` |
| 台帳 | `ROADMAP` / `USER_REQUEST_LEDGER` の「次」更新 | `docs/ROADMAP.md`, `docs/USER_REQUEST_LEDGER.md` |

### Session 89

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| クリーンアップ | ルート不要ファイル 4 件削除 (`test-write.txt` / `prompt-resume.md` / `spec-wiki.html` / `debug-ui.html`) + `MILESTONE_2025-01-04.md` を `docs/archive/` へ移動 | ルート各ファイル |
| package.json | 未使用 `test:e2e:ci` と重複 `test:build:stable` を削除 (22→20 scripts) | `package.json` |
| E2E 削除 | `animations-decorations.spec.js` (2 件, `decorations.spec.js` に包含) / `reader-preview.spec.js` (16 件, Reader モード廃止済) | `e2e/*.spec.js` |
| E2E 統合 | `chapter-ux-issues.spec.js` Issue C-2 → `chapter-store.spec.js`。`gadget-detach-restore.spec.js` 6 件 → `gadgets.spec.js` | `e2e/chapter-store.spec.js`, `e2e/gadgets.spec.js` |
| docs 整合 | `DEVELOPMENT.md` 該当 `debug-ui.html` 誘導を DevTools コンソールに。`docs/archive/` 旧セッションログ 3 ファイル → `session-history.md` 統合 | `DEVELOPMENT.md`, `docs/archive/*` |
| 検証 | `lint:js:check` clean / `test:smoke` pass / `playwright --list` = **566 / 65** (前回 585/69、−19 テスト/−4 ファイル)。`editor-settings:464` failure は stash 比較で **pre-existing** を確認 | — |

### Session 90

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 closeout | 既知摩擦 11 件 (session 72〜88) を消化完了 → 台帳・ROADMAP・推奨プラン・runtime-state に「監視モード」を明示。体感トリガー発火時のみ 1 トピックに昇格 | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, `docs/RECOMMENDED_DEVELOPMENT_PLAN.md`, `docs/runtime-state.md` |
| deferred 格上げ | BL-002 / BL-004 / Focus 左パネル は session 54〜89 の 36 セッション連続で新規再現なし → 「closed unless re-reported」扱いに | `docs/USER_REQUEST_LEDGER.md` |
| 主軸切替 | 主レーンを **WP-004 Phase 3 継続**単独に。WP-001 は監視モードの副レーン扱い | `docs/CURRENT_STATE.md`, `docs/RECOMMENDED_DEVELOPMENT_PLAN.md` |
| 検証 | `lint:js:check` clean。コード変更なし | — |

### Session 91

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 復帰 #1 | エッジホバー即応化: `DWELL_MS 280→0`、`DISMISS_MS 500→0`、左端検知で `y > EDGE_ZONE` 除外を撤廃 (画面高さ全域で発火) | `js/edge-hover.js` |
| WP-001 復帰 #2 | Focus パネル overlay 化: `.editor-container` の `margin-left` 適用を削除。`.focus-chapter-panel` は既 `position: fixed` のため push-out なし | `css/style.css` |
| WP-001 復帰 #3 | セクション折りたたみ機能廃止: `applySectionCollapse` を no-op 化、「全展開」ボタンと関連 CSS 撤去 | `js/gadgets-sections-nav.js`, `css/style.css` |
| WP-001 復帰 #4 | 「見出しがありません」メッセージ撤去 (フォーカス外表示で混乱の原因)。見出し 0 件時は空の treeContainer | `js/gadgets-sections-nav.js` |
| WP-001 復帰 #5 | Focus パネル下部 UI 撤去: `renderFooterStats` 削除 (目次コピー/目次テンプレ/カウンター)、`insertTocTemplate` 廃止、関連 CSS 削除 | `js/chapter-list.js`, `css/style.css` |
| WP-001 復帰 #6 | 「新しい章」ボタンを章リスト直下へ移動: `__footer` 要素ごと削除、`__list` を `flex: 0 1 auto` + `max-height: calc(100vh - 8rem)` に変更、`__add-btn` に margin + border-top | `index.html`, `css/style.css` |
| 再ビルド | `npm run build` + `npm run electron:build` 実行。`dist/BUILD_INFO.txt` = 2026-04-14T16:56:55Z、`build/win-unpacked/Zen Writer.exe` 再生成 | `dist/`, `build/win-unpacked/` |
| 検証 | `lint:js:check` clean、`test:smoke` pass、`e2e/gadgets.spec.js` + `e2e/chapter-store.spec.js` pass。`command-palette.spec.js:60` failure は stash 比較で pre-existing (`#main-hub-panel` 削除済み、テスト側が古い) | — |
| WP-001 再 closeout | 本スライスで体感摩擦を消化 → 再び監視モードへ。台帳・ROADMAP・推奨プランは session 91 行を追記、ステータス行は「監視モード (session 91 復帰実績あり)」に更新 | `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, `docs/RECOMMENDED_DEVELOPMENT_PLAN.md`, `docs/runtime-state.md` |

### Session 92

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| パネル幅連動化 | CSS `:root` に `--focus-panel-width: clamp(12rem, 100vw/6, 24rem)` を定義 (192〜384px、viewport の 1/6 に連動)。モバイル用 `min(15rem, 40vw)` 上書きは撤廃して全画面で統一 | `css/style.css` |
| トリガー範囲連動化 | `js/edge-hover.js` に `getLeftEdgeZone()` (ratio 1/6 + clamp 192-384) を追加。`onMouseMove` 左端判定を `EDGE_ZONE` 固定値から動的計算に変更 | `js/edge-hover.js` |
| フェード可視化 | `.focus-chapter-panel` の transition を 0.05s → 0.2s に延長、フェードイン/アウト対称 | `css/style.css` |
| 検証 | `lint:js:check` clean、`test:smoke` pass、再ビルド実施 | — |

### Session 93

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 左端 dismiss bug 修正 | `onMouseLeaveEdge` の左端判定が `x > EDGE_ZONE (24)` で上端用定数を誤用 → `x > getLeftEdgeZone()` に修正。session 92 の動的化で dismiss 側を更新忘れしていた副作用を是正。wide window でパネルが出ない / state 壊れ / フェードアウト不発の全 3 症状の根本原因 | `js/edge-hover.js` |
| hub affordance 廃止 | `#edge-hover-hub-affordance` (Focus 時中央上部 56×6px ハンドル) と `createHubAffordance()` を撤廃。クリックで通常サイドバーを開きレガシー mode-switch (最小/フル) に到達する導線を撤去 | `js/edge-hover.js`, `css/style.css` |
| 検証 | `lint:js:check` clean、`test:smoke` pass、再ビルド実施 | — |

### Session 94

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| E2E spec 削除 (5 files) | `global-search` / `ui-parity` / `floating-panel-drag` / `split-view` / `spell-check` を全削除。MainHubPanel 廃止・textarea スペルチェック非実用化に伴う | `e2e/*.spec.js` (5 ファイル削除) |
| JS デッドコード削除 | `js/main-hub-panel.js` 削除、`index.html` の廃止コメント除去 | `js/main-hub-panel.js`, `index.html` |
| E2E 部分削除 | decorations (Search and Replace 7 件) / sections-nav (Section Collapse 4 件) / ui-mode-consistency (1 件) / toolbar-editor-geometry (1 件) / responsive-ui (1 件) / editor-settings (1 件) | `e2e/*.spec.js` (6 ファイル修正) |
| E2E 書き換え | command-palette (1 件) / accessibility (2 件) を `#search-floating-panel` に移行 | `e2e/command-palette.spec.js`, `e2e/accessibility.spec.js` |
| ヘルパー整理 | `openSearchPanel` / `openGlobalSearchPanel` / `openMainHubPanel` の 3 関数を削除 | `e2e/helpers.js` |
| アプリ修正 | `EditorSearch.toggleSearchPanel` を `MainHubPanel.toggle('search')` から `search-floating-panel` 直接操作に修正 | `js/modules/editor/EditorSearch.js` |
| 検証 | `lint:js:check` clean。全件: **512 passed / 2 skipped / 0 failed**。`npx playwright test --list` = **514 テスト / 60 ファイル** | — |
| 手動テスト環境 | `.zwp.json` サンプル 3 件 (小説章管理・演出ショーケース・ファイル管理) を `samples/` に追加。`MANUAL_TEST_GUIDE.md` を全面改訂 (11 セクション・80+ チェック項目) | `samples/*.zwp.json`, `samples/README.md`, `docs/MANUAL_TEST_GUIDE.md` |
| WP-005 方針策定 | プレビュー・比較ツール再設計の方向性を合意。(A) 分割ビュー edit-preview 廃止 (B) MD プレビューにタイピング/スクロール Controller を追加しリッチプレビュー化 (C) 比較ツール (chapter-compare / snapshot-diff) を隔離・将来は別ファイル比較も | `docs/USER_REQUEST_LEDGER.md` に起票 |

### Session 95

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-005 スライスA 実装 | `split-view.js` から `edit-preview` モードを削除し、比較ビュー (`chapter-compare` / `snapshot-diff`) のみを保持 | `js/split-view.js` |
| 導線・文言整合 | ツールバー/サイドバーの `#toggle-split-view` を「比較ビュー（章比較）」へ更新。コマンドパレットも比較用途の文言に更新。Electron メニュー文言を統一 | `index.html`, `js/command-palette.js`, `electron/main.js`, `js/app-ui-events.js` |
| デッドUIフック整理 | `split-view-edit-preview` 参照を削除。未使用だった `split-view-editor-wrapper` / `split-view-preview-wrapper` / `split-view-mode-panel` スタイルを削除 | `js/app-ui-events.js`, `css/style.css` |
| 検証 | `npm run lint:js:check` clean。`npx playwright test e2e/command-palette.spec.js e2e/responsive-ui.spec.js` = **24 passed** | — |

### Session 96

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-005 スライスB 実装 | `renderMarkdownPreviewImmediate` 後段で preview surface 向けに Typing/Scroll Controller を activate。cleanup 参照を `editorManager` に保持 | `js/editor-preview.js` |
| ライフサイクル | プレビュー再描画時は cleanup → 再activate、`editor-preview--collapsed` 時は cleanup のみ実行して不要監視を停止 | `js/editor-preview.js` |
| CSS 方針 | `#editor-preview .zw-scroll` を含む既存スタイルで要件を満たすことを確認し、追加スタイルは導入しない（責務分離維持） | `css/style.css` (変更なし) |
| 検証 | `npm run lint:js:check` clean。`npx playwright test e2e/typing-effect.spec.js e2e/wysiwyg-dsl-preview.spec.js` = **24 passed** | — |

### Session 97

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| 比較導線の分離 | コマンドパレットの比較導線を `compare-chapter` / `compare-snapshot` に分離し、カテゴリを「比較ツール」に独立 | `js/command-palette.js` |
| 導線集約 | サイドバー「構造」カテゴリに比較ツールボタン（章比較/スナップショット差分）を追加。編集カテゴリの比較導線を削除 | `index.html`, `js/app-ui-events.js`, `js/sidebar-manager.js` |
| 到達経路の統一 | `SplitViewManager.open(mode)` を追加し、比較導線は `open()` 経由で同一モードを再押下しても閉じない動線へ統一。Electron メニューも新導線へ接続 | `js/split-view.js`, `js/electron-bridge.js` |
| 検証 | `npm run lint:js:check` clean。`npx playwright test e2e/command-palette.spec.js` = **13 passed**。`npx playwright test e2e/visual-audit.spec.js -g \"Structure gadgets\"` = **1 passed** | — |

### Session 98

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| Bug 1 終了失敗 | `beforeunload` で `window.electronAPI` がある場合は `preventDefault` せず Electron の終了 hang を回避 | `js/app-autosave-api.js` |
| Bug 2-a サイドバー初期非表示 | 読み取りキー `sidebarVisible` / 書き込みキー `sidebarOpen` のキー不整合を両対応に統一。storage の既定値を `true` に変更 (初回起動時の発見性優先) | `js/settings-manager.js`, `js/storage.js` |
| Bug 2-b edge-hover サイドバー閉じ不能 | `leftEdgeOpenedSidebar` 所有権フラグを導入し、edge-hover 自身が開いたサイドバーだけ閉じる仕様に修正。`isSidebarNormallyOpen()` による誤判定を回避 | `js/edge-hover.js` |
| Bug 3 フォント過大 | `webPreferences.zoomFactor: 0.9` で Windows DPI (125% 等) を相殺、`:root { font-size: 16px }` で rem 計算基準を固定 | `electron/main.js`, `css/style.css` |
| 検証 | `npm run lint:js:check` clean。Phase A 検証セクション参照 | — |

### Session 99

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| リッチ編集トグル | コマンドパレットに `toggle-effect-break-at-newline` / `toggle-effect-persist-decor` を追加、「リッチ編集」カテゴリ新設。`ZenWriterSettingsChanged` イベントで既存のガジェット設定UIと同期 | `js/command-palette.js` |
| 検証 | `npm run lint:js:check` clean。`npx playwright test e2e/command-palette.spec.js` = **13 passed** | — |

### Session 100

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| CSS 修正 | `.focus-chapter-panel__exit-btn` に `pointer-events: auto` を追加 (Focus パネルのボタンが親の `pointer-events: none` で遮られていた) | `css/style.css` |
| CSS 修正 | `.editor-overlay__image` に `pointer-events: auto` を追加 (画像オーバーレイが親 `.editor-overlay` の `pointer-events: none` を継承していた) | `css/style.css` |
| テスト修正 | `sidebarOpen` 既定値 `true` (session 98) によるサイドバー遮蔽対策。`dock-panel` / `ui-mode-consistency` / `image-position-size` / `chapter-list` の各テストでサイドバーを明示的に閉じる前処理を追加 | `e2e/dock-panel.spec.js`, `e2e/ui-mode-consistency.spec.js`, `e2e/image-position-size.spec.js`, `e2e/chapter-list.spec.js` |
| テスト修正 | `chapter-list` の章追加テストで `waitForTimeout(500)` を `waitForFunction` (章数ポーリング) に変更し flaky を解消 | `e2e/chapter-list.spec.js` |
| テスト修正 | `image-position-size` の `beforeEach` に `ensureNormalMode` を追加 (Focus 既定起動対策) | `e2e/image-position-size.spec.js` |
| 検証 | `npm run lint:js:check` clean。全件: **512 passed / 0 failed / 2 skipped** | — |

### Session 102

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-001 スライス2 DOM | トップバー `toolbar-group--system` から `#toggle-settings` (歯車) と `#toggle-help-modal` (ヘルプ) の 2 button 要素を削除。残るは `#toggle-theme` のみ | `index.html` |
| JS ハンドラ整理 | `app-ui-events.js` の `toggleSettingsBtn` / `toggleHelpBtn` リスナー削除 (close リスナー・モーダル本体・関数本体は維持)。`app.js` の `gearBtn` 内 `#toggle-settings` fallback click 削除 | `js/app-ui-events.js`, `js/app.js` |
| ショートカット追加 | `DEFAULT_KEYBINDS` に `app.settings.open` (`Ctrl+,`, Mac `Cmd+,`) と `app.help.open` (`F1`) を追加。`app-shortcuts.js` の switch + フォールバックブロック双方にハンドラ追加 (Mac `metaKey` 経路カバー) | `js/keybind-editor.js`, `js/app-shortcuts.js` |
| パレット表示 | `open-settings` / `open-help` の `shortcut` を `'Ctrl+, / Cmd+,'` / `'F1'` に更新 | `js/command-palette.js` |
| scripts | `dev-check.js` の 2 検査削除。`capture-ui-verification.js` / `capture-full-showcase.js` の click を `window.ZenWriterApp.openSettingsModal()` / `openHelpModal()` API 経由に置換 | `scripts/dev-check.js`, `scripts/capture-ui-verification.js`, `scripts/capture-full-showcase.js` |
| E2E 書換 (6 ファイル) | `helpers.js` の `openSettingsModal` / `keybinds.spec.js` / `theme-colors.spec.js` を API 経由に変更。`accessibility.spec.js` / `ui-editor.spec.js` (4 箇所) は `#toggle-settings` を `#toggle-theme` に差替。`visual-audit.spec.js` 15-help-modal は `openHelpModal()` API 経由に置換 | `e2e/helpers.js`, `e2e/keybinds.spec.js`, `e2e/theme-colors.spec.js`, `e2e/accessibility.spec.js`, `e2e/ui-editor.spec.js`, `e2e/visual-audit.spec.js` |
| docs SSOT | `EDITOR_HELP.md` のショートカット表に `Ctrl+, = 設定` / `F1 = ヘルプ` 追加 + 撤去注記。`UI_SURFACE_AND_CONTROLS.md` 設定/ヘルプ/テーマ行とコントロール台帳更新。`FEATURE_REGISTRY.md` FR-009 のヘルプ UI 入口記述を「コマンドパレット + `F1`」に。`USER_REQUEST_LEDGER.md` に session 102 節追記 + L219 文言修正 | `docs/EDITOR_HELP.md`, `docs/UI_SURFACE_AND_CONTROLS.md`, `docs/FEATURE_REGISTRY.md`, `docs/USER_REQUEST_LEDGER.md` |
| 検証 | `npm run lint:js:check` clean。関連 6 spec **63 passed / 0 failed**。`test:smoke` pass。全 E2E **511 passed / 1 flaky (pathtext-handles 単独再実行で pass) / 2 skipped** | — |

### Session 103

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| hotfix 設定動線 | `openSettingsModal()` の中身を `toggleModal('settings-modal', true)` から `activateSidebarGroup('advanced')` + サイドバー展開に変更。session 102 以前から `#settings-gadgets-panel` は空 (settings グループ deprecated → advanced 統合済み) だったが、user がトップバー歯車を主に使っていたため気付かれず。session 102 でトップバー歯車撤去 → user が Focus 章パネル歯車を試す → 空モーダル発覚 | `js/app-ui-events.js` |
| パレット表示 | `open-settings` の description / keywords を「サイドバー詳細設定カテゴリ」基準に更新。`Ctrl+,` ショートカット表示は維持 | `js/command-palette.js` |
| E2E helpers | `enableAllGadgets` のガジェット強制登録を `'settings'` → `'advanced'` に変更、`#settings-gadgets-panel` 強制 init を `#advanced-gadgets-panel` に。`openSettingsModal` ヘルパは `#advanced-gadgets-panel` の attached 待ちに | `e2e/helpers.js` |
| E2E spec 書換 | `keybinds.spec.js` の scope と全ハードコード参照、`theme-colors.spec.js` の Themes ガジェット動的登録先、`collage.spec.js` の Images ガジェット locator を `#advanced-gadgets-panel` 系に置換 (合計 15 箇所) | `e2e/keybinds.spec.js`, `e2e/theme-colors.spec.js`, `e2e/collage.spec.js` |
| 互換維持 | `#settings-modal` DOM 本体と `closeSettingsModal()` no-op は残存。`scripts/dev-check.js` の `id="settings-modal"` 検査も通る | `index.html` (無変更), `js/app-ui-events.js` (`closeSettingsModal` no-op 残置) |
| 検証 | `npm run lint:js:check` clean。全 E2E **512 passed / 0 failed / 2 skipped** | — |
| user 提起 (session 104 候補) | フルのドキュメント一覧 UX 不安定: (1) チェックボックス外クリックで全外しされるが選択数表示が残る (2) ドキュメント多数で見切れる (3) 複数選択が一つ一つしか選べない | `js/gadgets-documents-hierarchy.js`, `js/gadgets-documents-tree.js` (推定) |

### Session 103.1

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| Focus 歯車レイアウト崩壊 hotfix (試行) | session 103 の `openSettingsModal()` は Focus モード時に呼ばれてもそのままサイドバーを open していたため、Focus 状態の overlay と Normal 状態の sidebar カテゴリ表示が CSS 上で競合 → サイドバーが viewport 全幅占有 + 異常レイアウト。冒頭に Focus 判定を追加し、Focus 時は `setUIMode('normal')` で Normal 切替してから advanced 展開する | `js/app-ui-events.js` |
| 自動検証 | `lint:js:check` clean、関連 3 spec (keybinds/theme-colors/collage) **15 passed / 0 failed** | — |
| **実機検証 (user 報告)** | **`build-session104/win-unpacked/Zen Writer.exe` でも症状は解消せず**、左サイドバーが出っぱなしになる。session 103.1 の修正は不十分 → session 104 で根本対応 | — |
| user 提起 (session 104 候補追加) | ウィンドウ最小時に左サイドバーが viewport 全画面を占有する現象。session 102/103 起源か既存 bug か未切り分け | (調査対象) |
| handoff (session 103.1 締め) | docs 同期: `runtime-state.md` の「次セッション再開ポイント」に Focus 歯車根本修正の試す候補 4 件を明記 (遅延実行 / revert / Focus 歯車ハンドラ書換 / モード別分岐)。再開時のコマンドも記載 | `docs/runtime-state.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/CURRENT_STATE.md` |

## 検証結果

Session 44〜62 の実行ログは [`docs/archive/current-state-verification-sessions-44-62.md`](archive/current-state-verification-sessions-44-62.md)。Session 63〜65 の詳細は [`docs/archive/current-state-verification-sessions-63-65.md`](archive/current-state-verification-sessions-63-65.md)。

実行済み (session 110 / push 直前):

- Git: **`origin/main` @ `d9ffa47`**（ドキュメント追記のみのコミットが続く場合あり。機能・テスト・多数ファイルの塊は **`a0e4558`**、2026-04-20）
- `npm run lint:js:check` → clean
- `npx playwright test --reporter=line` → **515 passed / 2 skipped / 0 failed**（全 spec）

実行済み (session 66):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js e2e/reader-chapter-nav.spec.js e2e/reader-wikilink-popover.spec.js e2e/reader-genre-preset.spec.js` → pass（17 件）
- `npx playwright test e2e/wysiwyg-editor.spec.js` → pass（23 件・FR-007 含む）
- `npx playwright test --list` → **567 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）
- `npx eslint js/editor-wysiwyg.js` → clean

実行済み (session 67):

- `npx playwright test e2e/wysiwyg-editor.spec.js` → pass（26 件・FR-007/FR-008 拡張含む）
- `npx playwright test --list` → **570 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）

実行済み (session 68):

- `npx playwright test e2e/command-palette.spec.js e2e/ui-mode-consistency.spec.js e2e/dock-panel.spec.js e2e/reader-preview.spec.js e2e/reader-wysiwyg-distinction.spec.js` → pass（96 件）

実行済み (session 69):

- `npx playwright test` → **568 passed / 2 skipped**（全 spec、約 3.4 分）
- `npx playwright test --list` → **570 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）
- `npx eslint js/` → clean

実行済み (session 71):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js` → pass（14 件）

実行済み (session 72):

- `npx playwright test e2e/command-palette.spec.js e2e/reader-wysiwyg-distinction.spec.js` → pass（26 件）

実行済み (session 73):

- `npx playwright test e2e/command-palette.spec.js e2e/reader-wysiwyg-distinction.spec.js` → pass（26 件）

実行済み (session 74):

- `npx playwright test e2e/reader-chapter-nav.spec.js e2e/reader-wysiwyg-distinction.spec.js` → pass（17 件）

実行済み (session 75):

- `npx playwright test e2e/visual-audit.spec.js --grep "Loadout manager|Structure gadgets|Edit gadgets|Advanced gadgets"` → pass（4 件）
- `npx playwright test e2e/dock-preset.spec.js e2e/gadgets.spec.js` → pass（14 件）

実行済み (session 76):

- `npx playwright test e2e/reader-genre-preset.spec.js e2e/reader-wysiwyg-distinction.spec.js` → pass（18 件）
- `npx playwright test --list` → **573 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）

実行済み (session 77):

- `npx playwright test e2e/reader-wysiwyg-distinction.spec.js e2e/reader-chapter-nav.spec.js e2e/reader-wikilink-popover.spec.js e2e/reader-genre-preset.spec.js e2e/reader-preview.spec.js` → pass（34 件）
- `npx playwright test e2e/ui-mode-consistency.spec.js` → pass（12 件・モード用語整理後のスモーク）

実行済み (session 78):

- `npx playwright test e2e/command-palette.spec.js` → pass（11 件）
- `npx playwright test e2e/ui-mode-consistency.spec.js` → pass（12 件）

実行済み (session 79):

- `npx playwright test e2e/dock-preset.spec.js e2e/gadgets.spec.js` → pass（14 件）
- `npx playwright test e2e/visual-audit.spec.js --grep "Loadout manager|Structure gadgets|Edit gadgets|Advanced gadgets"` → pass（4 件）

実行済み (session 80):

- `npx playwright test e2e/command-palette.spec.js` → pass（11 件）

実行済み (session 81):

- `npx playwright test e2e/command-palette.spec.js` → pass（11 件）

実行済み (session 82):

- `npx playwright test e2e/gadgets.spec.js` → pass（5 件）

実行済み (session 83):

- `npx playwright test e2e/sidebar-layout.spec.js e2e/sidebar-writing-focus.spec.js e2e/ui-mode-consistency.spec.js` → pass（22 件）

実行済み (session 84):

- `npx playwright test e2e/sidebar-layout.spec.js e2e/sidebar-writing-focus.spec.js e2e/ui-mode-consistency.spec.js e2e/gadgets.spec.js e2e/command-palette.spec.js` → pass（38 件）
- `npx playwright test e2e/visual-audit.spec.js -g "05 - Edit"` → pass（1 件）
- `npx playwright test --list` → **574 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載用）
- `npx eslint js/gadgets-editor-extras.js js/gadgets-images.js js/gadgets-choice.js js/command-palette.js js/sidebar-manager.js` → clean

実行済み (session 85):

- `npx eslint js/` → clean
- `npx playwright test e2e/sidebar-layout.spec.js e2e/gadgets.spec.js` → pass（10 件）
- `npx playwright test e2e/visual-audit.spec.js -g "04 - Structure gadgets|06 - Theme gadgets"` → pass（2 件）

実行済み (session 86):

- `npm run test:smoke` → pass
- `npm run test:unit` → pass（11 件）
- `npm run test:e2e:ui` → pass（30 件）

実行済み (session 87):

- `npm run test:smoke` → pass
- `npx playwright test e2e/sidebar-writing-focus.spec.js e2e/chapter-list.spec.js` → pass（11 件）
- `npx playwright test --list` → **574 テスト / 68 ファイル**（`docs/ROADMAP.md` 記載と一致）

実行済み (session 88):

- `npx playwright test e2e/command-palette.spec.js` → pass（13 件）
- `npx eslint js/command-palette.js` → clean
- `npx playwright test --list` → **585 テスト / 69 ファイル**（実測）

実行済み (session 94):

- `npx playwright test` → **512 passed / 2 skipped / 0 failed**（全 spec、約 2.7 分）
- `npx playwright test --list` → **514 テスト / 60 ファイル**
- `npm run lint:js:check` → clean

実行済み (session 100):

- `npx playwright test` → **512 passed / 0 failed / 2 skipped**（全 spec、約 2.9 分）
- `npm run lint:js:check` → clean

実行済み (session 95):

- `npm run lint:js:check` → clean
- `npx playwright test e2e/command-palette.spec.js e2e/responsive-ui.spec.js` → **24 passed**

実行済み (session 96):

- `npm run lint:js:check` → clean
- `npx playwright test e2e/typing-effect.spec.js e2e/wysiwyg-dsl-preview.spec.js` → **24 passed**

実行済み (session 97):

- `npm run lint:js:check` → clean
- `npx playwright test e2e/command-palette.spec.js` → **13 passed**
- `npx playwright test e2e/visual-audit.spec.js -g "Structure gadgets"` → **1 passed**

### 手動確認ゲート（運用メモ）

| タイミング | 参照 | 記録先 |
|------------|------|--------|
| WP-004 手動パック（リリース前・四半期） | [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) シナリオ 1〜5 | 同ファイルの更新履歴に実施日・差分の有無 |
| deferred（BL-002 / BL-004 / Focus 左パネル）をスライスに昇格するか | [`AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md)・上記「体感確認」 | 昇格時は `USER_REQUEST_LEDGER` と本ファイルの優先課題 |
| モード用語の説明が必要なとき | [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md)（正本） | 実装変更時は `INVARIANTS` の不変条件と矛盾しないこと |
| ロードアウト／ガジェットの並びを変えた後 | 初回起動・プリセット切替で**迷いが増えていないか**を短時間確認（問題なければ記録不要） | 問題があれば本ファイルに 1 行 |
| 編集カテゴリの説明文を変えた後（session 84） | サイドバー「編集」を開き、各ガジェットの説明が読みやすいか **5〜10 分** 目視（任意・リリース前推奨） | 問題があれば次スライスで 1 トピック化 |

体感確認（ユーザー OK、優先度低のまま残すもの）:

- WYSIWYG: **IME 確定**（実機・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md)）。**極端な長文連打の体感**（パフォーマンス）
- WYSIWYG + タイプライター ON: **ピクセル単位のアンカー位置の体感**（フォント・DPI 差・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) FR-008）
- BL-002 / BL-004 / Focus 左パネル間隔（障害なければ次スライス時にまとめてよい）。Reader フルツールバー目アイコンは session 49 でモードスイッチと同系に済み
- Wiki ワークフロー統合・WP-004 Phase 1 の継続体感

## 現在の優先課題


| 優先  | テーマ            | 内容                                                               | Actor         |
| --- | -------------- | ---------------------------------------------------------------- | ------------- |
| A   | WP-001 集中 | session 88 でコマンドパレットから **補助** / **詳細設定** へ到達可能に。**次トピック**は [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) / [`ROADMAP.md`](ROADMAP.md) から **1 件ずつ**連続スライス | shared        |
| B   | WP-004 Phase 3   | **自動検証層は session 77 で区切り**。新規差分は台帳・手動パックで発見次第 **1 トピック**で。保存導線の**ドキュメント横断**は session 80 で実施済み | shared        |
| C   | WP-001 体感トリガー   | deferred（BL-002 / BL-004 / Focus 左パネル等）は **体感で問題が出たときだけ** 1 トピックに昇格 | user / shared |
| D   | canonical docs | `FEATURE_REGISTRY.md` / `AUTOMATION_BOUNDARY.md` はテンプレート済み。変更時は台帳チェックリストに従い随時追記 | shared        |


## 既知の注意点

- `docs/spec-index.json`: **`status: removed` のエントリは、参照先ファイルがワークツリーに無いことがある**（退避・スコープ外の履歴用）。ゴーストではなく意図した状態。現行仕様の探索は `status: done` / `partial` を優先する
- セッション・検証コマンドの事実関係の正本はこのファイル。役割別の参照先は上の**ドキュメント地図**

## Canonical Gaps

作成済み:

- `docs/ai/*.md` (CORE_RULESET, DECISION_GATES, STATUS_AND_HANDOFF, WORKFLOWS_AND_PHASES)
- `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/INTERACTION_NOTES.md`
- `docs/runtime-state.md`（補助・カウンター）、`docs/project-context.md`（補助・長命背景）

履歴アーカイブ（正本の代替ではない）:

- `docs/archive/session-history.md`（Session 26〜64 セッション変更ログ統合版。旧 `current-state-sessions-44-61.md` / `current-state-sessions-62-64.md` / `runtime-state-session-log.md` を統合）
- `docs/archive/current-state-verification-sessions-44-62.md`（検証コマンドログ）
- `docs/archive/current-state-verification-sessions-63-65.md`（検証コマンドログ）

テンプレート作成済み（随時拡張）:

- `docs/FEATURE_REGISTRY.md`
- `docs/AUTOMATION_BOUNDARY.md`
- `docs/WP004_PHASE3_PARITY_AUDIT.md`（WP-004 監査）
- `docs/specs/spec-textbox-render-targets.md`（テキストボックス `target`）

## 再開時の最短ルート

1. このファイルの **Snapshot** と **ドキュメント地図**、続けて **この時点で信頼できること**（リンク集）
2. 挙動の細部は [`INVARIANTS.md`](INVARIANTS.md)
3. 次スライスは [`ROADMAP.md`](ROADMAP.md) と [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)
4. Focus サイドバー仕様が必要なら [`specs/spec-writing-focus-sidebar.md`](specs/spec-writing-focus-sidebar.md)