# Current State

最終更新: 2026-04-05 (session 43)

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 43 |
| 現在の主軸 | WP-001 UI/UX の磨き上げ・摩擦軽減 |
| 直近のスライス | E2E修正 + BL-006修正 + デッドコード削除 + Canvas Mode完全削除 |

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

## Session 43 の変更

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| E2E 6件修正 | wiki autoDetect / Wiki パネルセレクタ / HeadingStyles enableAllGadgets | `e2e/wiki.spec.js`, `e2e/editor-settings.spec.js`, `e2e/heading-typography.spec.js` |
| BL-006 修正 | Normal モードでのサイドバーアコーディオン伸縮防止 | `js/sidebar-manager.js` |
| return-bar 削除 | showReturnToReaderBar 一式 (JS/CSS/E2E) | `js/reader-preview.js`, `js/app.js`, `css/style.css`, `e2e/reader-preview.spec.js` |
| Canvas 完全削除 | CanvasViewportController + editor.js メソッド + CSS + storage設定 + HTML DOM | `js/modules/editor/CanvasViewportController.js` (削除), `js/editor.js`, `js/storage.js`, `index.html`, `css/style.css`, `e2e/editor-canvas-mode.spec.js` (削除) |
| HeadingStyles 登録 | 4プリセットの theme グループに追加 | `js/loadouts-presets.js`, `js/gadgets-utils.js` |
| 堆積物削除 | WORKER_TASKS.md, feature-reference.html, docs/issues/ アーカイブ | -496行 |

## 検証結果

実行済み (session 43):

- `npx playwright test --reporter=line --workers=2` → 528 passed / 0 failed / 3 skipped
- `npx eslint js/ --max-warnings=0` → clean

未実施:

- BL-002 改行効果切断 / BL-004 Focus hover の体感確認 (手動確認 deferred)
- Reader ボタンのスタイル一貫性 (手動確認 deferred)
- Focus 左パネル間隔の体感確認 (手動確認 deferred)

## 現在の優先課題

| 優先 | テーマ | 内容 | Actor |
| ---- | ------ | ---- | ----- |
| A | WP-001 次スライス | ユーザー要望に基づく次の改善 | user (方向判断) |
| B | canonical docs 補完 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` 作成 | shared |
| B | 手動確認 deferred | BL-002/BL-004/Reader/Focus 体感確認 | user |

## 既知の注意点

- `docs/spec-index.json` には、現ワークツリーにファイルが存在しない historical entry も含まれる
- 現在地の正本はこのファイルと `docs/runtime-state.md`, `docs/project-context.md` を優先する
- slim モード (`data-sidebar-slim`) はアプリ起動時に常時設定される。テスト時は `enableAllGadgets` / `disableWritingFocus` で解除する

## Canonical Gaps

作成済み:

- `docs/ai/*.md` (CORE_RULESET, DECISION_GATES, STATUS_AND_HANDOFF, WORKFLOWS_AND_PHASES)
- `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/INTERACTION_NOTES.md`
- `docs/runtime-state.md`, `docs/project-context.md`

未作成:

- `docs/FEATURE_REGISTRY.md`
- `docs/AUTOMATION_BOUNDARY.md`

## 再開時の最短ルート

1. `docs/CURRENT_STATE.md` を読む (このファイル)
2. `docs/runtime-state.md` で session 詳細とカウンターを確認する
3. `docs/project-context.md` で HANDOFF SNAPSHOT と IDEA POOL を確認する
4. 今回の UI/状態管理の文脈が必要なら `docs/specs/spec-writing-focus-sidebar.md` を読む
