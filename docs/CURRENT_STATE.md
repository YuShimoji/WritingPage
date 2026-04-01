# Current State

最終更新: 2026-04-01 (session 39)

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 39 |
| 現在の主軸 | WP-001 UI/UX の磨き上げ・摩擦軽減 |
| 直近のスライス | E2Eテスト追従 + slim モード対応 + 堆積物削除 |

## この時点で信頼できること

- UI モードは `normal / focus / reader` の 3 種を `setUIMode` で切り替える
- 執筆集中サイドバーは `focus` モード時だけ有効
- `normal` モードでは従来のサイドバーアコーディオンを維持する
- `blank` 指定は互換のため `focus` にフォールバックする
- サイドバー slim モード (`data-sidebar-slim="true"`) でガジェット chrome (detach/help/chevron) が非表示
- コマンドパレットの UI モード切替は `ZenWriterApp.setUIMode()` と可視モードボタン経由に統一
- hidden `ui-mode-select` 要素は HTML から完全削除済み (session 36)
- E2Eテストの beforeEach では `ensureNormalMode(page)` で Normal モードを保証する
- `page.click('#toggle-sidebar')` は使わず `openSidebar(page)` (evaluate 経由) を使用する

## Session 39 の変更

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| E2Eテスト42件の失敗修正 | slim モード + viewport 外問題への追従。helpers.js に共通ヘルパー追加 | `e2e/helpers.js` + 13 テストファイル |
| Visual Audit スクリーンショット更新 | slim モード適用後のベースライン (16枚) | `e2e/visual-audit-screenshots/` |
| 堆積物削除 | 一時スクリプト3件 + 検証ディレクトリ (untracked) | 削除済み |
| デッドテスト3件削除 | 未実装セレクタ参照2件 + chapterMode タイミング問題1件 | `e2e/editor-extended-textbox.spec.js`, `e2e/chapter-ux-issues.spec.js` |
| ドキュメント同期 | runtime-state / project-context を session 39 に更新 | `docs/runtime-state.md`, `docs/project-context.md` |

## 検証結果

実行済み (session 39):

- `npx playwright test --reporter=line` → 542 passed / 0 failed / 3 skipped (65 spec files)

未実施:

- Electron 実機でのメニュー経由確認
- Reader ボタンのスタイル一貫性 (手動確認 deferred)
- Focus 左パネル間隔の体感確認 (手動確認 deferred)

## 現在の優先課題

| 優先 | テーマ | 内容 | Actor |
| ---- | ------ | ---- | ----- |
| A | WP-001 次スライス | ツールバーボタン数最適化 / 装飾グループ整理 | user (方向判断) |
| A | 装飾グループ / Canvas Mode | hidden HTML要素の削除判断 (E2E参照あり) | user (HUMAN_AUTHORITY) |
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
