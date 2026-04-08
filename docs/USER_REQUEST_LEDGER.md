# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WP-001 UI 磨き上げ・摩擦軽減の継続 (session 34 で着手、方向はユーザー判断)
- デッドコード寄りのリソースは積極的に削除する (session 39 ユーザー指示)
- 意思決定・手動確認地点で区切りを設け、プランを提示する

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

### 次スライス候補（WP-004 / WP-001、1 トピックずつ選定）

- **リッチテキスト・書式の改行まわり（将来）**: 現状は **改行で書式／装飾が切れる** のが仕様（`effectBreakAtNewline` 既定 true、BL-002）。**decor 持続**（`effectPersistDecorAcrossNewline`）は Enter 接続済み・WYSIWYG **ショートカット割当済み**（session 57）。残りは **設定 UI** や **`effectBreakAtNewline` 側**の切替などを 1 スライスで検討。

| 軸             | 候補                                           | 備考                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP-004        | ~~Reader と MD プレビューの HTML パイプライン差分の監査~~      | session 46 で E2E 拡張 + `convertForExport` 修復済み。継続は差分発見時に追記                                                                                                                                                                               |
| WP-004        | ~~WYSIWYG 既定オフ時の Reader 導線の文言・`aria-*` の統一~~ | `index.html` / `reader-preview.js` / コマンドパレット説明文で統一（本セッション）                                                                                                                                                                             |
| WP-001        | ~~コマンドパレットからのモード切替後のフォーカス遷移~~                | session 46 で実装・E2E 済み                                                                                                                                                                                                                   |
| WP-001        | ~~狭幅時ツールバー折り返し後の余白~~                         | `style.css` 768px 以下の折り返し・transition 調整、`toolbar-editor-geometry` で `--toolbar-height` 一致＋コンパクト狭幅を追加（session 48） |
| WP-004        | Phase 3 継続（preview / **再生オーバーレイ** のレンダリング近接）       | [`docs/ROADMAP.md`](ROADMAP.md) 表参照。差分の列挙・手動シナリオは [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。**1 件ずつ** 修正、`reader-wysiwyg-distinction.spec.js` で監視 |
| WP-001        | 摩擦削減の次トピック                                   | 下記 deferred・ユーザー要望から **1 件** 選定（表が正） |
| リッチテキスト・プログラム | 段落揃え（P2）・P1 品質（Undo 等）・仕様と実装の正本整理            | [`docs/specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)（実装パス一覧・P0/P1/P2）+ [`docs/specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)。**WP-004 Phase 3 とは別トラック** |
| リッチテキスト・プログラム | **Phase 5（表）** — スライス境界は `spec-richtext-enhancement.md` の「Phase 5（未着手）」を正とする。実装は境界確定後の **別スライス** | 同上 |
| WP-001（中長期） | **サイドバー「編集」カテゴリの情報密度** — ガジェット説明・既定折りたたみの見直し（1 スライス） | [`docs/ROADMAP.md`](ROADMAP.md) 順序 4。`gadgets-registry` / `gadgets-init`・各 `gadgets-*.js` のメタ |
| WP-001（中長期） | **ロードアウトプリセットとガジェット既定の整合** — 未配置ガジェット・重複カテゴリの整理（1 スライス） | [`js/loadouts-presets.js`](../js/loadouts-presets.js)、[`js/gadgets-loadouts.js`](../js/gadgets-loadouts.js) |
| WP-001（中長期） | **アシスト／メタ系ガジェットの発見性** — コマンドパレット・サイドバー検索とのラベル揃え（1 スライス） | `js/command-palette.js`、各ガジェット `title` / `description` |
| WP-001（中長期） | **執筆モード統合の事前整理（保存導線含む）** — `focus` 標準運用、`normal` 補助、保存 UI の常設/ガジェット境界を確定 | [`docs/specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) |
| 横断（将来） | **Wiki ワークフロー統合** — Reader / wikilink / グラフの導線をユーザー要望に応じ **1 トピック** で起票（[`docs/CURRENT_STATE.md`](CURRENT_STATE.md) 体感リスト） | `story-wiki.js`、`e2e/wikilinks.spec.js` 等 |

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