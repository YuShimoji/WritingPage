# Current State

最終更新: 2026-04-08 (session 68)

## Snapshot


| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 68 |
| 現在の主軸 | WP-001 UI/UX 磨き上げ + WP-004 Reader-First WYSIWYG |
| 直近のスライス | session 68: **執筆モード統合 初回実装** — `setUIMode` を 2 値（normal/focus）に整理し `reader` 保存値を `focus` へ正規化。Reader モードを廃止し、再生オーバーレイ（`data-reader-overlay-open`）へ移行。左サイドバー初期最小化（sections 既定展開）、章リストへ「目次テンプレ挿入」導線追加、ヘルプ任意参照導線（Wikiガイド/エディタガイド）復旧。関連 E2E 5 spec を更新し 96 件 pass。 |


## ドキュメント地図（再開時）

| 読みたいもの | ファイル |
|-------------|----------|
| 不変条件・テスト作法・レイアウト/Wiki の要約 | [`INVARIANTS.md`](INVARIANTS.md) |
| 用語・編集面と UI モードの状態モデル | [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) |
| 執筆モード統合の事前整理（引き継ぎ） | [`specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) |
| 次スライス・マージ前手順 | [`ROADMAP.md`](ROADMAP.md)、[`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) |
| WP-004 監査・手動シナリオ | [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) |
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

- Phase 3（preview / reader の MD→HTML 整合）の差分・手動シナリオ・自動カバー表: [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。回帰の中心は `e2e/reader-wysiwyg-distinction.spec.js`（章末ナビ・wikilink ポップオーバー等は台帳・各 spec ファイル参照）。
- ブロック段落の左・中・右揃えは Phase 3 スライス外。[`specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)、[`specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)（P2）。
- 実装パス一覧: **spec-richtext-enhancement.md** の「実装パス一覧（コードの所在）」節。分割案の歴史は `docs/design/RICHTEXT_ENHANCEMENT.md`。
- 改行・装飾・ショートカット: [`specs/spec-rich-text-newline-effect.md`](specs/spec-rich-text-newline-effect.md)。
- Undo/Redo・タイプライター・Phase 5（表・未着手）: [`specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)、[`FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md)（FR-007 / FR-008）、[`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)。
- テキストボックス `target`: [`specs/spec-textbox-render-targets.md`](specs/spec-textbox-render-targets.md)。


## セッション変更ログ

Session 44〜61 の表形式ログは [`docs/archive/current-state-sessions-44-61.md`](archive/current-state-sessions-44-61.md) に退避。Session 62〜64 は [`docs/archive/current-state-sessions-62-64.md`](archive/current-state-sessions-62-64.md) に退避。

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

## 検証結果

Session 44〜62 の実行ログは [`docs/archive/current-state-verification-sessions-44-62.md`](archive/current-state-verification-sessions-44-62.md)。Session 63〜65 の詳細は [`docs/archive/current-state-verification-sessions-63-65.md`](archive/current-state-verification-sessions-63-65.md)。

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

体感確認（ユーザー OK、優先度低のまま残すもの）:

- WYSIWYG: **IME 確定**（実機・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md)）。**極端な長文連打の体感**（パフォーマンス）
- WYSIWYG + タイプライター ON: **ピクセル単位のアンカー位置の体感**（フォント・DPI 差・[`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) FR-008）
- BL-002 / BL-004 / Focus 左パネル間隔（障害なければ次スライス時にまとめてよい）。Reader フルツールバー目アイコンは session 49 でモードスイッチと同系に済み
- Wiki ワークフロー統合・WP-004 Phase 1 の継続体感

## 現在の優先課題


| 優先  | テーマ            | 内容                                                               | Actor         |
| --- | -------------- | ---------------------------------------------------------------- | ------------- |
| A   | WP-004 次スライス   | Reader/WYSIWYG 境界を崩さない小改善（`docs/ROADMAP.md`「次スライス候補」参照）          | shared        |
| B   | WP-001 次スライス   | ユーザー要望に基づく 1 トピック単位の摩擦削減                                         | user / shared |
| C   | canonical docs | `FEATURE_REGISTRY.md` / `AUTOMATION_BOUNDARY.md` はテンプレート済み。変更時は台帳チェックリストに従い随時追記 | shared        |


## 既知の注意点

- `docs/spec-index.json`: **`status: removed` のエントリは、参照先ファイルがワークツリーに無いことがある**（退避・スコープ外の履歴用）。ゴーストではなく意図した状態。現行仕様の探索は `status: done` / `partial` を優先する
- セッション・検証コマンドの事実関係の正本はこのファイル。役割別の参照先は上の**ドキュメント地図**

## Canonical Gaps

作成済み:

- `docs/ai/*.md` (CORE_RULESET, DECISION_GATES, STATUS_AND_HANDOFF, WORKFLOWS_AND_PHASES)
- `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, `docs/INTERACTION_NOTES.md`
- `docs/runtime-state.md`（補助・カウンター）、`docs/project-context.md`（補助・長命背景）

履歴アーカイブ（正本の代替ではない）:

- `docs/archive/current-state-sessions-44-61.md`（セッション変更表）
- `docs/archive/current-state-sessions-62-64.md`（セッション変更表）
- `docs/archive/current-state-verification-sessions-44-62.md`（検証コマンドログ）
- `docs/archive/current-state-verification-sessions-63-65.md`（検証コマンドログ）
- `docs/archive/runtime-state-session-log.md`（旧 `runtime-state` のセッション別実施ログ）

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