# Current State

最終更新: 2026-04-02 (session 40)

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 40 |
| 現在の主軸 | WP-001 UI/UX の磨き上げ・摩擦軽減 |
| 直近のスライス | WYSIWYG TB最適化 + 装飾グループ/Canvas Mode削除 |

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

## Session 40 の変更

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WYSIWYG TB 最適化 | 13→11ボタン。縦書き/テキストエディタ切替をオーバーフローメニューに移動 | `index.html`, `js/editor-wysiwyg.js`, `e2e/helpers.js` + 6 テストファイル |
| 装飾グループ完全削除 | toolbar-group--decorate (2ボタン) を HTML/JS/E2E から削除 | `index.html`, `js/editor.js`, `js/modules/editor/EditorUI.js`, `js/tools-registry.js` |
| Canvas Mode 完全削除 | toggle-canvas-mode ボタンを HTML/JS/CSS/E2E から削除 | `index.html`, `js/editor.js`, `css/style.css`, `e2e/editor-canvas-mode.spec.js` |
| E2E テスト整理 | ボタン前提テスト 13件削除、Canvas Mode テスト skip 化 | -355行 |

## 検証結果

実行済み (session 40):

- `npx playwright test --reporter=line --workers=2` → 528 passed / 0 failed / 5 skipped

未実施:

- Electron 実機でのメニュー経由確認
- Reader ボタンのスタイル一貫性 (手動確認 deferred)
- Focus 左パネル間隔の体感確認 (手動確認 deferred)

## 現在の優先課題

| 優先 | テーマ | 内容 | Actor |
| ---- | ------ | ---- | ----- |
| A | WP-001 次スライス | Focus 体感向上 / 別の UX 摩擦 | user (方向判断) |
| B | canonical docs 補完 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` 作成 | shared |
| B | 手動確認 deferred | Reader ボタン / Focus 左パネル間隔 | user |

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
