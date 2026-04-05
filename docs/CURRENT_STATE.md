# Current State

最終更新: 2026-04-06 (session 44)

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 44 |
| 現在の主軸 | WP-001 UI/UX 磨き上げ + WP-004 Reader-First WYSIWYG |
| 直近のスライス | Wiki-Editor-Reader ワークフロー統合 + グローフラッシュ + WP-004 Phase 1 |

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

### 未コミット (体感確認待ち)

| 項目 | 変更内容 | 影響ファイル | 経緯 |
| ---- | -------- | ----------- | ---- |
| グロー制御 CSS クラス方式 | style.opacity 毎フレーム書換を全廃。CSSクラス (--near/--flash) + transition に一本化 | `js/edge-hover.js` | ベースライン/検知範囲/クールダウン等の反復修正が不安定な体験を生んだため、根本から刷新 |
| グロー近接検知 | 上部・左部とも 200px に統一。2段階 (near/not) でクラス切替 | `js/edge-hover.js` | 旧: 上120px/左80px の非対称。連続的 opacity 計算が CSS transition と干渉 |
| CSS edge-glow--near | `.edge-glow--near { opacity: 0.5 }` 追加 | `css/style.css` | 新規クラス |
| CSS edge-glow--flash | `opacity: 0.4` を CSS 側に明示 (JS の style.opacity 直接操作を廃止) | `css/style.css` | フラッシュも CSS に統一 |
| Focus ツールバー fixed 化 | Focus モードのツールバーを `position: fixed` に変更 | `css/style.css` | エディタ上端余白の問題修正 (user 変更) |
| ROADMAP 数値 | E2E/spec 数値を最新化 | `docs/ROADMAP.md` | — |

## 検証結果

実行済み (session 44):

- `npx eslint js/edge-hover.js` → clean
- `npx playwright test` (ui-mode-consistency 12/12, visual-audit 35/35) → pass

未実施 (体感確認が必要):

- グロー CSS クラス方式の動作: near (200px 以内) → opacity 0.5 のフェードインは自然か
- フラッシュ (2回限定): Focus 進入時の一時強調は視認できるか
- BL-002 改行効果切断の体感確認
- BL-004 Focus hover の体感確認
- Reader ボタンのスタイル一貫性
- Focus 左パネル間隔の体感確認
- Wiki ワークフロー統合: `[[` 補完、Reader ポップオーバー、editor-preview click-through
- WP-004 Phase 1: WYSIWYG でのアニメーション/テクスチャ即時適用の体感

## 現在の優先課題

| 優先 | テーマ | 内容 | Actor |
| ---- | ------ | ---- | ----- |
| A | グロー体感確認 | CSS クラス方式の動作確認。OK ならコミット | user |
| A | 手動確認 deferred | BL-002/BL-004/Reader/Focus 体感確認 | user |
| B | WP-001 次スライス | ユーザー要望に基づく次の改善方向 | user (方向判断) |
| C | canonical docs 補完 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` 作成 | shared |

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
