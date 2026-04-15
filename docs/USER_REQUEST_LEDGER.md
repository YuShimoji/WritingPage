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