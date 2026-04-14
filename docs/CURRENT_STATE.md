# Current State

最終更新: 2026-04-15 (session 91)

## Snapshot


| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| セッション | 91 |
| 現在の主軸 | **WP-001 監視モード復帰スライス** → Focus パネル UI 摩擦 6 件を 1 スライスで修正 → 再 closeout 宣言。次は WP-004 Phase 3 |
| 直近のスライス | session 91: **WP-001 復帰 (Focus パネル UI 摩擦 6 件)** — Electron ビルド手動確認中にユーザーが 6 件の具体摩擦を特定 → 監視モードから 1 スライス復帰。(1) エッジホバー即応化 ([js/edge-hover.js](js/edge-hover.js) `DWELL_MS=0` / `DISMISS_MS=0`) + トリガー範囲を左端 y 全域に拡張。(2) Focus パネル overlay 化 ([css/style.css](css/style.css) `.editor-container` の `margin-left` 削除、`.focus-chapter-panel` は既 `position: fixed` のため押し出しなし)。(3) セクション折りたたみ機能を廃止 ([js/gadgets-sections-nav.js](js/gadgets-sections-nav.js) `applySectionCollapse` を no-op、「全展開」ボタン + 関連 CSS 撤去)。(4) 「見出しがありません」メッセージ撤去 (同ファイル)。(5) Focus パネル下部 UI (目次コピー/目次テンプレ/カウンター) を撤去 ([js/chapter-list.js](js/chapter-list.js) `renderFooterStats` 呼出除去 + 関連 CSS 削除)。(6) 「新しい章」ボタンを章リスト直下へ移動 ([index.html](index.html) `__footer` 撤去、CSS で `__list` を `flex: 0 1 auto` + `max-height` に変更)。再ビルド: `dist/` `build/win-unpacked/` ともに 2026-04-14 16:56-17:01 JST 更新。検証: `lint:js:check` clean、`test:smoke` pass、`e2e/gadgets.spec.js` + `e2e/chapter-store.spec.js` pass。`command-palette.spec.js:60` の 1 件 failure は stash 比較で **pre-existing** (`#main-hub-panel` は session 88 前後に削除済み、該当テストは古い)。|
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