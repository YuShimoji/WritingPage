# ROADMAP — Zen Writer 機能強化ロードマップ

> 最終更新: 2026-06-25 / v0.3.36（WP-005 comparison isolation Slice C）

## ステータス語彙


| ステータス      | 意味                     |
| ---------- | ---------------------- |
| done       | 実装完了、E2Eあり             |
| partial    | 実装途中（Phase N/M 等で進捗明記） |
| todo       | 未着手                    |
| removed    | スコープ外（除外日を併記）          |
| superseded | 後継仕様に置き換え済み            |


## 現在の状態

- E2E: 全件数は `npx playwright test --list` で確認。最新スナップは `CURRENT_STATE`「検証結果」を正とする
- CI: GitHub Actions green
- コア機能: 95% 成熟
- ガジェット: built-in 25個 + Local Gadget Mod 3個（`MarkdownPreview` / `HUDSettings` / `PomodoroTimer`）。`UISettings` は日常設定、`EditorAdvancedSettings` は高度設定、`TextEffects` は統合済み
- 仕様書: spec-index.json に 56 エントリ (done 45, removed 10, superseded 1)
- 残 partial: spec-index 上の `partial` は 0。現行 roadmap 上の残論点は WP-004 Phase 3 と WP-001 中長期枠を別スライスで扱う
- ドキュメント権限: `CURRENT_STATE` / `USER_REQUEST_LEDGER` / `ROADMAP` / `FEATURE_REGISTRY` は active help cleanup 後の現行説明へ同期済み。2026-06-15 の WP-SAVELOAD-001 Editor Trust Vertical Slice は `CURRENT_STATE`、`USER_REQUEST_LEDGER`、`docs/EDITOR_TRUST_WORKFLOW.md`、詳細 verification `docs/verification/2026-06-15/editor-trust-vertical-slice.md` を入口とする。Latest preview/comparison proof は `wp005-comparison-isolation-slice-c`、verification は `docs/verification/2026-06-25/wp005-comparison-isolation-slice-c.md`。Latest Editor Trust product proof は `project-import-recovery-continuation-proof` / `docs/verification/2026-06-25/project-import-recovery-continuation-proof.md`。Project import safe failure signal は `0c21466 feat: clarify failed project import recovery` / `docs/verification/2026-06-24/project-import-safe-failure-signal.md`。Rich editing typed heading shortcut の product proof は `1e33e38 feat: add rich editing heading shortcut`、closure / review-dedup anchor は `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md`、placeholder/caret polish proof は `75726f9 fix: polish empty rich heading placeholder`。Import Roundtrip Hardening の baseline proof は `a56671b test: harden import roundtrip`
- 直近 done: WP-005 Slice C comparison isolation、WP-005 Slice B MD preview rich-preview activation、WP-005 Slice A preview entry cleanup、Project import recovery continuation proof、Project import safe failure signal、Rich heading closure checklist、Rich heading placeholder/caret polish、WP-SAVELOAD-001 Editor Trust Vertical Slice、Rich editing typed heading shortcut、First-use Save Help、Chapter Creation Daily Flow、Export Trust Proof、Save / Resume Trust Audit、Docs authority hygiene after active help cleanup、Active help mode wording cleanup、Local Gadget Mod migration lane closeout、`PomodoroTimer` Local Mod migration、PomodoroTimer Mod feasibility audit、`HUDSettings` Local Mod migration、`MarkdownPreview` Local Mod migration、Local Gadget Mod MVP、A3 Floating memo command palette限定実験（`db3b3df` として push 済み）、A2 daily writing proof、Writing UX map + A1 Floating memo reframe、right window drag handle invisible-drag fix、left nav / unified shell narrow fixes、SP-081(エディタ体験再構築), SP-080(JSONプロジェクト保存)
- スコープ整理 (2026-03-23): EPUB/DOCX/画像管理/Canvas/Google Keep/プラグイン正式化/サイドバーP2-3/長期ビジョン7件を除外

### 2026-04-30 現行ロードマップ（並列 2 レーン）

詳細な次スライス表は [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) を正とする。レーンは並列で管理するが、実装 PR / 作業単位は **必ず 1 トピック** に絞る。

| レーン | 状態 | 次の到達点 | 非対象 |
|--------|------|------------|--------|
| **Lane A: 無重力メモ / Floating memo lab** | A3 で command palette 限定の dev-only / experimental overlay として固定。A1 reframe と A2 daily writing proof で、本筋執筆 flow から隔離したまま邪魔にならないことを自動確認済み | 次に触る場合は正式化ではなく、実験としての有用性 review か新規 FAIL の局所修正 | editor / chapter / autosave 本流への接続、恒久保存、正式ガジェット化、loadout preset 接続 |
| **Lane B: ガジェット再整理 / Local Mod** | 標準 preset cleanup、B3 初回統合、Local Gadget Mod MVP、`MarkdownPreview` / `HUDSettings` / `PomodoroTimer` migration、migration lane closeout 済み | active migration queue は空。次は別の非 Mod 1 トピックへ移るか、新規体感摩擦・静的監査・Mod-first gate で 1 候補に絞れた時だけ再開する | 一括削除、未検証の custom loadout 破壊、Reader / Rich editing / Markdown source の二重化復活、Mod enable 状態を loadout に混ぜること、追加候補探索の常時タスク化 |
| **Watch: unified shell narrow fixes** | window drag / left nav / startup structure は closeout 済み | 新規 FAIL 報告時のみ局所修正 | 旧 top chrome / mode button / 上端 hover reveal の復活 |

#### Lane A: 無重力メモ / Floating memo lab

1. **A1 reframe — done**: Writing UX map を **Editor canvas > 保存/文字数 status > Documents/Sections > on-demand Gadgets > experimental memo** で固定し、memo は title / state / `DRAG` / textarea 枠を見せない read-only fragment + foreground borderless editor へ修正。既存 `e2e/floating-memo-lab.spec.js` の隔離・focus・touch 契約は維持。
2. **A2 保存安心感 / daily writing proof — done**: 起動→Rich editing 執筆→セクション確認→Reader 往復→memo lab 開閉の短いシナリオを `e2e/daily-writing-proof.spec.js` で固定。memo lab 中は status chip 非表示、閉じたら editor focus 復帰。保存/文字数 status は本筋の安心感として機能する。
3. **A3 command palette限定実験 — done**: `浮遊メモ実験` は command palette からだけ開ける「保存されない隔離実験 overlay」として固定。`?memoLab=1` は E2E / developer hook のまま。正式化、保存モデル、設定、正式 Gadget、loadout、Documents / Sections / autosave 接続は行わない。

#### Lane B: ガジェット再整理

1. **B1 usefulness audit**: 登録 gadget を `core / useful-default / advanced-hide / duplicate / delete-candidate` に再分類する。まず docs と static refs の監査に限定し、コード削除はしない。
2. **B2 default loadout cleanup**: daily writing に不要な gadget を標準 preset から外す。custom loadout からの明示利用は壊さない。
3. **Local Gadget Mod MVP — done**: `PluginManager` を設定モーダルの `ローカルMod` として追加し、manifest 上の local Mod を有効化できるようにした。`api.gadgets.register()` 経由の gadget は `source: 'plugin'` / `pluginId` を持つ。
4. **C2 information design audit / B3 follow-up — done**: 初回 B3 として `FontDecoration` / `TextAnimation` を `TextEffects` へ統合済み。`MarkdownPreview` と `HUDSettings` は built-in wrapper だけ Local Gadget Mod へ移動済み。`LoadoutManager` / `GadgetPrefs` は削除候補ではなく hide-by-default 維持。
5. **PomodoroTimer feasibility audit — done**: `PomodoroTimer` は個人用途寄りだが、標準 assist preset、専用 `e2e/pomodoro.spec.js`、HUD integration、`ZWGadgets.registerSettings()` を持つ。現行 Plugin API は `api.gadgets.registerSettings()` を公開していなかったため、次判断を API 追加込みの完全 Mod 化か built-in retain に絞った。
6. **PomodoroTimer Local Mod migration — done**: 小説執筆自体には不要な補助として標準 assist から外し、`api.gadgets.registerSettings()` を追加したうえで timer UI / settings UI を `pomodoro-timer-gadget` へ移動。engine / storage / HUD notification は built-in のまま維持。
7. **Local Gadget Mod migration lane closeout — done**: externalized set は `MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件で固定。`choice` は command plugin 維持、StoryWiki / LinkGraph / Images は preserve / contextual、LoadoutManager / GadgetPrefs は admin hide、TextEffects は contextual merged gadget。追加 migration は常時探索しない。

#### レーン間の依存・ゲート

- 無重力メモは **隔離 overlay** のまま進めるため、ガジェット再整理の loadout / sidebar 契約には接続しない。
- ガジェット再整理は daily writing surface の摩擦低減を優先し、memo lab の見た目実験をブロックしない。
- どちらのレーンも Reader / command palette / left nav root-category の現行状態モデルを壊さない。
- 実装完了ごとに `CURRENT_STATE`、仕様や不変条件が変わる場合は `INVARIANTS` / `INTERACTION_NOTES` / `GADGETS` を同期する。

### 2026-06-15 writing trust lane

WP-SAVELOAD-001 Editor Trust Vertical Slice remains the broad writing trust proof. The latest narrow Editor Trust product proof is `project-import-recovery-continuation-proof`: after invalid JSON import failure, the focused E2E now proves the current editor remains usable, continuation text can be written, and reload/resume preserves that continuation. The previous safe-failure signal remains `0c21466 feat: clarify failed project import recovery`. Rich editing typed heading shortcut remains done as a separate limited trigger; do not reopen chapter creation, first-use help, export trust, import trust, typed heading shortcut, Project import recovery, or Rich heading unless a new failure appears.

WP-SAVELOAD-001 corrected two trust issues that directly affected reload confidence: close / reload no longer overwrites a chapterMode document with no chapters using empty assembled text, and non-blocking IDB initialization no longer overwrites an already loaded runtime docs cache with stale IDB records. It also makes save failure visible through `#writing-status-chip[data-save-state="failed"]` and a `保存失敗` notification.

Save / Resume Trust Audit と Export Trust Proof により、作家が日常的に使う「書く→保存確認→Documents で見つける→閉じて戻る→TXT / JSON で外に出す」は最小信頼を得た。TXT / JSON は download event ではなく実ファイル内容まで検査済みで、JSON は `document.id/name/content/pages` と読み込み roundtrip の最小範囲を固定している。

First-use Save Help では、初回空状態、Documents、writing status chip、入出力 menu に短い補助だけを追加し、本文と章構造はこの端末に自動保存され、保存状態は画面下、TXT/JSON 書き出しは外部退避、JSON 読み込みは戻す導線と読めるようにした。

Remote sync and cross-terminal handoff is recorded in `docs/verification/2026-06-04/remote-sync-cross-terminal-handoff.md`. Restart on another terminal by pulling `main`, confirming `HEAD...origin/main = 0 0`, then reading `CURRENT_STATE` -> `INVARIANTS` -> `INTERACTION_NOTES`.

Issue #118 / PR #119 meta-review is recorded in `docs/verification/2026-06-05/issue-118-pr-119-meta-review.md`. PR #119 is not a roadmap authority for embed security; it is a stale branch carrying SP-073 PathText freehand drawing already present on `main`, and must not be merged or used as the starting branch for Issue #118.

Remote sync after GitHub artifact authority correction is recorded in `docs/verification/2026-06-05/remote-sync-after-github-artifact-authority-correction.md`. Current `main` / `origin/main` are synchronized at `c272503`, and GitHub cleanup remains non-blocking bookkeeping rather than product progress.

Rich editing typed heading shortcut implementation handoff is recorded in `docs/verification/2026-06-08/rich-editing-heading-shortcut-handoff.md`, and the current closure / review-dedup anchor is `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md`. Current behavior is intentionally narrow: typed line-start `#`, `##`, or `###` followed by Space only, no paste/import/source/round-trip shortcut expansion, no generic Markdown shortcut engine. Do not reopen IME / direct shortcut / empty heading placeholder review unless there is new evidence, a changed target axis, a suspected regression, or an explicit user-requested recheck.

次は、初回説明・章作成・JSON 書き出し・JSON 読み込み・typed heading shortcut そのものではなく周辺の摩擦を別スライスで選ぶ。古い仕様表を正本へ寄せる場合は stale spec reconciliation として分ける。WP-004 parity pack は新しい preview / Reader 差分が出た時の user-actor release gate として扱う。

### 次スライス候補 (WP-004 / WP-001 / writing trust)

詳細は [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の表を正とする。実装時は **1 トピック** に絞る。

- **進め方（推奨）**: 台帳の「開発スライスの進め方（推奨）」に従い、スライス完了ごとに `CURRENT_STATE` を更新する
- **WP-004**: ~~パイプライン差分の E2E 固定~~（session 46 済）。~~Reader 導線の文言・`aria-*` 統一~~（session 46 前後）。~~Phase 3 本線（ジャンルプリセット・シナリオ5 の style 1 項目）~~（session 76: `reader-genre-preset` に computed style 1 件）。typography 等の残差・手動パックは [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) に従う（読者確認は **再生オーバーレイ** 経路）
- **WP-001**: ~~コマンドパレットのモード切替後フォーカス~~（session 46 済）。~~狭幅ツールバー折り返し・余白~~（session 48: CSS + geometry E2E 強化）。~~アシスト／メタ系ガジェットの発見性~~（session 72 実施）。~~サイドバー「編集」カテゴリの情報密度~~（session 73: カテゴリ見出し）。~~ロードアウトプリセットとガジェット既定の整合~~（session 75 実施）。~~編集カテゴリの個別ガジェット説明（B1）~~（session 84 実施）。~~他カテゴリ（assist / advanced）のガジェット説明整理~~（session 86 実施）。~~assist/advanced のコマンドパレット導線（`gadget-assist` / `gadget-advanced` + E2E）~~（session 88 実施）。~~Focus パネル UI 摩擦 6 件（エッジホバー即応化 + overlay 化 + セクション折りたたみ廃止 + 見出しメッセージ撤去 + 下部 UI 撤去 + 「新しい章」ボタン配置）~~（session 91 実施、Electron 再ビルド完了）。**ステータス（session 91）**: 監視モードで 1 件復帰消化後、再び監視モードへ。**ユーザーが体感で新規の摩擦を特定した時のみ** 1 トピックに昇格してスライス化する
- **WP-005（session 94 起票）**: プレビュー・比較ツール再設計。スライスA/B/C は done: 分割ビュー比較の公開入口を退避し、MD プレビューを実表示の rich-preview surface として戻し、比較 route を command palette / sidebar / MD preview / Reader から隔離した。将来比較を扱う場合は専用比較 surface または別ファイル比較として新規に選定する。詳細は [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の WP-005 行
- **中期（別起票）**: ブロック段落の左・中・右揃え — `[docs/specs/spec-rich-text-paragraph-alignment.md](specs/spec-rich-text-paragraph-alignment.md)`（**WP-004 ではなく** `[docs/specs/spec-richtext-enhancement.md](specs/spec-richtext-enhancement.md)` のリッチテキスト・プログラム P2 として起票・優先度付けする）

---

## Priority A: 執筆体験の基盤

実用的な小説執筆ツールとしての核心部分。最優先。

### A-1. モードアーキテクチャ (SP-070) -- done

**現行（session 68 以降）**: UI モードは内部互換の **`normal` / `focus`** に限定。読者視点の確認は UI モードではなく **再生オーバーレイ**（`data-reader-overlay-open` 等）で行う。公開 UI は session 121 以降、command palette / left nav / replay surface / window controls island を主語にする。

**歴史（Phase 1〜3 当時）**: 旧 multi-mode 分離として実装された後、SP-081・session 68 で上記に収斂。

- CSS 分離（Focus: ChapterList パネル、エッジホバー復帰は Focus ヘッダー等で継続）
- ショートカット（Ctrl+Shift+F / B、Esc 復帰）
- Focus ChapterListスタブ（SectionsNavigatorデータ共有）
- Focusオーバーレイアクセス（設定ボタン → サイドバースライドイン）
- SP-071 ChapterList Phase 1 実装
- SP-071 Phase 2（章ごと独立保存 — chapter-store.js 実装済み）
- Phase 2: ChapterStore統合ガード（undoスタック章分離、モード遷移前flush）
- Phase 3: Focusパネルリサイズ（pointer events + localStorage保存）

### A-2. チャプター管理再設計 (SP-071) -- done

Novlr式2ペイン章管理。SP-070 Focusモードの主要UI。

- 左パネルにチャプターリスト、右にエディタ
- 見出し自動検出 → チャプターリスト表示
- クリックナビゲーション
- ダブルクリックリネーム
- 右クリックコンテキストメニュー（リネーム/複製/移動/削除）
- ドラッグ&ドロップ並び替え
- 「+ 新しい章」ボタン
- アクティブ章ハイライト + 文字数表示
- Phase 2: 章ごと独立保存 (documents ストアに type:'chapter' + IDB フラッシュ機構)
- 目次ページ自動生成 (SP-071 Phase 3 + SP-072連動)

### A-3. セクションリンク & インタラクティブナビ (SP-072) -- done (100%)

章末ナビ自動挿入 + ゲームブック的インタラクティブリンク。

- Phase 1: 章末ナビ自動挿入 (前へ / 目次 / 次へ)
- Phase 2: 章visibility設定 + export変換
- Phase 3: リンク挿入モーダルUI + 壊れリンク警告
- Phase 4: 外部リンク新規タブ確認 (target="_blank" + .external-link + URLバリデーション)
- Phase 5: ゲームブック分岐UI (data-style属性方式 + 3層CSS + スタイル選択UI + 自動グループ化+区切り線。エフェクト転用は将来拡張)

### A-4. Editor モード UX 統合改善 (SP-071 Phase 3) -- done

chapterMode デフォルト化 + 文字数精度統一 + ロールバック UI + Legacy 変換バナー。

- Step 1: 新規ドキュメントを chapterMode で作成
- Step 2: chapterMode ロールバック UI (「章モードを解除」ボタン)
- Step 3: 文字数を countPlainChars() に統一 (DSL/見出し/装飾記法を除外)
- Step 4: Legacy ドキュメントに「新フォーマットに変換」バナー表示

### A-5. エディタ体験再構築 (SP-081) -- done

chapterMode 一本化 + legacy display state 廃止 + setUIMode 全経路統一 + 再生オーバーレイ統合。Phase 1-4 全完了 (session 30-34)。

- Phase 1: レガシー章管理削除 (-254行)、chapterMode一本化
- Phase 2: メインツールバーの不要ボタン非表示
- Phase 3: legacy display state 完全除去、エッジグロー、setUIMode全経路統一
- Phase 4: setUIMode force パラメータ、サイドバー永続化、Reader aria-pressed修正

### A-6. UI/UX 磨き上げ (残タスク)

- px→rem段階移行 -- done (Phase 1: font-size+CSSカスタムプロパティ+JS setProperty / Phase 2: padding+margin / Phase 3: width+height+gap+border-radius+JS静的値)

### A-4 完了済み

- `[BUG]` エディタスクロールバグ -- done
- コンテキストツールバーの操作感改善 -- done (現状問題なし)
- サイドバーのナビゲーション最適化 -- done (SP-052 Phase 1+2)
- サイドバー情報密度の整理 -- done
- サイドバー品質改善 -- done
- エディタの入力体験改善 -- done (タイプライターモード/プリフォーマット等)
- テーマ一貫性 CRITICAL群 -- done (CSS変数14種+JS硬コード色30箇所)
- テーマ一貫性 HIGH/MEDIUM群 -- done (global-search-ui/link-graph/keybind/swiki/command-palette/gadget-*/mini-hud)
- デッド参照根絶 -- done (旧パネル参照→MainHubPanel統一, Escape統合, デッドCSS/メソッド削除)
- サイドバー間接委譲→直接API化 -- done
- フローティングパネルのドラッグ対応 -- done (pointer events + 3px閾値 + タッチ対応)
- レスポンシブUI改善 -- done (タップターゲット44px + モバイル6件修正)
- アニメーション/トランジション -- done (モーダル/パネルフェードイン + reduced-motion対応)

---

## Priority B: 表現力拡張

ポストモダン文学・Web小説・ビジュアルノベルの表現に必要な機能。

### B-1. Web小説演出統合 (SP-074) -- done

テクスチャオーバーレイ / タイピング演出 / ダイアログボックス / スクロール連動 / SE / ジャンルプリセット。
SP-062 (テキスト表現アーキテクチャ) 基盤上に構築。Phase 1-6 全完了。

### B-2. パステキスト (SP-073) -- done (100%)

ベジェ曲線・円弧・フリーハンド曲線に沿ったテキスト配置。SVG textPath使用。
Phase 1-4全完了。DSL+SVGレンダリング、WYSIWYG制御点ハンドルUI、プリセットパス7種+右クリックメニュー、フリーハンド描画(RDP簡略化+ベジェ近似)。E2E 27件。

### B-3. Typography進化トラック

- Phase 0-2: done (フォント切替 / 見出し / マイクロタイポグラフィ)
- Phase 3: SP-059 日本語組版・ルビ拡張（傍点・圏点） -- done
- Phase 4: SP-060 装飾プリセット統合 -- done
- Phase 5: SP-061 Visual Profile Typography Pack -- done

### B-4. 既存機能の完成

#### Wiki/グラフビュー (SP-050)

- グラフビュー統合 -- done (力学レイアウト/カテゴリ色分け/凡例/ノードクリック遷移)
- バックリンクUI統合 -- done (詳細ペイン内/Story Wiki+Doc+現在/別名対応)
- AI生成 -- done (テンプレート+OpenAIハイブリッド/設定UI/下書きボタン)
- `[[wikilink]]` 構文の自動パース -- done
- `doc://` リンクのパースバグ修正 -- done (Issue #1, 2026-03-16 解決済み)
- 高度な自動検出(形態素解析) -- done (kuromoji.js IPAdic辞書、ZenMorphology共通モジュール)

#### ~~WYSIWYG テキストアニメーション~~ -- スコープ外 (2026-03-23)

- ~~リアルタイムプレビュー~~ -- Q3静的プレビューで代替
- ~~タイムラインコントロールUI~~ -- 動画エディタ的スコープ

#### テキストボックス (SP-016) -- done/100%

#### ~~Canvas Mode (SP-056)~~ -- スコープ外 (2026-03-23。元deferred/30%, betaEnabled: false)

### ~~B-5. 画像管理~~ -- スコープ外 (2026-03-23)

- ~~ドラッグ&ドロップでの位置調整~~
- ~~画像フィルタ/レイヤ機能~~ -- 画像エディタ的スコープ

---

## Priority C: エコシステム & 拡張性

外部連携とカスタマイズ性の拡充。

### C-1. ドックパネルシステム (SP-076) -- done (100%)

上下左右へのパネルドッキング。Editorモード専用。
Phase 1-4 全完了。Phase 4: ドックレイアウトプリセット (captureLayout/applyLayout API、LoadoutManager統合、全プリセットにdockLayout定義)。top/bottomドックはスコープ外。E2E 45件+preset spec。

### ~~C-2. Google Keep 双方向連携 (SP-075)~~ -- スコープ外 (2026-03-23)

### C-3. ガジェット整理 -- done (WP-002)

Session 19 (2026-03-23) で33→28に整理完了。削除: Clock/Samples/NodeGraph/GraphicNovel。無効化: UIDesign/SceneGradient。graphic-novelロードアウト削除。MarkdownReferenceを全ロードアウトのassistに配置。ヘルプモーダルからリファレンス機能を分離。

- ガジェット利用状況分析
- 不要ガジェット削除/無効化 (33→28)
- ロードアウトプリセット見直し

### ~~C-4. サイドバー Phase 2-3~~ -- スコープ外 (2026-03-23)

- ~~ドラッグ&ドロップによるガジェット並び替え~~ -- SP-076で代替
- ~~ガジェット間通信の基盤整備~~ -- ユースケース不明

### ~~C-5. プラグインシステム正式化~~ -- スコープ外 (2026-03-23)

- 現行のmanifest駆動ローカルプラグインローダーで十分機能中

---

## Priority D: エクスポート刷新

必要時に対応。ブラウザ印刷で最低限のPDF出力は可能。

- PDF エクスポート -- done (ブラウザ印刷APIで動作中)
- ~~EPUB エクスポート~~ -- スコープ外 (2026-03-23)
- ~~DOCX エクスポート~~ -- スコープ外 (2026-03-23)
- ~~ワークスペース一括書き出し~~ -- スコープ外 (2026-03-23)
- ~~プラットフォーム別対応マトリクスの明文化~~ -- スコープ外 (2026-03-23。APP_SPECIFICATION.mdに記載済み)

## Priority E: ストレージ基盤刷新

- IndexedDB 移行 -- done (SP-077)。ドキュメント/アセット/スナップショット/Wiki/ノードグラフ全移行完了
- SP-071 Phase 2 (章ごと独立保存) -- done (documents ストア + IDB フラッシュ)
- SP-080 JSONプロジェクト保存 -- done (session 27。exportProjectJSON/importProjectJSON + Electronメニュー統合)
- クラウド同期基盤 -- todo (将来。IDB基盤は整備済み、具体的な同期先は未定)

### クラウド同期（別レーン方針・2026-04-07）

- **現状**: 実装スパイクはトランクでは未着手。同期先プロバイダ・認証モデル・オフライン競合解決はプロダクト判断が必要。
- **非ゴール（当面）**: 特定 SaaS への早期ロックイン、または UI なしのバックグラウンド同期のみの先行実装は行わない（設計合意まで `todo` のまま据え置き）。
- **起票の目安**: ユーザー要望またはリリース戦略が固まった時点で 1 スライス（調査のみ / PoC）として `USER_REQUEST_LEDGER` に明示行を追加する。

### クラウド同期 PoC 最小仕様（session 86 ドラフト）

- **目的**: 「単一端末内の自動保存」前提を壊さず、複数端末利用時の復旧性と継続性を検証する。
- **方式候補（比較）**
  - **A. JSONスナップショット同期**: ドキュメント単位で JSON を丸ごと送受信。実装は最小だが競合解決が粗い。
  - **B. ドキュメント単位差分同期（推奨PoC）**: `documentId` ごとに更新単位を固定。競合時はドキュメント単位で分岐保存しやすい。
  - **C. 操作ログ同期（CRDT/OT系）**: 将来拡張性は高いが現段階では過剰投資。
- **PoCで採用する前提**
  - 方式Bを基準に、`updatedAt` と `clientId` を使った **Last-Write-Wins + 競合時複製** を実装候補とする。
  - 競合時は自動マージせず、`<docName> (conflict yyyy-mm-dd hh:mm)` を生成してデータ消失を回避する。
- **PoC完了条件（最小）**
  - 2端末想定で「同一ドキュメント編集」「オフライン復帰」「競合発生」の3ケースで消失ゼロ。
  - 失敗時にローカルスナップショットへ確実にロールバックできること。
  - セキュリティ要件（`SECURITY.md`）に沿った認証情報の非ハードコードと通信路保護方針を明文化。

---

## WP-004／WP-001 UI ロードマップ（実装順の目安）

WP-004（Reader-First WYSIWYG）と Normal サイドバー簡素化は並行可能だが、**用語・状態モデル**は先に一本化する（`docs/INTERACTION_NOTES.md` の「Zen Writer UI 状態モデル」節）。


| 順序  | トラック   | 内容                                                                                       | 状態      |
| --- | ------ | ---------------------------------------------------------------------------------------- | ------- |
| 0   | 共通     | 編集面 × UI モードの用語表・ラベル・コマンドパレット文言                                                          | done    |
| 1   | WP-001 | Normal サイドバー段階的開示（セクション/構造の既定折りたたみ、編集カテゴリ内ヒント）                                           | done    |
| 2   | WP-004 | Phase 2: 既定編集面・モード復帰ポリシー（`INTERACTION_NOTES` 明文化 + オーバーレイ終了時の復帰正規化 + 復帰後フォーカス）              | done    |
| 3   | WP-004 | Phase 3: **再生オーバーレイ** と編集のレンダリング経路の近接化（`ZWPostMarkdownHtmlPipeline`・章リンク正規化修正・typography 等は継続） | partial |
| 4   | WP-001 | カテゴリ統合・ガジェット既定の再整理（中長期）                                                                  | todo    |


回帰: `e2e/reader-wysiwyg-distinction.spec.js`（**再生オーバーレイ表示中**にメイン編集を隠す／WYSIWYG 切替で `data-ui-mode` は `normal`/`focus` のまま）。

---

## 長期ビジョン (実績のみ)

- グラフビジュアライゼーションUI -- done (SP-050 Phase 2 Step 1: 力学レイアウト/カテゴリ色分け)
- AI連携 -- done (Wiki生成: SP-050 Step 3。テンプレート+OpenAIハイブリッド)

以下は 2026-03-23 にスコープ外として整理。

~~コラボレーション編集~~ / ~~Embed SDK v2~~ / ~~TypeScript段階移行~~ / ~~スペルチェック~~ / ~~ビジュアルテーマビルダー~~ / ~~ルビ自動付与~~ / ~~AI要約/シーンアイデア生成~~
