# Current State

<!-- CURRENT_STATE_LIVE_START -->

更新: 2026-11-27 / NarrativeGen 連携を続けるブランチと起動・検証手順を更新。

## いまいる場所

| 観点 | 現在地 |
| --- | --- |
| MDプレビュー | 並べる配置をやめ、開いている間は執筆面と同じ位置・幅・文字組みで入れ替わる切り替え式にした（開く瞬間は同期描画、開いている間は次フレーム更新、`編集に戻る`で復帰）。プレビュー中は読み取り専用（2026-11-15 に本人が現状維持で確定）。あわせて下線の保存、ダークテーマの光彩・影、狭幅で非表示の3点を修正。リファクタは Turndown ルールを `RichTextTurndownRules.js` へ切り出し、傍点/ルビ変換を `ZWInlineHtmlPostMarkdown.applyKentenRuby` に一本化。関連E2E 251件・unit 56件・lint pass。記録は [`verification/2026-11-04/preview-effect-visibility.md`](verification/2026-11-04/preview-effect-visibility.md)。 |
| Git / 開発ブランチ | `writingpage-narrativegen-connection` の実装版は `9cb4adf`。NarrativeGen の原稿入出力・Reader、章末編集の保存、文字組みと Story Wiki の調整を含む。`main` の `0dc5ef7` は変換器・試験データと当時の再開手順まで。旧 Windows 候補の source は `c61d9c0d46c25b074bab963305f085bd5e837174`。 |
| ブランチ統一 (2026-11-15) | main = origin/main。docs スリム化 `52bfb8e` と参照切れ修正を ff 統合。旧 cascade / feature 系25本・`.windsurf` worktree 15本・stash 3件・リモート slim ブランチは、全 ref の bundle と未コミット差分・stash patch を `D:\AI-Runs\WritingPage\removed\20261115\`（`all-refs.bundle` + `refs.txt`）へ退避してから削除。残りは `codex/*`（ローカル2本・リモート4本。10月候補で一部のみ採用）と、その worktree `D:\AI-Runs\WritingPage\worktree-2966f3-20261005`。 |
| リファクタ (2026-11-15) | `editor-wysiwyg.js` のパステキスト操作 約280行を `js/modules/editor/RichTextPathTextActions.js` へ移動（メソッド名・挙動は不変、プロトタイプへ差し込み）。lint・unit 56・関連E2E 74件 pass。 |
| この端末だけにあるもの | 退避物 `D:\AI-Runs\WritingPage\removed\20261115\`（旧ブランチ25本の bundle・未コミット差分・stash patch）と `output/electron-candidates/c61d9c0.../`（候補exe）は git に無く、他端末からは見えない。旧ブランチの内容が要るときはこの端末で `git fetch <bundle> <ref>`。 |
| 今回見送った範囲 | ①`codex/*` の未採用差分は丸ごと merge しない（`codex/rich-editor-control-friction` の toolbar 配置・リンク affordance は本文/CSS/E2E のみ移植済み、CI binding=`codex/release-ci-evidence-binding`、release identity=`codex/release-candidate-identity-b02ceb1`）。②追加の大規模分割（下表）は未着手。③本ファイルの Historical 節は 2026-11-15 の本人承認で削除済み（1287行/178663B→44行/7734B。原本は D:\AI-Runs\WritingPage\removed\20261115-current-state\、git 履歴にも残る）。④リファクタの Electron 実機確認と E2E 全件は未実行（CI 側で確認）。ブラウザ実画面ではツールバー配置・リンクモーダル・ルビを確認済み、傍点は未確認。 |
| 今回の製品修正 | 初回入力が履歴に確定する前のUndo不発と、Undo後の新規入力を古いRedo分岐が上書きする問題をブラウザで再現。`js/editor-wysiwyg.js` の履歴確定順序だけを修正。 |
| Web / Node | 修正前2件を画面で再現。修正後は関連E2E 75/75、unit 56/56、JS lint、dist build、smokeがpass。source一致のCI run `41406872761` は606 passed / 4 skippedでsuccess。既定500msの追加ブラウザ確認でも2件の改善を確認。 |
| Wiki | title一意・カスタムカテゴリ追加・390px幅の修正は統合済み。今回の75件にWiki 25件を含み、新app.asar内のWiki JS/CSSもsourceとhash一致。 |
| 候補 | `output/electron-candidates/c61d9c0d46c25b074bab963305f085bd5e837174/build/win-unpacked/Zen Writer.exe`。exe SHA `207c30bc...be4cbbe` / app.asar SHA `bb4587f5...9a9fb43`。7 source照合とmarkdown-it 14.3.0のlock/installed/packed一致を確認。前候補 `33dd238` は保持。 |
| Native | `output/verification-profiles/c61d9c0-undo-wiki-native` で40文字の保存済みを確認。Alt+F4で終了しprocess 0件 → 同じexe/profileで再起動し同じ本文・40文字・保存済みへ復帰 → 再終了してprocess 0件。exe/asar/checkpointのSHAは観察前後で不変。 |
| 今回の到達点 | 履歴2件の修正と回帰、Wikiを含む候補の生成・技術確認まで完了。original checkpointとoperator sheetはimmutable / pendingを維持し、technical観察は別JSONへ記録。 |
| 人の受入 / release | 技術確認と本人の操作感受入を分ける。通常起動先の切替、公開・配布は今回の範囲に含めない。 |

今回の再現・修正・候補identity・native観察・未確認範囲は
[`verification/2026-11-02/undo-redo-wiki-candidate.md`](verification/2026-11-02/undo-redo-wiki-candidate.md)。
前候補の[技術確認](verification/2026-11-02/ci-package-verification.md)と、
[Wikiの仕様・画面確認](verification/2026-11-02/wiki-requirements-verification.md)は各sourceの記録として保持する。

## NarrativeGen連携の再開

1. `git fetch origin` → `git switch writingpage-narrativegen-connection` → `git pull --ff-only`。`git rev-list --left-right --count "HEAD...@{u}"` が `0 0` になることを確認する。
2. [README](../README.md) の Node 要件に従い（CI の指定は [`.nvmrc`](../.nvmrc)）、`npm ci` → `npm run dev`。ブラウザで `http://localhost:8080` を開く。
3. 基本確認は `npm run test:smoke`、`npm run test:unit`、`npm run lint:js:check`。入出力の回帰を実行するには `npx playwright install chromium` → `npx playwright test e2e/export-trust.spec.js`。Web 配布用の出力は `npm run build` で生成する。

`9cb4adf` を Windows の Node 22.19.0 で検証し、起動スモーク、単体63件、JavaScript lint、Web ビルドが成功。入出力・保存保護・設定・コマンドパレット・表示・Story Wiki のブラウザ回帰は113件成功、1件スキップ。全件 E2E とこの版の Windows パッケージ再検証は未実施。

「構造 → ドキュメント → 入出力」から「NarrativeGenの原稿を読み込む」「NarrativeGen用に書き出す」を使う。取り込みは新しい原稿を作成する。非表示の章や装飾などが渡らない場合は書き出し前に確認が出る。[変換器](../js/modules/narrative/NarrativeScreenBridge.js)

`F2` →「NarrativeGenの再生記録を開く」で、[「藍布の耳」の固定経路](../test/fixtures/narrativegen/screen-route-blue-selvedge.json)の JSON を選ぶ。Reader の「編集に戻る」で元の原稿へ戻る。

Windows版 0.3.32（Electron 35.7.5、x64）の通常表示で、表示中の章末を保存しても章レコードに入らず、書き出しも旧本文になる問題を修正。隔離プロファイルで「受付」の原稿を編集・保存・終了し、再起動後の章本文と書き出しJSONに変更が残ることを確認した。対象外の章レコード・話者・分岐・ルビを保持し、Studioの「書類を出す → 帰る」「帰る」の両経路が改訂後の結末に到達した。[回帰試験](../e2e/export-trust.spec.js)

固定経路のReader表示では、左右の吹き出し・場所・手帳3件・依頼完了・編集への復帰をブラウザで確認済み。既存モデルへの改訂適用、同期、Unity向け同梱は後続候補。[3プロジェクトの申し送り](https://github.com/YuShimoji/NarrativeGen/blob/main/HANDOVER.md#unitychatnovelgamewritingpageとの接続)

## 次に推奨する作業

| 作業 | 目的と次に可能になること |
| --- | --- |
| 新候補の本人操作感レビュー | 保存・復帰の技術確認済み候補で、WikiやDocumentsの使い心地を判断する。起動は検証資料の隔離profile指定経路を使い、旧固定build先と混同しない |
| 次の切り出し（1回1クラスタ） | ルビ/傍点・DSL モーダル/ブロック挿入・リンク挿入・フローティングツールバー/書式状態同期（`RichTextRubyKentenActions.js` / `RichTextDslActions.js` / `RichTextLinkActions.js` / `RichTextFloatingToolbarActions.js`）は切り出し済み（`editor-wysiwyg.js` 2895→1944行。lint・unit 56・関連E2E・build 確認、リンクは実ブラウザで差し込み・モーダル開閉も確認）。`editor-wysiwyg.js` 内の次の候補は未選定（`_showWikiComplete` 周辺の Wiki 補完など）。他の大物は `storage.js` 1928 / `story-wiki.js` 1655 / `sidebar-manager.js` 1602 / `floating-memo-field.js` 1513 行。 |
| 未採用Rich候補の限定評価 | Enter後の太字解除や選択toolbar等は今回未採用（差分は上記 `codex/*` に残る）。実際に困る場面を再現し、一括統合せず必要な差分を選ぶ |
| 通常利用への切替判断 | 候補source・profile・既存原稿の扱いを確認して、通常起動先を変えるか判断する。今回の技術合格だけで切替・公開・配布を実行しない |

<!-- CURRENT_STATE_LIVE_END -->

## Historical Snapshot Log

過去のスナップショット（2026-05-15〜2026-07-08）は削除済み。`git show 1712ed4:docs/CURRENT_STATE.md` で参照できる。
