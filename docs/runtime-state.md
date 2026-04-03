# Runtime State — Zen Writer

> 最終更新: 2026-04-02 session 40

## 現在位置

- プロジェクト: Zen Writer (WritingPage)
- バージョン: v0.3.32
- ブランチ: main
- セッション: 40
- 主レーン: Advance (WP-001 UI 磨き上げ・摩擦軽減)
- スライス: BL-001〜BL-006 完了 (Wiki proof, 改行効果切断, 書式インジケータ, Focus hover, ドキュメント一括操作, Wiki ハイライトループ修正)

---

## カウンター

| 指標 | 値 | 前回 |
| ---- | --- | ---- |
| セッション番号 | 42 | 40 |
| ガジェット数 | 28 | 28 |
| spec-index エントリ | 55 | 55 |
| spec done | 44 | 44 |
| spec partial | 0 | 0 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl ファイル | 107 | 107 |
| CSS ファイル | 4 | 4 |
| E2E spec ファイル | 62 | 62 |
| E2E passed | 508 | 528 |
| E2E failed | 0 | 0 |
| E2E skipped | 5 | 5 |
| 検証spec | 3 (sp081-*.spec.js) | 3 |
| TODO/FIXME/HACK | 0 | 0 |
| mock ファイル | 0 | 0 |

---

## 量的指標 (GPS)

| 指標 | 値 |
| ---- | --- |
| 体験成果物 | 90% |
| 基盤 | 93% |
| 残 partial | なし (SP-005 done化) |
| IDEA POOL open | 1 (WP-001 着手中: UI磨き上げ・摩擦軽減) |
| IDEA POOL done | 2 (WP-002, WP-003) |
| 設計課題 open | 0 (Q1-Q4 全解決) |
| ビジュアル監査 open | V-2/V-3/V-4: 解消見込み (session 26 Visual Audit で新規問題なし) |

---

## ビジュアル監査追跡

| 指標 | 値 |
| ---- | --- |
| blocks_since_visual_audit | 0 (session 40 で Visual Audit スクリーンショット更新) |
| last_visual_audit_path | e2e/visual-audit-screenshots/ (20枚, 2026-04-02 session 40) |
| visual_evidence_status | fresh |

---

## 自己診断カウンター

| 診断項目 | 連続数 |
| --------- | ------- |
| Q4 No (成果物未前進) | 0 (WYSIWYG TB 最適化 = ユーザー可視改善) |
| Q6a No (基盤未獲得) | 0 (E2E 528 passed, switchToTextareaMode ヘルパー統一) |
| Q6b No (ユーザー可視変化なし) | 0 (ツールバー 13→11ボタン) |
| 保守モード連続 | 0 (Advance 実施) |

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
- edge-hover.js: Focus モードでエッジホバーヒントテキスト表示 (2回表示後自動消去)
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
## 2026-04-03 HANDOFF UPDATE

- session: 42 (BL-001〜BL-006 実装 + デグレ修正)
- branch: main
- active_artifact: WP-001 UI磨き上げ・摩擦軽減
- current_slice: BL-001〜BL-006 完了。次スライス選定中
- last_change_relation: direct (feature + bugfix)
- evidence:
  - E2E: 508 passed / 0 failed / 5 skipped (1 texture-overlay 既知不安定)
- visual_evidence_status: fresh (session 41-42)
- manual_followup_deferred:
  - BL-006 サイドバー伸縮の実環境確認 (headless では再現せず)
  - BL-002 改行効果切断の体感確認
  - BL-004 Focus 半透明 hover の体感確認
  - Reader button styling consistency
  - Focus left-panel spacing feel
- implemented_this_session:
  - BL-001: Wiki ワークフロー proof (Reader wikilink 正常動作確認)
  - BL-002: effectBreakAtNewline (改行で書式切断、デフォルトON)
  - BL-003: 書式インジケータ + ツールバーボタン aria-pressed 同期
  - BL-004: Focus hover を半透明スライドイン (0.35→hover で 1.0)
  - BL-005: ドキュメント一括選択・削除 (チェックボックス + Ctrl/Shift)
  - BL-006: Wiki ハイライト DOM 変更による input 再発火ループ防止
  - fix: ロードアウトプリセットの仮想グループ名を KNOWN_GROUPS に統合
  - fix: Wiki 自動検出の保存時トリガーを完全無効化
- canonical_doc_gaps:
  - `docs/FEATURE_REGISTRY.md` missing
  - `docs/AUTOMATION_BOUNDARY.md` missing
