# WP-004 Phase 3 — preview / Reader HTML 整合（監査台帳）

> 目的: MD プレビューと読者プレビューの **パイプライン直前〜適用後** の差分を追跡し、1 件ずつ E2E または仕様で固定する。  
> スライス運用: `[docs/USER_REQUEST_LEDGER.md](USER_REQUEST_LEDGER.md)`「開発スライスの進め方」。パイプライン整合の主 E2E: `[e2e/reader-wysiwyg-distinction.spec.js](../e2e/reader-wysiwyg-distinction.spec.js)`。

## アーキテクチャ（2026-04 時点）


| 段階                | コンポーネント                                                                                                         | 備考                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Markdown→素 HTML   | `[js/zw-markdown-it-body.js](../js/zw-markdown-it-body.js)` `ZWMdItBody.renderToHtmlBeforePipeline`             | preview は `editorManager` 渡しで `_markdownRenderer` 共用。Reader は `richTextEditor.markdownRenderer` または共有フォールバック |
| 後処理               | `[js/zw-postmarkdown-html-pipeline.js](../js/zw-postmarkdown-html-pipeline.js)` `surface: 'preview' | 'reader'` | Reader のみ最終 `convertForExport`                                                                               |
| インライン記法           | `[js/zw-inline-html-postmarkdown.js](../js/zw-inline-html-postmarkdown.js)`                                     | wikilink / 傍点 / ルビ                                                                                           |
| Reader 専用 DOM 後処理 | `[js/reader-preview.js](../js/reader-preview.js)` `injectToc` / `injectNavBars` 等                               | 本台帳の「パイプライン出力」とは別層（FR-003 の境界はパイプラインまで）                                                                      |


## 自動検証でカバー済み（列挙）


| 観点                                                                                                                                                                                                                                       | テスト（概要）                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| chapter:// → preview `.chapter-link` / reader `#`                                                                                                                                                                                        | `reader-wysiwyg-distinction`                                                         |
| 複数見出し MD + `chapter://` 相互リンク（パイプライン層・監査シナリオ1）                                                                                                                                                                                           | 同上（章末ナビ注入は別層のため本テストの対象外）                                                             |
| `|漢字《かな》` ルビ preview=reader                                                                                                                                                                                                              | 同上                                                                                   |
| `:::zw-typing` / `:::zw-dialog` ブロック内の `|漢字《かな》` ルビ（監査シナリオ3・基本パス）                                                                                                                                                                        | 同上                                                                                   |
| `:::zw-textbox` 複合（preset・tilt・anim + `[italic]…[/italic]`、監査シナリオ2）                                                                                                                                                                      | 同上                                                                                   |
| `[bold]…[/bold]` 装飾（ZWMdItBody 経由）preview=reader                                                                                                                                                                                         | 同上                                                                                   |
| wikilink / 傍点                                                                                                                                                                                                                            | 同上                                                                                   |
| 存在しない Wiki への `[[…]]`（`is-broken`・監査シナリオ4・パイプライン層）                                                                                                                                                                                       | 同上                                                                                   |
| Reader 壊れ wikilink クリック → ポップオーバー（未登録語の説明・外クリックで閉じる）                                                                                                                                                                                     | `reader-wikilink-popover.spec.js`                                                    |
| Reader 本文への章末ナビ注入（`chapterNav.enabled`・複数章 chapterMode・`.chapter-nav-bar`）                                                                                                                                                               | `reader-chapter-nav.spec.js`（結合層。パイプライン層の E2E とは別）                                   |
| UI モードと WYSIWYG 切替                                                                                                                                                                                                                       | 同上                                                                                   |
| ジャンルプリセット（Reader 専用 UI）— `#reader-preview-inner` への `genre-*` クラス付与 + **シナリオ5 代表1項目**: `genre-adv` 時 `.zw-dialog` の computed `background`（`css/style.css` と整合）                                                                           | `reader-genre-preset.spec.js`（`GenrePresetRegistry` + `getComputedStyle`。ピクセル比較はしない） |
| P2: `data-zw-align` がパイプライン後も残り、MD プレビュー・Reader 本文で `text-align` が投影される                                                                                                                                                                  | `reader-wysiwyg-distinction.spec.js`                                                 |
| 段落 typography（session 66）: `--paragraph-spacing` / `--paragraph-indent` / `--body-letter-spacing` が MD プレビュー（2 段落目）と Reader 本文（2 段落目）で同一 computed style。先頭段落の字下げ解除を `#markdown-preview-panel` に Reader（`.reader-preview__inner`）と同一規則で適用 | `reader-wysiwyg-distinction.spec.js`                                                 |


## 手動で並べる価値があるシナリオ（差分チケット用）

以下は **原稿の組み合わせ** で初めて出る差分がありうるため、リリース前またはスライス単位で MD プレビューと Reader を並べて確認する。

1. **chapterMode 複数章** + 章末ナビ + `chapter://` 相互リンク
  - **脚注**: **パイプライン層**では複数 `#` 見出し + `[t](chapter://…)` の preview/reader 整合（`data-chapter-target` 付与・reader で `chapter://` 非残留・章リンク以外の HTML 正規化一致）を E2E 済み。**章末ナビの DOM 注入**（[js/reader-preview.js](js/reader-preview.js) / [js/chapter-nav.js](js/chapter-nav.js)）は別層。**Reader 内で `.chapter-nav-bar` が注入される最小結合**は [e2e/reader-chapter-nav.spec.js](e2e/reader-chapter-nav.spec.js) で自動検証（session 59）。**長大原稿・chapter:// 相互リンク・ナビ操作の手応え**は引き続き手動で確認する。
2. **:::zw-textbox** にプリセット・tilt・anim 付き + 同段落に `[italic]…[/italic]`
  - **脚注**: 上記の **最小複合**（preset+tilt+anim+italic）について preview=reader の HTML 同一性は E2E 済み（`reader-wysiwyg-distinction.spec.js`）。DSL やプリセットの別組み合わせ・見た目の微差は手動で追う。
3. **:::zw-typing** / **:::zw-dialog** とルビ記法の混在
  - **脚注（基本パスは E2E 済み）**: 単一ブロック内で `\|漢字《かな》` ルビが入るケースの preview=reader 同一性は **E2E で固定済み**。**複数ブロックの組み合わせ・長大原稿・特殊記法の境目**は手動で確認する。
4. **壊れ Wiki リンク**（`is-broken`）と Reader ポップオーバー
  - **脚注**: **パイプライン層**では存在しないタイトルの `[[…]]` が preview/reader で同一 HTML かつ `is-broken` になることを E2E 済み。**Reader で壊れリンクをクリックしたときのポップオーバー**（未登録メッセージ・外クリックで閉じる）は [e2e/reader-wikilink-popover.spec.js](e2e/reader-wikilink-popover.spec.js) で自動検証（session 58）。
5. **ジャンルプリセット**（Reader 専用 UI）適用後の見え方（パイプライン後の CSS 層）
  - **脚注**: **クラス付与**に加え、**代表1項目**として `genre-adv` 適用時の `.zw-dialog` の **computed background**（`rgba(0,0,0,0.85)` 相当）を `e2e/reader-genre-preset.spec.js` で固定（session 76）。**タイピング演出・全面の見た目**は手動で確認する。

差分を見つけたら: **1 トピック = 1 PR**、可能なら `reader-wysiwyg-distinction.spec.js` に最小の `evaluate` アサーションを追加。

## 既知の技術メモ

- `**TextboxRichTextBridge.projectRenderedHtml` の `target`（preview / reader / wysiwyg）**: 現行の `[TextExpressionPresetResolver.resolveTextbox](js/modules/editor/TextExpressionPresetResolver.js)` は `options.target` を解像度に使わず、`reduceMotion` と設定のみ参照する。preview と reader のテキストボックス HTML は **同一解決経路**（面別差分が必要になったら別仕様で明示する）。詳細は `[docs/specs/spec-textbox-render-targets.md](specs/spec-textbox-render-targets.md)`。

## 更新履歴


| 日付         | 内容                                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-06 | 初版。ZWMdItBody 導入後の監査台帳として追加                                                                                                                                                                                                                                                                              |
| 2026-04-06 | シナリオ3（zw-typing / zw-dialog + ルビ）を `reader-wysiwyg-distinction.spec.js` で自動検証に追加                                                                                                                                                                                                                         |
| 2026-04-06 | シナリオ3 に「基本=E2E・複合・境界は手動」の脚注を追加。シナリオ2（textbox 複合）を E2E に追加                                                                                                                                                                                                                                                |
| 2026-04-06 | シナリオ1（複数見出し + chapter://）のパイプライン層を E2E に追加。章末ナビは脚注で手動扱いを明示                                                                                                                                                                                                                                               |
| 2026-04-06 | シナリオ4（存在しない Wiki・`is-broken`）のパイプライン層を E2E に追加。ポップオーバーは脚注で別扱い                                                                                                                                                                                                                                            |
| 2026-04-06 | シナリオ5（ジャンルプリセット）を `reader-genre-preset.spec.js` で浅い自動検証に追加                                                                                                                                                                                                                                               |
| 2026-04-06 | シナリオ4 脚注: Reader 壊れ wikilink ポップオーバーを `reader-wikilink-popover.spec.js` で E2E 化（session 58）                                                                                                                                                                                                              |
| 2026-04-06 | シナリオ1 脚注: Reader 章末ナビ注入を `reader-chapter-nav.spec.js` で結合 smoke 化（session 59）                                                                                                                                                                                                                            |
| 2026-04-07 | 開発プラン session 64: 自動検証層を一括実行（`reader-wysiwyg-distinction`・`reader-chapter-nav`・`reader-wikilink-popover`・`reader-genre-preset` 計 16 件すべて通過）。パイプライン／Reader 結合の **コード差分なし**。長大原稿・見た目・手動シナリオの境界確認は従来どおり人間側のリリース前チェックに委ねる                                                                                    |
| 2026-04-08 | 次期プラン session 65: 手動シナリオ 1〜5 は台帳どおり **人間による並べ確認が正**。本記録時点で **新規の preview/reader 差分の報告・再現なし**（実装差分なし）。自動層 16 件を再実行しすべて通過                                                                                                                                                                                  |
| 2026-04-07 | session 66: **CSS 層**で MD プレビューと Reader 本文の段落 typography を整合（`style.css`）。`reader-wysiwyg-distinction` に computed style 一致 E2E を 1 件追加。reader 関連 4 spec 計 **17** 件を再実行しすべて通過                                                                                                                             |
| 2026-04-07 | session 67（別レーン）: **手動パック運用**を `USER_REQUEST_LEDGER` に明文化（シナリオ 1〜5 + `CURRENT_STATE` 体感リスト・履歴追記ルール）。**本記録時点**: エージェント作業はドキュメント整備のみ。**人間による並べ確認**はリリース前／四半期の手動パックで実施し、結果を本表に追記する（新規 preview/reader 差分の報告は従来どおり WP-004 本線へ）                                                                                |
| 2026-04-08 | session 74: 次点プラン（予備）として **Reader 章末ナビのクリック遷移**を `reader-chapter-nav.spec.js` で最小 E2E 化。`reader-chapter-nav` + `reader-wysiwyg-distinction` の計 17 件を再実行しすべて通過（実装変更はテスト追加のみ）                                                                                                                              |
| 2026-04-08 | session 76: WP-004 Phase 3 **本線** — 監査シナリオ5（ジャンルプリセット）の差分1件を **`genre-adv` 時 `.zw-dialog` の computed `backgroundColor`** で自動固定（`reader-genre-preset.spec.js` 1 件追加、`css/style.css` の `.genre-adv .zw-dialog` と整合）。`reader-genre-preset` + `reader-wysiwyg-distinction` を再実行し **18 件 pass**（プロダクトコード変更なし） |
| 2026-04-09 | session 77: **モード用語 SSOT** 整理（`INTERACTION_NOTES` 関係図を `normal`/`focus` と再生オーバーレイの別軸に修正ほか）。**Reader 系 E2E 一括回帰**（`reader-wysiwyg-distinction`・`reader-chapter-nav`・`reader-wikilink-popover`・`reader-genre-preset`・`reader-preview`）**34 件 pass**。Phase 3 **自動検証層は現状で区切り**、手動シナリオはリリース前／四半期。**保存導線のドキュメント横断**（`RECOMMENDED_DEVELOPMENT_PLAN` 短期「3」相当）は**未着手** |
| 2026-04-09 | session 78: **新規の preview/reader パイプライン差分の報告なし**（コード変更なし）。**手動パック**（シナリオ 1〜5 の並べ確認）は**未実施** — リリース前／四半期にユーザー実施し、本表へ結果を 1 行追記する |
| 2026-04-09 | session 79: **新規の preview/reader パイプライン差分の報告なし**（WP-001 ドキュメント中心のため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ追記 |
| 2026-04-09 | session 80: **新規の preview/reader パイプライン差分の報告なし**（保存導線のユーザー向け文言横断のため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ結果を追記 |
| 2026-04-09 | session 81: **新規の preview/reader パイプライン差分の報告なし**（WP-001 のコマンドパレット `keywords` 拡張のため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ追記 |
| 2026-04-09 | session 82: **新規の preview/reader パイプライン差分の報告なし**（ガジェット初回折りたたみのため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ追記 |
| 2026-04-09 | session 83: **新規の preview/reader パイプライン差分の報告なし**（サイドバーアコーディオンのため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ追記 |
| 2026-04-09 | session 84: **新規の preview/reader パイプライン差分の報告なし**（WP-001 ガジェット文言・サイドバー導線のため reader コード変更なし）。**手動パック**は**未実施** — リリース前にユーザーが実施する場合のみ本表へ追記 |


