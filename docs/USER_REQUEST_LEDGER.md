# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WP-001 UI 磨き上げ・摩擦軽減の継続 (session 34 で着手、方向はユーザー判断)
- デッドコード寄りのリソースは積極的に削除する (session 39 ユーザー指示)
- 意思決定・手動確認地点で区切りを設け、プランを提示する

## 未反映の是正要求

- 手動確認と次アクション選択を分離する (INTERACTION_NOTES に明記済み)

## Backlog Delta

### 既存 Backlog

- ~~`docs/FEATURE_REGISTRY.md` 作成~~ → session 45 でテンプレート追加済み（随時行を追加）
- ~~`docs/AUTOMATION_BOUNDARY.md` 作成~~ → session 45 でテンプレート追加済み

### 次スライス候補（WP-004 / WP-001、1 トピックずつ選定）

- **リッチテキスト・書式の改行まわり（将来）**: 現状は **改行で書式／装飾が切れる** のが仕様（`effectBreakAtNewline` 既定 true、BL-002）。**decor 持続**（`effectPersistDecorAcrossNewline`）は Enter 接続済み・WYSIWYG **ショートカット割当済み**（session 57）。残りは **設定 UI** や **`effectBreakAtNewline` 側**の切替などを 1 スライスで検討。

| 軸             | 候補                                           | 備考                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP-004        | ~~Reader と MD プレビューの HTML パイプライン差分の監査~~      | session 46 で E2E 拡張 + `convertForExport` 修復済み。継続は差分発見時に追記                                                                                                                                                                               |
| WP-004        | ~~WYSIWYG 既定オフ時の Reader 導線の文言・`aria-*` の統一~~ | `index.html` / `reader-preview.js` / コマンドパレット説明文で統一（本セッション）                                                                                                                                                                             |
| WP-001        | ~~コマンドパレットからのモード切替後のフォーカス遷移~~                | session 46 で実装・E2E 済み                                                                                                                                                                                                                   |
| WP-001        | ~~狭幅時ツールバー折り返し後の余白~~                         | `style.css` 768px 以下の折り返し・transition 調整、`toolbar-editor-geometry` で `--toolbar-height` 一致＋コンパクト狭幅を追加（session 48） |
| WP-004        | Phase 3 継続（preview / 読者プレビューのレンダリング近接）       | [`docs/ROADMAP.md`](ROADMAP.md) 表参照。差分の列挙・手動シナリオは [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。**1 件ずつ** 修正、`reader-wysiwyg-distinction.spec.js` で監視 |
| WP-001        | 摩擦削減の次トピック                                   | 下記 deferred・ユーザー要望から **1 件** 選定（表が正） |
| リッチテキスト・プログラム | 段落揃え（P2）・P1 品質（Undo 等）・仕様と実装の正本整理            | [`docs/specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)（canonical paths・P0/P1/P2）+ [`docs/specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)。**WP-004 Phase 3 とは別トラック** |


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
- **完了時**: `[docs/CURRENT_STATE.md](CURRENT_STATE.md)` の Snapshot・「この時点で信頼できること」・検証コマンドを更新する
- **WP-004 Phase 3**: プレビューと読者プレビューの差分は **1 件ずつ** 潰す。ガードは `[e2e/reader-wysiwyg-distinction.spec.js](../e2e/reader-wysiwyg-distinction.spec.js)`。監査台帳は [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)
- **正本**: UI 状態は `[docs/INTERACTION_NOTES.md](INTERACTION_NOTES.md)`。Reader は「読者プレビュー UI」と支援技術向け機能を混同しない

### スライス完了時チェックリスト（必須に近い運用）

各スライスをマージする前に、該当するものを更新する。

- [ ] [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) … Snapshot（セッション番号・直近スライス）・検証コマンド・必要なら「信頼できること」
- [ ] [`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) … ユーザー向け機能に手を入れたら 1 行追加または「最終確認日」更新
- [ ] [`docs/AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) … E2E の責務境界が変わったら追記
- [ ] WP-004 のみ … [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) の「自動検証でカバー済み」または手動シナリオに一言

### 次スライス候補に行を追加するタイミング

WP-004 / WP-001 で表が空に近いときは、ROADMAP の WP-004／WP-001 UI 表（Phase 3 partial・カテゴリ再整理 todo 等）から **1 行** だけ候補として戻す。

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する