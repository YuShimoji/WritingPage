# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WP-001 UI 磨き上げ・摩擦軽減の継続 (session 34 で着手、方向はユーザー判断)
- デッドコード寄りのリソースは積極的に削除する (session 39 ユーザー指示)
- 意思決定・手動確認地点で区切りを設け、プランを提示する
- **WP-005 プレビュー・比較ツール再設計** (session 97: スライスC完了)

## Backlog Delta

### 既存 Backlog

- ~~`docs/FEATURE_REGISTRY.md` 作成~~ → session 45 でテンプレート追加済み（随時行を追加）
- ~~`docs/AUTOMATION_BOUNDARY.md` 作成~~ → session 45 でテンプレート追加済み

### 推奨スライス順（session 69 / `main` 一本化後）

`docs/CURRENT_STATE.md` の「現在の優先課題」と同順。**常に 1 トピック**に絞る。

1. **保存導線** — [`specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) の未決（手動保存の要否・配置・ガジェット境界）を 1 スライスで確定し、実装または「現状維持」を正本に書き下ろす。
2. **WP-004 Phase 3** — [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) のシナリオに沿い、差分を **1 件ずつ** 修正し `reader-wysiwyg-distinction.spec.js` で監視。
3. **WP-001 摩擦削減** — 台帳の deferred（BL-002 / BL-004 / Focus 左パネル等）は **体感で問題が出たときだけ** 1 トピックに昇格。それ以外は下表から **1 件** を選定。

#### session 71 選定（今回）

- 体感トリガー（BL-002 / BL-004 / Focus 左パネル）は引き続き user actor で監視し、**新規再現なし**。
- WP-001 の次トピックは **「アシスト／メタ系ガジェットの発見性」** を採用（`js/command-palette.js` と各ガジェット `title` / `description` のラベル整合を 1 スライスで実施）。

#### session 72 実施結果（今回）

- WP-001「アシスト／メタ系ガジェットの発見性」を実施。`command-palette` の検索語彙を拡張（`keywords`）し、ガジェット名の語彙を日本語優先へ整合。
- WP-004 では「フォーカスモード中に再生オーバーレイを開閉しても `data-ui-mode=focus` を維持」を `reader-wysiwyg-distinction` で回帰固定。
- deferred 体感トリガーは **新規再現なし**。次の WP-001 候補は **「サイドバー『編集』カテゴリの情報密度」** を採用。

#### session 73 実施結果（今回）

- WP-001「サイドバー『編集』カテゴリの情報密度」を実施。`edit` カテゴリ説明を「装飾・プレビュー・画像」中心に統一し、認知負荷を低減。
- WP-004 は関連回帰（`command-palette` + `reader-wysiwyg-distinction`）を再実行し 26 件通過。
- deferred 体感トリガーは **新規再現なし**。次の WP-001 候補は **「ロードアウトプリセットとガジェット既定の整合」** を採用。

#### session 74 実施結果（次点プラン・予備）

- WP-004 Phase 3 の次点候補A（章末ナビ遷移）を採用し、`reader-chapter-nav` に **「次へ」クリック遷移**の最小 E2E を 1 件追加。
- 回帰は `reader-chapter-nav` + `reader-wysiwyg-distinction` を再実行し **17 件 pass**。
- 次の候補は主プラン優先度を維持し、WP-001 は **「ロードアウトプリセットとガジェット既定の整合」** を継続。WP-004 次点は **ジャンルプリセットの style 反映 1 項目検証**を予備候補とする。

#### session 75 実施結果（WP-001）

- WP-001 優先課題「ロードアウトプリセットとガジェット既定の整合」を実施。`loadouts-presets` を中心に既定配置を整理し、未配置だった `LinkGraph` / `PomodoroTimer` / `FontDecoration` / `TextAnimation` の発見導線を追加。
- 全プリセットで `LoadoutManager` を利用可能にし、既定構成の一貫性を向上。
- 回帰は `dock-preset` + `gadgets` + `visual-audit`（Loadout/カテゴリ周辺）で **18 件 pass**。`visual-audit` の基準スクリーンショット（Structure/Edit）を更新して差分を確定。
- 次候補は WP-004 Phase 3 本線（監査台帳に沿った差分 1 件解消）を推奨。

#### session 76 実施結果（WP-004 Phase 3 本線）

- WP-004 Phase 3 の**監査シナリオ5（ジャンルプリセット）**を本線スライスとして固定し、`reader-genre-preset.spec.js` に **computed style 検証 1 件**（`genre-adv` 適用時 `.zw-dialog` の暗色 `background`）を追加。
- 回帰は `reader-genre-preset` + `reader-wysiwyg-distinction` を再実行し **18 件 pass**（プロダクトコード変更なし）。
- `npx playwright test --list` は **573 テスト / 68 ファイル**（`ROADMAP` 記載用）。
- 次候補: WP-004 は台帳の残差分・手動パックに従う。WP-001 は `CURRENT_STATE` / `ROADMAP` の次トピックを 1 件選定。

#### session 77 実施結果（モード SSOT + WP-004 区切り）

- **モード用語**: `INTERACTION_NOTES` の関係図を UI モード 2 値と再生オーバーレイ別軸に修正。`INVARIANTS`・`spec-writing-mode-unification-prep`・`OPERATOR_WORKFLOW` から正本への参照を追加。`project-context` の旧「Reader モード」表記を更新。
- **WP-004**: reader 系 5 spec を一括回帰し **34 件 pass**。Phase 3 自動層は現状で区切り、**保存導線の横断スライス**は未着手。
- **WP-001（本 session）**: オペレーターワークフロー・長命メモの用語を現行モデルに整合（コード変更なし）。`ui-mode-consistency` **12 件 pass**。
- **次**: **WP-001 を集中**（台帳表から次トピックを 1 件ずつ）。保存導線は別スライス。

#### session 78 実施結果（WP-001）

- **`spec-mode-architecture.md`**: session 68 以前の 3 モード記述を**歴史仕様**として明示し、現行の正本を `INTERACTION_NOTES` / `ROADMAP` A-1 に指向。
- **物語Wikiガジェット**: コマンドパレットの `keywords` に日本語（物語・百科・用語・リンク・設定）を追加（Wiki ワークフロー統合の極小スライス）。
- 回帰: `command-palette` 11 件 + `ui-mode-consistency` 12 件 pass。
- **WP-004**: 新規差分なし（台帳に記録）。手動パックは未実施。
- **次**: WP-001 の続き（台帳の摩擦削減トピック）またはガジェット常設／ドック優先度の整理。

#### session 79 実施結果（WP-001）

- **ガジェット常設／ドック／優先度**: [`spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) に現行実装（カテゴリ・`loadouts-presets`・`dockLayout`・折りたたみ）との対応表を追記。[`loadouts-presets.js`](../js/loadouts-presets.js) に執筆優先の並び方針コメント（挙動変更なし）。
- 回帰: `dock-preset` + `gadgets` **14 件** + `visual-audit`（Loadout/カテゴリ）**4 件** pass。
- **WP-004**: 新規差分なし。手動パックは**未実施**（リリース前はユーザーが [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) に従い実施し、結果を更新履歴へ）。
- **次**（session 79 時点）: ~~保存導線のドキュメント横断~~（**session 80 で実施**）／WP-001 の摩擦 1 件／`defaultCollapsed` 等の初回折りたたみは要検討。

#### session 80 実施結果（保存導線ドキュメント横断）

- **保存文言**: session 71 決定どおり、`command-palette`（保存コマンドのラベル・説明・検索用 `keywords`）、`README.md`（冒頭・オフライン・データ保存・ショートカット）、`gadgets-help.js`（はじめに／エディタ／キーボード表）を横断整合。
- **正本**: `spec-writing-mode-unification-prep` に「ユーザー向け文言の横断（session 80）」を追記。
- 回帰: `command-palette` **11 件** pass。
- **WP-004**: reader コード変更なし。台帳に **差分なし** を 1 行追記。手動パックは**未実施**（リリース前にユーザーが [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) に従い実施する場合のみ本表へ追記）。
- **次**（session 80 時点）: ~~WP-001 の摩擦 1 件~~（**session 81 で実施**）／初回 `defaultCollapsed` 等（要検討）。

#### session 81 実施結果（WP-001 摩擦 1 件・発見性）

- **コマンドパレット**: 多数のコマンドに `keywords` を追加し、日本語・英語の別名から辿りやすくした（検索・UI・ファイル・モード・フォント・編集・段落揃え等）。
- 回帰: `command-palette` **11 件** pass。
- **WP-004**: reader コード変更なし。台帳に **差分なし** を 1 行追記。手動パックは**未実施**。
- **次**（session 81 時点）: ~~初回 `defaultCollapsed` 等~~（**session 82 で assist を `register` 明示 + E2E**）／または台帳の別摩擦 1 件。

#### session 82 実施結果（初回 defaultCollapsed・A3）

- **`ZWGadgets.register`**: オプション `defaultCollapsed`（初回・`zenwriter-gadget-collapsed` 未設定時）。**assist** の Typewriter / FocusMode / HUDSettings / WritingGoal / PomodoroTimer / MarkdownReference に `true` を付与（従来の「Documents/Themes 以外は初回閉」と整合するようコード上で明示）。
- **E2E**: `enableAllGadgets(page, { expandAllGadgets: false })` で LS の全展開上書きを避け、assist の `data-gadget-collapsed` を検証。
- 回帰: `gadgets` **5 件** pass。
- **WP-004**: reader コード変更なし。台帳に **差分なし** を 1 行追記。
- **次**（session 82 時点）: ~~台帳の別摩擦~~／**構造フォールバック**は **session 83 で対応**／または WP-004 差分時のみ。

#### session 83 実施結果（サイドバー構造フォールバック・B2）

- **`sidebar-manager`**: `_applyWritingFocusSidebar` 内、保存済み `accordionState` に展開キーが無いと常に `structure` を開いていたフォールバックを削除（空オブジェクト `{}` でも誤判定していた）。通常モード復帰時は `savedState` と各カテゴリの `defaultExpanded` のみ。
- 回帰: `sidebar-layout` + `sidebar-writing-focus` + `ui-mode-consistency` **22 件** pass。
- **WP-004**: reader コード変更なし。台帳に **差分なし** を 1 行追記。
- **次**: 台帳の **B1 相当**（編集カテゴリ密度・ガジェット説明等の摩擦 1 件）、または WP-004 差分時のみ。

#### session 84 実施結果（WP-001 B1）

- **編集カテゴリの個別説明**: `MarkdownPreview` / `FontDecoration` / `TextAnimation` / `Images` / `ChoiceTools` の `description` を、カテゴリ見出し（装飾・プレビュー・画像）と語彙整合するよう短文化。
- **コマンドパレット**: `toggle-markdown-preview`・`font-decoration-panel`・`text-animation-panel` の説明をガジェット側と横断整合。`keywords` に `Markdownプレビュー` / `ガジェット` を追加。
- **`activateSidebarGroup`**: アコーディオン UI 時は対象カテゴリを展開し、コマンドから「構造」等を開いたとき中身が見えるようにした（session 83 後の `command-palette` E2E 整合を含む）。
- **正本**: `docs/GADGETS.md`（一覧表・カテゴリ行の Story Wiki 配置修正）。
- 回帰: `sidebar-layout` + `sidebar-writing-focus` + `ui-mode-consistency` + `gadgets` + `command-palette` **38 件**、`visual-audit`「05 - Edit gadgets」**1 件** pass。
- **WP-004**: reader コード変更なし。台帳に **差分なし** を 1 行追記。
- **次**: 台帳の **WP-001 摩擦 1 件**（別カテゴリの説明整理、または deferred 体感の昇格）／WP-004 は手動パックで差分が出たときのみ。

#### session 85 実施結果（レーンA: structure/theme）

- **カテゴリ文言**: `structure` を「構成管理（ドキュメント・アウトライン・バックアップ）」、`theme` を「表示調整（テーマ・フォント・見出しスタイル）」へ更新。
- **個別ガジェット説明**: `structure/theme` 配下の主要ガジェット説明を「構造。〜」「表示。〜」で統一（session 84 の edit トーンに整合）。
- 回帰: `sidebar-layout` + `gadgets` **10 件**、`visual-audit`（Structure/Theme）**2 件** pass。
- **WP-004**: reader コード変更なし。手動パックで差分が出た場合のみ別スライス。
- **次（1トピック固定）**: **WP-001 摩擦 1 件 — 他カテゴリ（assist / advanced）のガジェット説明整理**。

#### session 86 実施結果（コア本開発レーン実行）

- **WP-001（LaneA）**: `assist` / `advanced` のカテゴリ説明と配下ガジェット説明を「補助。〜」「詳細。〜」トーンへ統一し、`GADGETS.md` の一覧説明も同期。
- **WP-004（LaneB）**: parity 監査台帳へ差分メモを 1 件追加（シナリオ4: 壊れ wikilink の体感遅延。HTML/状態差分は再現せず修正なし）。
- **同期要件（LaneC）**: クラウド同期 PoC の方式比較（A/B/C）と、`LWW + 競合時複製`・セキュリティ最低要件を `ROADMAP` / `APP_SPECIFICATION` / `SECURITY` にドラフト反映。
- **品質ゲート**: `test:smoke` + `test:unit` + `test:e2e:ui`（計 41 件）pass。
- **次（1トピック固定）**: WP-001 は文言整合の次として「assist/advanced のコマンドパレット導線（description/keywords）整合」または deferred 体感トリガー昇格のいずれか 1 件を選定。

#### session 87 実施結果（章ストア安全化・リモート同期）

- **章ストア / 執筆レール**: 読者プレビュー `getFullContentHtml` から自動 `splitIntoChapters` を除去。`chapter-list` に `getDocumentIdForChapterOps`（親ドキュメント ID 正規化）。章追加時は `ensureSaved` を使わず `flush` のみ。フォーカス入場時も `flush` のみ。`ZWChapterStoreChanged` を章追加直後に発火。執筆レール「+ 追加」の連打ガード・単回バインド。
- **ドキュメント**: [`docs/REFACTORING_SAFETY_CHAPTER_STORAGE.md`](REFACTORING_SAFETY_CHAPTER_STORAGE.md) を新設（プロジェクト全体の同種パターン監査目安）。`CURRENT_STATE` / `HANDOVER` / `INVARIANTS` を同期。
- **その他**: 未コミットの WP-001 系（プレビュー・ガジェット・CSS・`index.html` 等）を同一コミットで `origin/main` に反映。
- **品質ゲート**: `npm run test:smoke` pass。`sidebar-writing-focus` + `chapter-list` E2E **11 件** pass。
- **次（1 トピック固定）**: WP-001 表から 1 件、または `REFACTORING_SAFETY_CHAPTER_STORAGE` に沿った「副作用の塊」の監査を 1 スライス。

#### session 88 実施結果（WP-001 コマンドパレット摩擦）

- **コマンドパレット**: `gadget-assist` / `gadget-advanced` を追加（`activateSidebarGroup('assist'|'advanced')`、サイドバー未オープン時は `toggleSidebar`）。説明・`keywords` は [`js/sidebar-manager.js`](../js/sidebar-manager.js) の `accordionCategories` と配下ガジェット語彙に整合。
- **UI モード検索**: `ui-mode-focus` の `keywords` に `フォーカスモード` を追加（「フォーカスモード」検索で assist 内ガジェットに吸われずミニマル UI へ遷移できるよう明示）。
- **E2E**: [`e2e/command-palette.spec.js`](../e2e/command-palette.spec.js) に補助・詳細設定アコーディオン展開のテスト **2 件**追加（計 **13 件**）。
- **回帰**: `npx playwright test e2e/command-palette.spec.js` → **13 件** pass。`npx eslint js/command-palette.js` → clean。
- **次（1 トピック固定）**: 下表の WP-001 摩擦から **1 件**、または [`REFACTORING_SAFETY_CHAPTER_STORAGE.md`](REFACTORING_SAFETY_CHAPTER_STORAGE.md) の監査 **1 スライス**。

#### session 94 実施結果（E2E 整理・手動テスト環境・WP-005 方針）

- **E2E テスト整理**: MainHubPanel 廃止 (session 88) / セクション折りたたみ廃止 (session 91) / hub affordance 廃止 (session 93) / クイックフォントサイズ UI 削除 / textarea スペルチェック非実用化に伴うレガシーテストを積極削除。566→514 テスト / 65→60 ファイル / **512 passed / 2 skipped / 0 failed**。`EditorSearch.toggleSearchPanel` を `search-floating-panel` 直接操作に修正。
- **手動テスト環境整備**: `.zwp.json` サンプル 3 件 (小説章管理・演出ショーケース・ファイル管理操作ガイド) + `MANUAL_TEST_GUIDE.md` 全面改訂 (11 セクション・80+ チェック項目)。
- **WP-005 方針策定**: 分割ビューの edit-preview が MD プレビューと重複しており設計思想が浮いている問題を分析。(A) edit-preview 廃止 (B) MD プレビューをリッチプレビュー化 (タイピング/スクロール Controller アクティベート) (C) 比較ツール (chapter-compare / snapshot-diff) を隔離・将来は別ファイル比較も。3 スライスの段階実装で合意。
- **未実装確認**: Google Keep 連携はコード・UI ともに存在しない。Markdown (.md) 直接インポートも未実装。
- **品質ゲート**: `lint:js:check` clean。全件 E2E **512 passed / 2 skipped / 0 failed**。
- **次**: WP-005 スライスA (edit-preview 廃止 + 導線整理) を推奨。

#### session 95 実施結果（WP-005 スライスA）

- **edit-preview 廃止**: `split-view.js` から `edit-preview` を削除し、比較ビューは `chapter-compare` / `snapshot-diff` のみを残す構成に整理。
- **導線統一**: `#toggle-split-view`（ツールバー/サイドバー）・コマンドパレット・Electron メニューを「比較ビュー（章比較）」文言に統一し、プレビュー用途との混同を解消。
- **デッドコード整理**: `app-ui-events.js` の `split-view-edit-preview` 参照を削除し、`style.css` から未使用 `split-view-editor-wrapper` / `split-view-preview-wrapper` / `split-view-mode-panel` を削除。
- **品質ゲート（最小）**: `npm run lint:js:check` clean、`npx playwright test e2e/command-palette.spec.js e2e/responsive-ui.spec.js` で **24 passed**。
- **次**: WP-005 スライスB（MD プレビューのリッチプレビュー化）を推奨。

#### session 96 実施結果（WP-005 スライスB）

- **リッチプレビュー化**: `editor-preview.js` の `renderMarkdownPreviewImmediate` 後段で、`surface: 'preview'` の描画結果に対して `TypingEffectController.activate()` / `ScrollTriggerController.activate()` を実行するよう更新。
- **cleanup ライフサイクル**: cleanup参照を `editorManager` に保持し、再描画時は cleanup → 再activate、プレビュー閉時（`editor-preview--collapsed`）は cleanup のみ実行して重複監視を防止。
- **CSS 方針**: `#editor-preview .zw-scroll` など既存スタイルで要件を満たすため、スライスBでは CSS 追加なし。
- **品質ゲート（最小）**: `npm run lint:js:check` clean、`npx playwright test e2e/typing-effect.spec.js e2e/wysiwyg-dsl-preview.spec.js` で **24 passed**。
- **次**: WP-005 スライスC（比較ツールの隔離と導線集約）を推奨。

#### session 97 実施結果（WP-005 スライスC）

- **比較導線の分離**: コマンドパレットを `compare-chapter` / `compare-snapshot` の2コマンドに分離し、「比較ツール」カテゴリとして独立。
- **導線集約**: 比較導線をサイドバー「構造」カテゴリの専用ボタン（章比較/スナップショット差分）へ移動。編集カテゴリの比較導線とツールバー側の重複導線を撤去。
- **ルーティング統一**: `SplitViewManager.open(mode)` を追加し、比較導線を `open()` 経由に統一。Electron メニュー導線も新しい「章比較」ボタンへ接続。
- **品質ゲート（最小）**: `npm run lint:js:check` clean、`npx playwright test e2e/command-palette.spec.js` で **13 passed**、`npx playwright test e2e/visual-audit.spec.js -g "Structure gadgets"` で **1 passed**。
- **次**: WP-005 は A/B/C の計画スライスが完了。次段は比較ツールの別ドキュメント比較拡張を別トピックで起票。

#### session 98 実施結果（Electron ビルド版 3バグ修正）

- **Bug 1 終了失敗**: `beforeunload` の `preventDefault` が Electron で終了シーケンスを hang させていた。`window.electronAPI` 存在時はスキップするよう修正 ([js/app-autosave-api.js](../js/app-autosave-api.js))。
- **Bug 2-a サイドバー初期非表示**: 読み取りキー `sidebarVisible` / 書き込みキー `sidebarOpen` の不整合で localStorage 復元が効かず、ビルド版初回起動で常に非表示になっていた。両キー互換読み + storage 既定値 `true` に変更 ([js/settings-manager.js](../js/settings-manager.js), [js/storage.js](../js/storage.js))。
- **Bug 2-b edge-hover サイドバー閉じ不能**: `forceSidebarState(true)` が常に `data-sidebar-open` を付与するため `isSidebarNormallyOpen()` が手動オープンと edge-hover オープンを判別できず、hideEdge で閉じ処理がスキップされていた。`leftEdgeOpenedSidebar` 所有権フラグで責任分離 ([js/edge-hover.js](../js/edge-hover.js))。
- **Bug 3 フォント過大**: `webPreferences.zoomFactor: 0.9` で Windows DPI スケールを相殺、`:root { font-size: 16px }` で rem 基準を固定 ([electron/main.js](../electron/main.js), [css/style.css](../css/style.css))。
- **品質ゲート（最小）**: `npm run lint:js:check` clean。手動実機確認は user によるビルド再確認で実施予定。
- **次**: Phase B (option 2: リッチ編集改行まわりの発見性向上 — コマンドパレットへ昇格) を推奨。

#### session 99 実施結果（WP-001 Phase B: リッチ編集改行の発見性向上）

- **コマンドパレットへの昇格**: `effectBreakAtNewline` と `effectPersistDecorAcrossNewline` の切替を Ctrl+P から直接トグル可能に ([js/command-palette.js](../js/command-palette.js))。新カテゴリ「リッチ編集」を追加。
- **設定UIとの同期**: `ZenWriterSettingsChanged` イベント発火で、サイドバー設定ガジェット (`gadgets-editor-extras.js`) のチェックボックスも自動同期。
- **品質ゲート**: `npm run lint:js:check` clean、`npx playwright test e2e/command-palette.spec.js` = **13 passed**。
- **次**: Phase C (option 3: WP-001 執筆モード整理) は user と 1 スライス選定後に着手。

#### session 101 実施結果（WP-001 スライス1: UI システム説明文削減 + 死体ボタン撤去 + docs SSOT 化）

- **背景**: Normal モード UI の常時表示テキスト過多（約 300 字）をユーザーが指摘。既存ヘルプモーダルは「分かりづらい」評価のため集約先として却下。トップバー系ボタン撤去予定の方針と整合する「**案α（docs のみ・UI 入口なし）**」を採択。
- **UI 削減（合計 約 300 字 + DOM 5 要素）**:
  - `#sidebar-edit-hint`（99字）削除 ([index.html](../index.html))
  - `sidebar-manager.js:897-899` の `.writing-focus-empty` チップ説明（70字）削除
  - サイドバー `#sidebar-toggle-preview` / `#sidebar-toggle-wysiwyg` の title を `"MD プレビュー"` / `"リッチ編集"` に短縮
  - 詳細設定カテゴリの**死体3ボタン**（`#sidebar-toggle-help` / `#help-button` / `#editor-help-button`）撤去
  - `app-ui-events.js` の `sidebarHelpBtn` リスナーと `element-manager.js` / `app-settings-handlers.js` の `helpButton` / `editorHelpButton` 参照も全掃除
- **ガジェット description 冠詞削除**: 26 箇所のガジェット description から先頭冠詞（「補助。」「詳細。」「構造。」「装飾。」「表示。」「プレビュー。」「画像。」「分岐。」「装飾・演出。」）を除去（[gadgets-editor-extras.js](../js/gadgets-editor-extras.js) ほか 14 ファイル）。`docs/GADGETS.md` の description 列も同期。
- **集約先（SSOT）**: [docs/EDITOR_HELP.md](EDITOR_HELP.md) に 1-3「エディタ表示の切り替え」節と 14「章管理とシーンナビゲーション」節を新設。UI から削除した情報はここに集約。
- **機能洗い出し足場**: [docs/FEATURE_REGISTRY.md](FEATURE_REGISTRY.md) に **FR-009「アプリ内ヘルプ資源（SSOT: EDITOR_HELP.md）」** を追加。
- **ヘルプ到達性維持** (session 101 時点): トップバー `#toggle-help-modal` とコマンドパレット経由は残存。サイドバー詳細設定カテゴリからの直接ヘルプ到達は意図的に喪失（後続スライスでヘルプモーダル本体を再設計予定）。**※ session 102 でトップバーボタン自体も撤去 → コマンドパレット + `F1` のみへ縮減**
- **品質ゲート**: `sidebar-writing-focus.spec.js` **5 passed**（削除前後で緑維持）。
- **後続スライス候補**:
  - ~~スライス2: トップバー歯車 / ヘルプアイコン~~ → session 102 で歯車・ヘルプを撤去 + ショートカット導入で消化。残: 再生オーバーレイボタンの撤去、リーダーモード廃止、ヘルプモーダル本体の再設計、`docs/wiki-help.html` / `docs/editor-help.html` の削除
  - スライス3: サイドバーアコーディオン 6→4 カテゴリ統廃合、カテゴリ description の冠詞統一、`docs/FEATURE_REGISTRY.md` に 28 ガジェット分の FR エントリ一括追加

#### session 102 実施結果（WP-001 スライス2: トップバー歯車・ヘルプボタン撤去 + ショートカット導入）

- **背景**: session 101 のヘルプ動線縮小方針 + トップバー視覚密度削減を継承。トップバー `toolbar-group--system` の 3 ボタン (歯車 / ヘルプ / テーマ) を 1 ボタン (テーマのみ) に縮減。
- **DOM 撤去**: [index.html](../index.html) から `#toggle-settings` / `#toggle-help-modal` の 2 button 要素削除。
- **JS ハンドラ整理**: [app-ui-events.js](../js/app-ui-events.js) の `toggleSettingsBtn` / `toggleHelpBtn` リスナー削除 (close リスナー・モーダル本体・`openSettingsModal()` / `openHelpModal()` は維持)。[app.js](../js/app.js) の `gearBtn` 内 `#toggle-settings` fallback click を削除。
- **ショートカット追加**: [keybind-editor.js](../js/keybind-editor.js) `DEFAULT_KEYBINDS` に `app.settings.open` (`Ctrl+,`) と `app.help.open` (`F1`) の 2 エントリ追加。[app-shortcuts.js](../js/app-shortcuts.js) の switch + フォールバックブロック双方にハンドラ追加 (Mac `Cmd+,` を metaKey 経路で拾う対策含む)。
- **コマンドパレット表示**: [command-palette.js](../js/command-palette.js) の `open-settings` / `open-help` の `shortcut` 表示を `'Ctrl+, / Cmd+,'` / `'F1'` に更新。
- **scripts 更新**: [scripts/dev-check.js](../scripts/dev-check.js) の `id="toggle-settings"` / `id="toggle-help-modal"` 検査削除。[scripts/capture-ui-verification.js](../scripts/capture-ui-verification.js) / [scripts/capture-full-showcase.js](../scripts/capture-full-showcase.js) の click を `window.ZenWriterApp.openSettingsModal()` / `openHelpModal()` API 経由に置換。
- **E2E 書換 (6 ファイル)**: [helpers.js](../e2e/helpers.js) の `openSettingsModal` を API 経由に変更。[keybinds.spec.js](../e2e/keybinds.spec.js) / [theme-colors.spec.js](../e2e/theme-colors.spec.js) も同様。[accessibility.spec.js](../e2e/accessibility.spec.js) / [ui-editor.spec.js](../e2e/ui-editor.spec.js) (4 箇所) は `#toggle-settings` を `#toggle-theme` に差替 (任意の可視ボタンの代理として意図同等)。[visual-audit.spec.js](../e2e/visual-audit.spec.js) は `openHelpModal()` API 経由に置換。
- **品質ゲート**: `npm run lint:js:check` clean、関連 6 spec **63 passed / 0 failed**、`npm run test:smoke` pass、全 E2E **511 passed / 1 flaky (pathtext-handles, 単独再実行で pass) / 2 skipped**。
- **次**: スライス2 残候補 (再生オーバーレイボタン撤去 / ヘルプモーダル本体再設計 / 静的 help HTML 削除) または スライス3 (アコーディオン統廃合)。

#### session 103 実施結果（hotfix: 設定モーダル空問題 → サイドバー詳細設定動線へ）

- **背景**: user が session 102 ビルドの実機検証で Focus 章パネル歯車を押すと「中身がカラのモーダル」が開く問題を報告。`F1` ヘルプは正常動作。
- **原因究明**: `js/gadgets-utils.js:181-190` で `settings` グループは **deprecated** で `advanced` (詳細設定) に統合済み (`migratesTo: 'advanced'`)。`#settings-gadgets-panel` (`data-gadget-group="settings"`) には何もレンダリングされない構造的バグ。session 102 とは無関係で、長期間トップバー歯車も同じく空モーダルだったが user は気付かず使用していた (詳細設定カテゴリはサイドバーから直接アクセスしていた可能性)。session 102 でトップバー歯車撤去 → Focus 歯車を初使用 → 発覚。
- **修正**: `openSettingsModal()` の実装を `toggleModal('settings-modal', true)` から `window.sidebarManager.activateSidebarGroup('advanced')` + サイドバー展開に変更 ([js/app-ui-events.js](../js/app-ui-events.js))。これにより Focus 章パネル歯車 / `Ctrl+,` (Mac `Cmd+,`) / コマンドパレット `open-settings` の 3 経路すべてが「サイドバー詳細設定カテゴリを開く」に統一動線化。`gadget-advanced` コマンド (session 88 追加) と同等動作。
- **コマンドパレット表示更新**: `open-settings` の description を「サイドバー詳細設定カテゴリを開く (キー割当・ロードアウト・スナップショット等)」に、keywords を `advanced` / `keybind` / `Loadout` / `スナップショット` 等に拡張 ([js/command-palette.js](../js/command-palette.js))。`Ctrl+, / Cmd+,` ショートカット表示は維持。
- **互換維持**: `#settings-modal` DOM 本体は当面残存、`closeSettingsModal()` は no-op として残置。`scripts/dev-check.js` の DOM 検査は通る。
- **E2E 影響 (4 ファイル)**:
  - [helpers.js](../e2e/helpers.js): `enableAllGadgets` のガジェット強制登録先を `'settings'` → `'advanced'` に。`#settings-gadgets-panel` の強制 init を `#advanced-gadgets-panel` に変更。`openSettingsModal` ヘルパは `#advanced-gadgets-panel` の attached 待ちに (詳細設定アコーディオン折り畳み状態でも DOM は存在する)。
  - [keybinds.spec.js](../e2e/keybinds.spec.js): `scope` 変数と全ハードコード参照を `#advanced-gadgets-panel` に置換。
  - [theme-colors.spec.js](../e2e/theme-colors.spec.js): Themes ガジェットの動的登録先を `'advanced'` グループに、全ハードコード参照を `#advanced-gadgets-panel` 系に置換。
  - [collage.spec.js](../e2e/collage.spec.js): Images ガジェットの locator を `#advanced-gadgets-panel` ベースに置換。
- **品質ゲート**: `npm run lint:js:check` clean、全 E2E **512 passed / 0 failed / 2 skipped** (前回の pathtext-handles flaky も含めて green)。
- **session 104 候補 (user 提起)**: **フルのドキュメント一覧 UX 改善** — 以下 3 件の不安定さを user が報告。
  1. 複数削除中にチェックボックス外をクリックすると全選択が外れるが、選択中の数字表示はそのまま残る (状態管理バグ)
  2. ドキュメント数が多いとリストが見切れる (CSS overflow / max-height 不足)
  3. 複数選択が一つ一つクリックしないとできず使いづらい (Shift+Click 範囲選択 / 全選択ボタン未実装)
  - 影響領域 (推定): `js/gadgets-documents-hierarchy.js`, `js/gadgets-documents-tree.js`, 関連 CSS

#### session 103.1 実施結果 (Focus モード歯車レイアウト崩壊 hotfix) — **実機で未解決**

- **背景**: session 103 ビルド (`build-session103/`) を user が実機検証で Focus 章パネル歯車を押すと、サイドバーが viewport 全幅占有 + 「フル」表示への遷移異常を報告。コマンドパレット経由は正常 → Focus モード状態で `openSettingsModal()` を呼んだ時固有の問題と特定。
- **実施した修正**: `openSettingsModal()` の冒頭に Focus 判定を追加し、Focus モード時は `window.ZenWriterApp.setUIMode('normal')` で Normal 切替してから `activateSidebarGroup('advanced')` + サイドバー展開を実施 ([js/app-ui-events.js](../js/app-ui-events.js))。
- **自動検証**: `lint:js:check` clean、関連 3 spec **15 passed / 0 failed**。
- **実機検証結果 (user 報告)**: **`build-session104/win-unpacked/Zen Writer.exe` でも症状は解消せず**、左サイドバーが出っぱなしになる。session 103.1 の修正は不十分。
- **推定される根本原因 (次セッションで検証すべき仮説)**:
  1. `setUIMode('normal')` は DOM attribute を同期更新するが、サイドバーの CSS 再計算・レイアウトは次のフレームを待つ可能性 → 直後の `toggleSidebar()` 時点では Focus 用 CSS がまだ適用されたまま
  2. `activateSidebarGroup('advanced')` 自体が内部で toggleSidebar と競合する副作用を持つ可能性
  3. そもそも session 102 以前から存在した潜在 bug で、session 102 のトップバー歯車撤去で初めて発覚した可能性
- **session 104 でまず試す候補**:
  1. **`setTimeout(fn, 50)` で Normal 切替後の処理を次イベントループに遅延** (最も素直)
  2. **`requestAnimationFrame` を2回挟む** (CSS 反映を確実に待つ)
  3. **session 103 / 103.1 を revert** (`git revert 1b52678 40510e0` → session 102 状態へ)。Focus 歯車は空モーダルに戻るが、レイアウト崩壊はなくなる。hotfix は別アプローチで再設計
  4. **Focus 章パネル歯車ハンドラそのものを変更** ([js/app.js](../js/app.js) 591-598 あたり) — `closeFocusOverlay()` の代わりに `setUIMode('normal')` を先に呼び、次のフレームで `openSettingsModal` を呼ぶ
- **ウィンドウ最小時の左サイドバー全画面占有**: session 104 で部分修正 — `style.css` の 1024px 以下メディアクエリで `width: 100%` を `var(--sidebar-width)` + `max-width: calc(100vw - 2rem)` に変更。Electron 実機確認は未実施。

#### session 104 実施結果 (サイドバーリサイズ修正 + UI 整備)

- **サイドバーリサイズ**: `dock-manager.js` のリサイズ時にインライン `style.width` も同時更新。`app.js:388` が設定復元時にインライン width を設定するため CSS 変数 `--sidebar-width` のみでは効かなかった根本原因を解消。リサイズ完了時に `ui.sidebarWidth` を設定に永続化。リサイズハンドルを sidebar 子要素から `app-container` 直下の fixed 配置に変更 (sidebar の `overflow-x: hidden` で切られていた)。
- **edge-hover デバッグ撤去**: `sendDebugLog` / `fetch` (エージェントデバッグ用の残骸) / `debugLast*` 変数を全撤去。リサイズ時 window resize リスナーも不要のため削除。
- **エディタ focus 枠線消去**: `#editor` / `#wysiwyg-editor` の `:focus` / `:focus-visible` に `box-shadow: none` を明示。
- **狭幅サイドバー修正**: `width: 100%` 全幅化を廃止し `var(--sidebar-width)` + `max-width: calc(100vw - 2rem)` に変更。
- **インラインスタイル競合の調査**: サイドバー以外の同種競合は現時点でなし (`--focus-panel-width`, `--dock-left-width` は CSS 変数のみで安全)。`--editor-max-width` (EditorUI.js) は JS で設定するが CSS 側で未使用 (無害だが不要コード)。
- **次**: Focus 歯車レイアウト崩壊 (継続)、ドキュメント一覧 UX 3 件、またはインラインスタイル一本化。

#### session 109 実施結果 (session 108 レビュー指摘の根治・SSOT 化)

- **背景**: session 108 の静的レビューで user が 4 つの根本問題を指摘: (1) A-3 は「表示」は直ったが virtual heading クリック時に offset:-1 を editor.selectionStart に渡して未定義動作 (2) A-2 は保存神経系が二重 — autoSave.enabled を見ずに毎回 flush、`_triggerAutoSave` はデッドコード (3) 4 件の修正を直接保証する回帰 E2E 不在 (4) UI 文言「フル Chrome」/「フルChrome」が混在。共通原因は SSOT 不在・イベント契約後付け・保存経路二重・文言散在。
- **C-1 virtual heading 操作根治** ([js/gadgets-sections-nav.js](../js/gadgets-sections-nav.js)): `jumpToHeading` 冒頭に `heading._virtual && heading._chapterId` 検出を追加し、chapterMode の場合は ChapterStore の章 id から `chapterIdx` を引き、`ZWChapterList.navigateTo(chapterIdx)` を呼ぶ。WYSIWYG/textarea 両経路で `mergeVirtualChapterHeadings(list)` ヘルパを共有して virtual heading を統合。virtual 判定後は既存の editor 操作経路に到達させず、offset:-1 を editor に渡す可能性を完全排除。
- **C-2 保存神経系 SSOT 化**: [js/app-autosave-api.js](../js/app-autosave-api.js) のデッドコード `_triggerAutoSave` + `autoSaveTimeout` を全削除、export は `{}` に縮退。[js/chapter-list.js](../js/chapter-list.js) `notifyAutoSaved` に `s.autoSave.enabled === true` ガードを先頭に追加。章内容保存 (`flushActiveChapter` 本体) は autoSave 設定と無関係に常時実行する契約を維持。`autoSave.enabled` の意味は「HUD 通知の表示有無」だけに限定。
- **C-3 UI 文言統一**: docs/\*.md, css/style.css, e2e/helpers.js, docs/specs/\*.md 全体で `sed 's/フル Chrome/フルChrome/g'` を実行。実装表記 (index.html / app.js / command-palette.js 既存) に docs を合わせる形で統一。
- **C-4 回帰 E2E 2 件追加** (INVARIANTS Test Discipline の例外):
  - [e2e/ui-mode-consistency.spec.js](../e2e/ui-mode-consistency.spec.js): view-menu 現モード表示の同期テスト (session 108 A-1 相当の回帰防止)
  - [e2e/sections-nav.spec.js](../e2e/sections-nav.spec.js): chapterMode で virtual heading クリック → `ZWChapterList.navigateTo` 動作テスト (session 109 C-1 の回帰防止)
- **契約化 ([docs/INVARIANTS.md](INVARIANTS.md))**: 「chapterMode 章内容保存は常時実行、autoSave.enabled は HUD 通知のみ制御」「ZenWriterUIModeChanged は setUIMode 単一経路で発火」「UI 文言『フルChrome』が正本」の 3 条を追加。Test Discipline に「user 実機で発覚した不具合の回帰防止は追加を許容」の例外も明記。
- **検証**: `lint:js:check` clean、`test:smoke` pass、全 E2E **514 passed / 2 skipped / 0 failed** (session 108 の flaky 解消 + 新規回帰 2 件を含む 516 本中)。
- **ビルド**: `build-session109/win-unpacked/Zen Writer.exe`。
- **次**: user 実機確認で C-1/C-2/C-3 を確認。commit 承認後に 3 コミット構成 (ロジック / E2E / docs) で push。
- **追記 — SectionsNavigator 同名章欠落（レビュー P2）**: `mergeVirtualChapterHeadings` が `h.title === name` のみで重複排除していたため、同名章が 1 件しか sections に出ず到達不能になる問題を根治（章ストア順と実見出しの 1 対 1 突き合わせ・余りのみ `_chapterId` virtual）。textarea の `findActiveIndex` は `_virtual` をカーソル判定から除外。[e2e/sections-nav.spec.js](../e2e/sections-nav.spec.js) に同名章 2 件の表示・クリック回帰を追加。検証（追記時点）: `lint:js:check` clean、`e2e/sections-nav.spec.js` **6 passed**。

#### session 110 実施結果（コミット・リモート反映・引き継ぎ）

- **コミット**: SectionsNavigator 同名章修正と未コミット変更を **1 コミット**にまとめ、`origin/main` へ **push**（2026-04-20）。
- **検証（push 直前）**: `npm run lint:js:check` clean、`npx playwright test` 全件 **515 passed / 2 skipped / 0 failed**。
- **ドキュメント**: `CURRENT_STATE` / `runtime-state` / `HANDOVER` を再開手順つきで同期。次スレッドは `git pull --ff-only` → `CURRENT_STATE` Snapshot。

#### session 108 実施結果 (session 107 実装の総点検・4 バグ根治)

- **背景**: session 107 (view-menu 集約 + autoSave migration) の実機確認で user が 4 つのズレを報告: (1) view-menu 現モード表示が切替えても「ミニマル」のまま (2) ミニマル章追加 → セクションに反映されない (3) 保存通知が一切出ない (4) Electron メニュー案内が「View」誤訳。**ショートカット系テストは除外する** 方針指示あり。
- **A-1 — view-menu 同期**: [js/app.js](../js/app.js) `setUIMode` 末尾で `window.dispatchEvent(new CustomEvent('ZenWriterUIModeChanged', {detail: {mode, source: 'setUIMode'}}))` を発火。既存購読者 (visual-profile.js / `_syncViewMenuState`) はトリガー条件で源を判別するため循環しない。これで view-menu `.view-menu__current` の表示がモード切替に追従。
- **A-2 — Focus モード HUD 表示 + chapter-level autosave HUD 統合**: [css/style.css](../css/style.css) `html[data-ui-mode='focus'] .mini-hud` を `display: none !important` から `opacity: 0.8 + pointer-events: none + transform: scale(0.9)` に変更。[js/chapter-list.js](../js/chapter-list.js) `flushActiveChapter` 末尾に `notifyAutoSaved()` を追加 (連続入力で連打を避けるため 3 秒 cooldown)。調査の結果 `app-autosave-api.js` の `_triggerAutoSave` は誰からも呼ばれていないデッドコードだったため、実際の保存パスである `flushActiveChapter` に HUD を組み込む実装に切替。
- **A-3 — sections ガジェット 章追加連動 + ChapterStore 統合表示**: [js/gadgets-sections-nav.js](../js/gadgets-sections-nav.js) に (1) `ZWChapterStoreChanged` 購読を追加し scheduleRender、(2) Markdown パス の `render()` 内で `ChapterStore.isChapterMode(docId)` の場合に Store の章タイトルを virtual heading として `currentHeadings` にマージ。editor テキストに heading が未挿入でも章一覧として視認可能に。
- **B-1 — view-menu に「全画面 (F11)」追加**: [index.html](../index.html) に `data-view-action="toggle-fullscreen"` の menuitem を追加。[js/app.js](../js/app.js) `initViewMenu` click ハンドラに DOM Fullscreen API 経由のトグル実装を追加。
- **docs 方針追記**: [docs/INTERACTION_NOTES.md](INTERACTION_NOTES.md) 手動確認セクションに「ショートカット等の既確認機能は新規変更なしの限り再確認依頼しない」「Electron メニューは現物の日本語表記『表示(&V) > 全画面表示(&L)』」を追記。
- **試行錯誤**: 当初は `chapter-list.handleAddChapter` で新章の initial content に markdown heading を入れる案を試したが、`chapter-mode-sync.spec.js:74` の assemble/split 往復テストで chapter count が 3 になる副作用が出たため取り消し、sections ガジェット側での virtual heading 統合に切替え。
- **検証**: `lint:js:check` clean、`test:smoke` pass、E2E 全件 flaky 2 件 (image-position-size / visual-audit 19) を除き pass。新規 spec 追加なし (INVARIANTS Test Discipline)。
- **ビルド**: `build-session108/win-unpacked/Zen Writer.exe`
- **次**: user 実機確認で 4 件のズレ解消を確認。追加摩擦があれば 1 スライスに昇格。

#### session 107 実施結果 (画面全体モード切替 UI の根治再編)

- **背景**: session 105 ビルド実機確認で user が「Focus モード導線がビルド版で見つからない」「削除件数確認に本文サンプルが必要」「自動保存通知が出ない」「UI の破綻 (10 個のモード切替が散在)」の 4 点を報告。候補 C (大規模再編) + 全部撤去 に user 承認。
- **実施内容**:
  - **UI 再編**: サイドバー先頭 `.toolbar-quick-actions` を `<details id="view-menu">` ドロップダウンに置換。「表示」サマリに現モード名を常時表示。パネル内に表示レイアウト (フルChrome/ミニマル) + 再生オーバーレイ + 編集面 (リッチ編集/Markdown、dev-only) を集約。
  - **撤去**: `.mode-switch-btn` x2、`#fullscreen`、`#toggle-reader-preview` (トップ)、`#focus-exit-to-normal-btn` を DOM ごと完全削除。`_toggleFullscreen` / `fullscreenBtn` 配線も撤去。
  - **互換シム**: `#toggle-wysiwyg` (トップ) と `.writing-focus-footer` の「詳細」「フルChrome」ボタンは E2E 24+ 件/6 件依存のため、DOM は残し CSS `display:none`/`clip:rect(0,0,0,0)` で視覚的のみ隠蔽。関連 E2E は `toBeAttached` + programmatic click に書換。
  - **ショートカット**: F2 (フルChrome ↔ ミニマル)、Alt+Shift+R (再生オーバーレイ)、`Ctrl+,` (設定) は既存維持。追加なし。
  - **コマンドパレット**: `ui-mode-next` / `editor-surface-wysiwyg` / `editor-surface-markdown` を新規追加し view-menu と完全対応。`toggle-markdown-preview` description の「再生オーバーレイ」誤マッチを解消。
  - **autoSave up-migration (v2)**: [js/storage.js](../js/storage.js) `loadSettings()` で旧ユーザーの `autoSave.enabled: false` を 1 回限り `true` に書換え + `__autoSaveMigrationV2` フラグ永続化。session 105 の実機で通知が出なかった根本原因を解消。
  - **Electron F11**: `#fullscreen` 撤去後も Electron メニュー「View > Toggle Full Screen」で代替可能。electron/main.js は無改変。
- **修正ファイル (10)**: [index.html](../index.html), [css/style.css](../css/style.css), [js/app.js](../js/app.js), [js/app-ui-events.js](../js/app-ui-events.js), [js/element-manager.js](../js/element-manager.js), [js/command-palette.js](../js/command-palette.js), [js/electron-bridge.js](../js/electron-bridge.js), [js/gadgets-markdown-ref.js](../js/gadgets-markdown-ref.js), [js/storage.js](../js/storage.js)
- **E2E 追従 (3 spec)**: [e2e/ui-mode-consistency.spec.js](../e2e/ui-mode-consistency.spec.js) (`#focus-exit-to-normal-btn` → F2)、[e2e/sidebar-writing-focus.spec.js](../e2e/sidebar-writing-focus.spec.js) (`toBeVisible` → `toBeAttached` + programmatic click)、[e2e/responsive-ui.spec.js](../e2e/responsive-ui.spec.js) (tablet アイコンサイズ 36 → 32)。新規 spec 追加なし (INVARIANTS Test Discipline)。
- **検証**: `lint:js:check` clean、`test:smoke` pass、全 E2E **512 passed / 0 failed / 2 skipped**。
- **ビルド**: `build-session107/win-unpacked/Zen Writer.exe` (view-menu 集約 + autoSave migration + session 105 Slice 1-3)。
- **次**: user 実機確認で UI 散在と Focus 導線の解消を確認。追加摩擦があれば 1 スライスに昇格。

#### session 105 実施結果 (実務使用ギャップ解消 3 スライス)

- **Slice 1 — Focus 歯車レイアウト崩壊の根本修正**: `openSettingsModal()` に `sidebar.style.removeProperty('width')` を挿入 ([js/app-ui-events.js](../js/app-ui-events.js))。session 103/103.1 の hotfix が実機で未解消だった原因はリサイズ/設定復元で書き込まれる残留インライン width。CSS 変数 `--sidebar-width` は loadSettings 経路で永続化され次回起動時に復元されるため、ユーザーのサイドバー幅設定は維持される。
- **Slice 2 — ドキュメント一覧 UX 3 件**:
  - (a) 一括削除通知 `X 件を削除しました` が常に「0件」になるバグ ([js/gadgets-documents-hierarchy.js](../js/gadgets-documents-hierarchy.js)) を count 退避で修正。batchDeleteBtn の textContent リセットも追加。
  - (b) `.documents-hierarchy` の flex 制約不足で子 `.documents-tree-container` が overflow-y: auto しきれなかった問題を `min-height: 0` + `max-height: 100%` で解消 ([css/style.css](../css/style.css))。
  - (c) Shift+Click 範囲選択と「全選択/全解除」トグルボタンを新規実装。`getFlatSelectableIds()` で `storage.buildTree()` を DFS 展開し順序付き document id 配列を生成。`handlers.onRangeSelect(targetId, checked)` / `handlers.isSelected(id)` を新設。`lastClickedId` をアンカーとして hierarchy 側で範囲確定 → `refreshUI()`。
- **Slice 3 — 保存機能の最小改善**:
  - (1) `DEFAULT_SETTINGS.autoSave.enabled` を `false` → `true` ([js/storage.js](../js/storage.js))。既存 localStorage の明示 false は loadSettings のマージで尊重されるため既存ユーザーへの影響なし。初回ユーザーのみ自動保存 ON。
  - (2) 手動保存コマンド ([js/command-palette.js](../js/command-palette.js)) を try/catch で包み、失敗時は `ZenWriterHUD.show(..., { type: 'error' })` でエラー通知。
  - (3) 自動保存 ([js/app-autosave-api.js](../js/app-autosave-api.js)) の catch 節に HUD エラー通知を追加。保存中インジケーターは既存の「自動保存されました」成功 HUD で実用上十分なため省略。
- **触らない** (INVARIANTS): `chapter-store.js` assembleFullText/splitIntoChapters、`storage-idb.js` IDB スキーマ、保存導線 3 経路 (Ctrl+S / コマンドパレット / ガジェット) 統一方針。
- **保留** (範囲外): 保存ファイル物理場所指定、sessionStorage クラッシュ復旧、複数タブ同時編集ロック。
- **検証**: `lint:js:check` clean。`sidebar-writing-focus` + `sidebar-layout` **10 passed**。`gadgets` + `chapter-store` + `command-palette` + `editor-settings` **49 passed / 1 skipped**。`test:smoke` pass。E2E 追加なし (INVARIANTS Test Discipline 遵守)。
- **ビルド**: `build-session105/win-unpacked/Zen Writer.exe` (Slice 1 単独) / `build-session106/win-unpacked/Zen Writer.exe` (Slice 2+3 合算)。Build Checkpoint Policy に従いスライス境界でビルド。
- **次**: ユーザー実機確認待ち。実機で Focus 歯車崩壊解消・一覧 UX 3 件・自動保存動作を確認後、未解決項目があれば 1 トピック追加、なければ closeout。

### 次スライス候補（WP-004 / WP-001 / WP-005、1 トピックずつ選定）

- **リッチテキスト・書式の改行まわり（将来）**: 現状は **改行で書式／装飾が切れる** のが仕様（`effectBreakAtNewline` 既定 true、BL-002）。**decor 持続**（`effectPersistDecorAcrossNewline`）は Enter 接続済み・WYSIWYG **ショートカット割当済み**（session 57）。残りは **設定 UI** や **`effectBreakAtNewline` 側**の切替などを 1 スライスで検討。

| 軸             | 候補                                           | 備考                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP-004        | ~~Reader と MD プレビューの HTML パイプライン差分の監査~~      | session 46 で E2E 拡張 + `convertForExport` 修復済み。継続は差分発見時に追記                                                                                                                                                                               |
| WP-004        | ~~WYSIWYG 既定オフ時の Reader 導線の文言・`aria-*` の統一~~ | `index.html` / `reader-preview.js` / コマンドパレット説明文で統一（本セッション）                                                                                                                                                                             |
| WP-001        | ~~コマンドパレットからのモード切替後のフォーカス遷移~~                | session 46 で実装・E2E 済み                                                                                                                                                                                                                   |
| WP-001        | ~~狭幅時ツールバー折り返し後の余白~~                         | `style.css` 768px 以下の折り返し・transition 調整、`toolbar-editor-geometry` で `--toolbar-height` 一致＋コンパクト狭幅を追加（session 48） |
| WP-004        | Phase 3 継続（preview / **再生オーバーレイ** のレンダリング近接）       | [`docs/ROADMAP.md`](ROADMAP.md) 表参照。差分の列挙・手動シナリオは [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。**1 件ずつ** 修正、`reader-wysiwyg-distinction.spec.js` で監視 |
| WP-001        | ~~assist/advanced のコマンドパレット導線（`gadget-assist` / `gadget-advanced`）~~ | session 88 実施。[`js/command-palette.js`](../js/command-palette.js)、[`e2e/command-palette.spec.js`](../e2e/command-palette.spec.js) |
| WP-001        | ~~摩擦削減の次トピック~~ → **監視モード** (session 90、session 91 で 1 件復帰実施) | 既知摩擦 11 件は session 72〜88 で消化完了。session 91 でユーザー体感トリガー発火 → Focus パネル UI 摩擦 6 件を 1 スライスで消化し再 closeout。deferred 体感項目は 36 セッション連続で新規再現なしを維持 |
| リッチテキスト・プログラム | 段落揃え（P2）・P1 品質（Undo 等）・仕様と実装の正本整理            | [`docs/specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)（実装パス一覧・P0/P1/P2）+ [`docs/specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)。**WP-004 Phase 3 とは別トラック** |
| リッチテキスト・プログラム | **Phase 5（表）** — スライス境界は `spec-richtext-enhancement.md` の「Phase 5（未着手）」を正とする。実装は境界確定後の **別スライス** | 同上 |
| WP-001（中長期） | **サイドバー「編集」カテゴリの情報密度** — ガジェット説明・既定折りたたみの見直し（1 スライス） | [`docs/ROADMAP.md`](ROADMAP.md) 順序 4。`gadgets-registry` / `gadgets-init`・各 `gadgets-*.js` のメタ |
| WP-001（中長期） | **ロードアウトプリセットとガジェット既定の整合** — 未配置ガジェット・重複カテゴリの整理（1 スライス） | [`js/loadouts-presets.js`](../js/loadouts-presets.js)、[`js/gadgets-loadouts.js`](../js/gadgets-loadouts.js) |
| WP-001（中長期） | **アシスト／メタ系ガジェットの発見性** — コマンドパレット・サイドバー検索とのラベル揃え（1 スライス） | `js/command-palette.js`、各ガジェット `title` / `description` |
| WP-001（中長期） | **執筆モード統合の事前整理（保存導線含む）** — `focus` 標準運用、`normal` 補助、保存 UI の常設/ガジェット境界を確定 | [`docs/specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) |
| 横断（将来） | **Wiki ワークフロー統合** — Reader / wikilink / グラフの導線をユーザー要望に応じ **1 トピック** で起票（[`docs/CURRENT_STATE.md`](CURRENT_STATE.md) 体感リスト） | `story-wiki.js`、`e2e/wikilinks.spec.js` 等 |
| **WP-005 スライスA** | ~~**分割ビュー edit-preview モード廃止 + 導線整理**~~（session 95 実施済み） | `js/split-view.js`, `js/app-ui-events.js`, `js/command-palette.js`, `index.html`, `css/style.css`, `electron/main.js` |
| **WP-005 スライスB** | ~~**MD プレビューのリッチプレビュー化**~~（session 96 実施済み） | `js/editor-preview.js`, `css/style.css` |
| **WP-005 スライスC** | ~~**比較ツールの隔離と拡張**~~（session 97 実施済み）— chapter-compare / snapshot-diff を比較ツールとしてコマンドパレット + サイドバー構造へ集約 | `js/split-view.js`, `js/command-palette.js`, `js/sidebar-manager.js`, `js/app-ui-events.js`, `index.html`, `js/electron-bridge.js` |

### WP-004 手動パック（リリース前・四半期）

- **手順の正本**: [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) のシナリオ 1〜5 と [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) の体感確認リスト。
- **完了時**: 実施日と結果（差分なし／あり・チケット番号）を `WP004_PHASE3_PARITY_AUDIT` の更新履歴に 1 行追記する。差分ありの場合は WP-004 本線で **1 トピック** に取り込む。

### deferred 手動確認 (user actor)

- **運用メモ（session 53）**: BL-002 / BL-004 / Focus 左パネル間隔はリポジトリ上は実装済み。コード変更が必要なのは **ユーザーが体感で問題を特定したとき** のみ → その時点で本表から **1 トピック** に昇格してスライス化する。
- **session 54**: 上記 deferred を **体感で再現した新規事象なし** とし、WP-001 専用スライスは **スキップ**（台帳の記録のみ）。
- **session 55**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 56**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 57**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 58**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 59**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 60**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 61**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 62**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 63**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。
- **session 64**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。WP-004 監査サイクルは自動層のみ実施（`WP004_PHASE3_PARITY_AUDIT` 更新履歴参照）。
- **session 65**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。次期プラン: WP-004 手動シナリオ記録・FR-007 Enter/Redo E2E・`ROADMAP` テスト数同期（`CURRENT_STATE` 参照）。
- **session 66**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。WP-004: MD プレビュー／Reader 本文の段落 typography CSS 整合 + E2E 1 件（`CURRENT_STATE`・`WP004_PHASE3_PARITY_AUDIT` 参照）。
- **session 67**: 同上。**新規再現なし** のため WP-001 専用スライスは **スキップ**（記録のみ）。別レーン: FR-007/008 E2E 拡張・ドキュメント・アーカイブ・中長期候補行・手動パック運用明文化・`test/hello.test.js` 削除（`CURRENT_STATE` 参照）。
- **session 68**: モード統合レーンを着手。Reader モードを廃止し再生オーバーレイへ移行、左サイドバー最小化・目次テンプレ挿入導線・ヘルプ任意参照導線を実装。mode/reader 関連 E2E 96 件 pass。
- **session 69**: `main` に FF マージ・リモート同期・フィーチャーブランチ削除。全 E2E **568 passed / 2 skipped**、`eslint js/` clean。`ROADMAP` / 台帳の用語を再生オーバーレイ前提に整理し、推奨スライス順を `CURRENT_STATE` と同期。
- **session 70**: [`docs/RECOMMENDED_DEVELOPMENT_PLAN.md`](RECOMMENDED_DEVELOPMENT_PLAN.md) を新設（正本リンク＋要約の入口）。`CURRENT_STATE` ドキュメント地図へ1行追加。
- **session 71**: 保存導線の未決を `spec-writing-mode-unification-prep` で確定（自動保存中心・手動保存はコマンド/ショートカット/ガジェット導線）。WP-004 は `reader-wysiwyg-distinction` に「再生オーバーレイ中も `data-ui-mode` 不変」回帰を追加して 14 件 pass。WP-001 次トピックは「アシスト／メタ系ガジェットの発見性」を選定。
- **session 72**: WP-001「アシスト／メタ系ガジェットの発見性」を実施（`command-palette` 検索語彙拡張 + ガジェット名語彙整合）。WP-004 はフォーカスモードでの再生オーバーレイ開閉時 `data-ui-mode` 維持の回帰を追加。`command-palette` + `reader-wysiwyg-distinction` 計 26 件 pass。deferred 体感トリガーは新規再現なし。
- **session 73**: WP-001「サイドバー『編集』カテゴリの情報密度」を実施（`edit` 説明を「装飾・プレビュー・画像」中心へ統一）。WP-004 は関連回帰 26 件 pass。deferred 体感トリガーは新規再現なし。次候補を「ロードアウトプリセットとガジェット既定の整合」に更新。
- **session 89**: 過剰テスト・デッドコード第二次クリーンアップ（ルート不要ファイル・`package.json` scripts・E2E spec 2 削除 2 統合・`docs/archive/` ログ統合）。**-19 テスト / -4 E2E ファイル**（566/65）。コード変更なしの別軸作業、WP-001 deferred は本セッション対象外。
- **session 90**: **WP-001 摩擦削減レーン closeout 宣言**。session 72〜88 で既知摩擦 11 件を消化完了、本表の候補列はすべて消化済。deferred 3 項目 (BL-002 / BL-004 / Focus 左パネル) は session 54〜89 の **36 セッション連続**で新規再現なし → 「closed unless re-reported」扱いに格上げ。以降 WP-001 は **監視モード**（ユーザーが体感で問題を特定した時点で 1 トピックに昇格）。以下 deferred 行は参照履歴として保持。
- **session 91**: **WP-001 復帰 → 再 closeout**。ユーザーが Electron ビルド手動確認中に Focus パネル UI の具体摩擦 6 件を特定 → 監視モードから 1 スライスで復帰消化。(#1) エッジホバー即応化 (DWELL=0/DISMISS=0) + トリガー範囲 y 全域拡張、(#2) Focus パネル overlay 化 (編集エリア push-out 回避)、(#3) セクション折りたたみ廃止 + 全展開ボタン除去、(#4) 「見出しがありません」メッセージ撤去、(#5) 下部 UI (目次コピー/テンプレ/カウンター) 撤去、(#6) 「新しい章」ボタンを章リスト直下へ移動。影響: `js/edge-hover.js` / `js/gadgets-sections-nav.js` / `js/chapter-list.js` / `css/style.css` / `index.html`。再ビルド完了 (`dist/`, `build/win-unpacked/`)。再 closeout: 監視モード維持。
- BL-002 改行効果切断の体感確認
- BL-004 Focus 半透明 hover の体感確認
- ~~Reader ボタンのスタイル一貫性~~ → session 49: フルツールバーの目アイコンをモードスイッチ Reader と同系色・ホバー・アイコン寸法に揃えた（`style.css`）
- Focus 左パネル間隔の体感確認

#### WP-001 deferred の簡易再現手順（次候補選定用）

- BL-002: 2行以上の本文に改行を含むアニメーション/装飾を適用し、改行位置で効果が切れず連続するかを確認
- BL-004: Focus へ切替後、上端 hover でヘッダー opacity が 0.35→1.0 の2段階で遷移するかを確認
- Focus 左パネル間隔: Focus で左端 hover → パネル表示時に本文列との間隔が詰まり/空き過ぎにならないか確認

#### deferred — コードベース観点の確認メモ（継続監査用）

実装の有無をリポジトリ上で確認した結果。**最終合否はユーザー体感（上記手順）が正**。

| 項目 | 確認先 | メモ |
|------|--------|------|
| BL-002 | `js/storage.js` 既定 `effectBreakAtNewline: true`、`js/editor-wysiwyg.js` で `!== false` 参照 | 実装済み。deferred は「体感で問題が残っていないか」の確認 |
| BL-004 | `css/style.css`（Focus ヘッダー・エッジホバー）、`js/edge-hover.js` | 実装済み。同上 |
| Focus 左パネル間隔 | レイアウト専用 E2E なし | 視覚確認が主。問題が出たら 1 トピックで `CURRENT_STATE` 更新付きで修正 |

## 解決済み（プロセス・台帳）

- **手動確認と次アクション選択の分離** — 正本は [`docs/INTERACTION_NOTES.md`](INTERACTION_NOTES.md)（手動確認の出し方）。オペレーション側は [`docs/OPERATOR_WORKFLOW.md`](OPERATOR_WORKFLOW.md)（Actor / 手動工程）。session 67 で「未反映」からここへ移動（運用遵守が正）。

## 解決済み (session 42-44)

- BL-001 Wiki 基準開発サイクル: wikilink → Reader 表示パス実装済み (reader-preview.js, e2e/wikilinks.spec.js)
- BL-002 改行効果切断: effectBreakAtNewline デフォルト true 実装済み (storage.js, editor-wysiwyg.js)
- BL-003 適用中エフェクト表示: _syncFormatState / _updateFormatIndicator 実装済み (editor-wysiwyg.js)
- BL-004 Focus 上部ヘッダー hover: 二段階 opacity (0.35→1.0) 実装済み (style.css). エッジグローフラッシュ追加 (session 44)
- BL-005 ドキュメント一括操作: チェックボックス選択 + 一括削除ボタン実装済み (gadgets-documents-hierarchy.js, gadgets-documents-tree.js)
- BL-006 サイドバーアコーディオン伸縮: _scheduleWritingFocusRender ガード追加 (sidebar-manager.js)

## 解決済み (session 37-40)

- Visual Audit スクリーンショットが重複して回帰シグナルにならない問題 → session 37 で実 UI フロー + 重複検出に改修
- Reader empty-state mismatch → session 37 で修正 (editor/document content fallback)
- Focus toolbar gap / left-panel overlap → session 37 で修正
- Reader return overlay → session 37 で修正
- E2Eテスト 42件の失敗 → session 39 で修正 (slim モード + viewport 外追従)
- Reader ボタンスタイル → session 49 でフルツールバー目アイコンをモードスイッチと同系に（残りは Focus 左パネル間隔ほか deferred）
- 装飾グループ + Canvas Mode hidden HTML 削除 → session 40 で完了 (-355行)
- WYSIWYG TB 最適化 (13→11ボタン + overflow) → session 40 で完了

## 開発スライスの進め方（推奨）

- **1 スライス = 1 トピック**（並行で複数の大きな変更をしない）
- **着手前**: 下記「次スライス候補」表と `[docs/ROADMAP.md](ROADMAP.md)` の「次スライス候補」を読み、**WP-004（パイプライン／Reader 経路）と WP-001（摩擦削減）のどちらか一方**に絞る
- **完了時**: `[docs/CURRENT_STATE.md](CURRENT_STATE.md)` の Snapshot・検証結果・地図／リンク集の整合を更新する（不変条件の変更は `INVARIANTS.md`）
- **WP-004 Phase 3**: プレビューと読者プレビューの差分は **1 件ずつ** 潰す。ガードは `[e2e/reader-wysiwyg-distinction.spec.js](../e2e/reader-wysiwyg-distinction.spec.js)`。監査台帳は [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)
- **用語・UI 状態**: `[docs/INTERACTION_NOTES.md](INTERACTION_NOTES.md)`。Reader は「読者プレビュー UI」と支援技術向け機能を混同しない

### マージ前チェックリスト（原則すべて。変更がなければ該当行はスキップ可）

各スライスをマージする前に、該当するものを更新する。

- [ ] [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) … Snapshot・検証結果・ドキュメント地図の整合。不変条件の変更があれば [`INVARIANTS.md`](INVARIANTS.md) も
- [ ] [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) の「セッション変更ログ」が肥大したら、古いセッション表を [`docs/archive/`](archive/) の `current-state-sessions-*.md` に巻き上げ、正本には直近数セッションのみ残す
- [ ] 「検証結果」が肥大したら [`docs/archive/`](archive/) の `current-state-verification-sessions-*.md` に巻き上げ、直近 2〜3 セッションのみ正本に残す
- [ ] [`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) … ユーザー向け機能に手を入れたら 1 行追加または「最終確認日」更新
- [ ] [`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) … E2E の責務境界が変わったら追記
- [ ] WP-004 のみ … [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) の「自動検証でカバー済み」または手動シナリオに一言

### 次スライス候補に行を追加するタイミング

WP-004 / WP-001 で表が空に近いときは、ROADMAP の WP-004／WP-001 UI 表（Phase 3 partial・カテゴリ再整理 todo 等）から **1 行** だけ候補として戻す。

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する