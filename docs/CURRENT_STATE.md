# Current State

<!-- CURRENT_STATE_LIVE_START -->

更新: 2026-11-24 / Windows 候補 `61333a8`。空の原稿は書き出し位置に案内を表示し、文字数と保存状態を右下に表示する。「構造」の原稿ツリーと F2 のコマンドパレットを整理した。[開発プラン](ROADMAP.md)

## いまいる場所

| 観点 | 現在地 |
| --- | --- |
| MDプレビュー | 並べる配置をやめ、開いている間は執筆面と同じ位置・幅・文字組みで入れ替わる切り替え式にした（開く瞬間は同期描画、開いている間は次フレーム更新、`編集に戻る`で復帰）。プレビュー中は読み取り専用（2026-11-15 に本人が現状維持で確定）。あわせて下線の保存、ダークテーマの光彩・影、狭幅で非表示の3点を修正。リファクタは Turndown ルールを `RichTextTurndownRules.js` へ切り出し、傍点/ルビ変換を `ZWInlineHtmlPostMarkdown.applyKentenRuby` に一本化。関連E2E 251件・unit 56件・lint pass。記録は [`verification/2026-11-04/preview-effect-visibility.md`](verification/2026-11-04/preview-effect-visibility.md)。 |
| Git / main | 候補 source は `feature/daily-writing-candidate` の `61333a8916c87ec5c175ab55b52ec5c665a23458`。main への統合前。 |
| ブランチ統一 (2026-11-15) | main = origin/main。docs スリム化 `52bfb8e` と参照切れ修正を ff 統合。旧 cascade / feature 系25本・`.windsurf` worktree 15本・stash 3件・リモート slim ブランチは、全 ref の bundle と未コミット差分・stash patch を `D:\AI-Runs\WritingPage\removed\20261115\`（`all-refs.bundle` + `refs.txt`）へ退避してから削除。残りは `codex/*`（ローカル2本・リモート4本。10月候補で一部のみ採用）と、その worktree `D:\AI-Runs\WritingPage\worktree-2966f3-20261005`。 |
| リファクタ (2026-11-15) | `editor-wysiwyg.js` のパステキスト操作 約280行を `js/modules/editor/RichTextPathTextActions.js` へ移動（メソッド名・挙動は不変、プロトタイプへ差し込み）。lint・unit 56・関連E2E 74件 pass。 |
| 別端末での再開 | 候補と同じ製品を調べる場合は origin の feature/daily-writing-candidate と候補 source を照合する。Windows の実行物と本人確認用プロファイルは生成した端末の output 以下にある。通常開発は main の最新を確認し、CURRENT_STATE → INVARIANTS → INTERACTION_NOTES の順に読む。 |
| この端末だけにあるもの | 退避物 `D:\AI-Runs\WritingPage\removed\20261115\`（旧ブランチ25本の bundle・未コミット差分・stash patch）と `output/electron-candidates/c61d9c0.../`（候補exe）は git に無く、他端末からは見えない。旧ブランチの内容が要るときはこの端末で `git fetch <bundle> <ref>`。 |
| 11月15日時点で見送った範囲 | ①`codex/*` の未採用差分は丸ごと merge しない（`codex/rich-editor-control-friction` の toolbar 配置・リンク affordance は本文/CSS/E2E のみ移植済み、CI binding=`codex/release-ci-evidence-binding`、release identity=`codex/release-candidate-identity-b02ceb1`）。②追加の大規模分割（下表）は未着手。③本ファイルの Historical 節は 2026-11-15 の本人承認で削除済み（1287行/178663B→44行/7734B。原本は D:\AI-Runs\WritingPage\removed\20261115-current-state\、git 履歴にも残る）。④リファクタの Electron 実機確認と E2E 全件は未実行（CI 側で確認）。ブラウザ実画面ではツールバー配置・リンクモーダル・ルビを確認済み、傍点は未確認。 |
| 製品と CI | [iA Writer の Library と Editor](https://ia.net/writer/how-to/quick-tour)、[Obsidian のコマンド検索](https://obsidian.md/help/plugins/command-palette)を参考に原稿選択・検索・保存表示を整理。390×540 でも候補のスクロール・絞り込み・キーボード選択、保存表示の画面内配置を確認。[候補と一致する CI](https://github.com/YuShimoji/WritingPage/actions/runs/45371004911) は E2E 616件成功・4件スキップ。調査から実機・CI確認まで約25分（見込み20〜40分）。 |
| 候補 | 上記 source の clean checkout から生成。exe SHA `50f35480…5e08a42d`、app.asar SHA `b90b4984…7241b3445`。入口 HTML と css・js・electron 配下の実行用 HTML/CSS/JS 133ファイルが source と一致。 |
| Native | 1200×800 の Windows 版で F2 →「構造」→ フォルダ内に文書を作成 → 入力・自動保存、フォルダ開閉、F2 の絞り込み・矢印選択・Esc 復帰を検証。明暗両テーマで見出しと保存表示を確認。実画面は `output/release-readiness/2026-11-24/writing-interface/`。 |
| 残る不具合 | テスト原稿「文字数」の3文字に下線を付けると、本文は同じでもステータス表示が26文字になる。装飾込みの文字数集計を独立した修正候補とする。 |
| ローカルの一時出力 | 自動承認が削除を拒否し、今回の中間ビルド `output/electron-candidates/5798130890332e0ab7091706537c7184a35012b3/`、検証プロファイル `writing-interface-*` 5個、画像 `writing-interface/after-*.png` 3枚が残る。前回の `7de4a938…`、`sidebar-review-rXlFUE`・`structure-sidebar-7de4a93` と `structure-sidebar/draft.png` も同じ状態。いずれも現行の体験確認リンクの対象外。 |
| 人の受入 / release | 技術確認と本人の操作感受入を分ける。通常起動先の切替、公開・配布は今回の範囲に含めない。 |

前候補 `c61d9c0` の Undo/Redo 修正・native 観察の記録は
[`verification/2026-11-02/undo-redo-wiki-candidate.md`](verification/2026-11-02/undo-redo-wiki-candidate.md)。
前候補の[技術確認](verification/2026-11-02/ci-package-verification.md)と、
[Wikiの仕様・画面確認](verification/2026-11-02/wiki-requirements-verification.md)は各sourceの記録として保持する。

## 次に推奨する作業

| 作業 | 目的と次に可能になること |
| --- | --- |
| 新候補の本人操作感レビュー | 体験確認ウィンドウを使用中なら保存後に閉じ、`output/electron-candidates/61333a8916c87ec5c175ab55b52ec5c665a23458/Zen Writer 体験確認.lnk` を開く。以前の体験確認リンクも同じ版と本人用プロファイルを開く。「構造」で原稿を選んだときの見分けやすさ、執筆中の右下表示、F2 の候補の読みやすさを本人が判断する。 |
| 次の切り出し（1回1クラスタ） | ルビ/傍点・DSL モーダル/ブロック挿入・リンク挿入・フローティングツールバー/書式状態同期（`RichTextRubyKentenActions.js` / `RichTextDslActions.js` / `RichTextLinkActions.js` / `RichTextFloatingToolbarActions.js`）は切り出し済み（`editor-wysiwyg.js` 2895→1944行。lint・unit 56・関連E2E・build 確認、リンクは実ブラウザで差し込み・モーダル開閉も確認）。`editor-wysiwyg.js` 内の次の候補は未選定（`_showWikiComplete` 周辺の Wiki 補完など）。他の大物は `storage.js` 1928 / `story-wiki.js` 1655 / `sidebar-manager.js` 1602 / `floating-memo-field.js` 1513 行。 |
| 未採用Rich候補の限定評価 | Enter後の太字解除や選択toolbar等は今回未採用（差分は上記 `codex/*` に残る）。実際に困る場面を再現し、一括統合せず必要な差分を選ぶ |
| 通常利用への切替判断 | 候補source・profile・既存原稿の扱いを確認して、通常起動先を変えるか判断する。今回の技術合格だけで切替・公開・配布を実行しない |

<!-- CURRENT_STATE_LIVE_END -->

## Historical Snapshot Log

過去のスナップショット（2026-05-15〜2026-07-08）は削除済み。`git show 1712ed4:docs/CURRENT_STATE.md` で参照できる。
