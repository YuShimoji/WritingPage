# Current State

<!-- CURRENT_STATE_LIVE_START -->

更新: 2026-11-26 / この端末のデスクトップとスタートメニューから「WritingPage」で起動できます。[起動と読み込み](APP_LAUNCH_GUIDE.md#方法3windows-のデスクトップとスタートメニューから起動)・[編集用サンプル](../samples/README.md)。

## いまいる場所

| 観点 | 現在地 |
| --- | --- |
| MDプレビュー | 並べる配置をやめ、開いている間は執筆面と同じ位置・幅・文字組みで入れ替わる切り替え式にした（開く瞬間は同期描画、開いている間は次フレーム更新、`編集に戻る`で復帰）。プレビュー中は読み取り専用（2026-11-15 に本人が現状維持で確定）。あわせて下線の保存、ダークテーマの光彩・影、狭幅で非表示の3点を修正。リファクタは Turndown ルールを `RichTextTurndownRules.js` へ切り出し、傍点/ルビ変換を `ZWInlineHtmlPostMarkdown.applyKentenRuby` に一本化。関連E2E 251件・unit 56件・lint pass。記録は [`verification/2026-11-04/preview-effect-visibility.md`](verification/2026-11-04/preview-effect-visibility.md)。 |
| Git / main | プレイ日記・場面字幕・伏せ書きの Windows 版は `feat/play-diary-scenes` の `c44aa9b4e9e48ffa97b67af15e686c1be559f0d6`。組み設定の確認版は `feature/daily-writing-candidate` の `04cd77305c0143d93ddee49c598ec6785863a7b8`。いずれも候補ブランチ。 |
| 記法と画面効果 | 脚本の中央字幕と場面転換を参考に、任意の副題を付けた場面字幕を組み、読者表示で画面に入ると濃くする。折りたたみ注記を参考に、手掛かりをその場で開閉できる伏せ書きを追加。OS の動きを減らす設定とアプリ設定に対応。比較した別方式は、本文の近くに補足を置く [Tufte CSS](https://edwardtufte.github.io/tufte-css/)、分岐先を用意する [ink](https://www.inklestudios.com/ink/web-tutorial/)、同じ構図の画像2枚を重ねる [Juxtapose](https://juxtapose.knightlab.com/)。今回は文章だけで使える2つを実装。 |
| 表現の確認 | Windows 版で新規原稿に両方を入力し、保存復帰・読者表示の Enter 開閉・HTML 出力を確認。[Windows 実画面](<D:/AI-Runs/WritingPage/verification/reading-effects-windows.png>)・[390px の HTML](<D:/AI-Runs/WritingPage/verification/reading-effects-narrow.png>)。梱包136ファイルがソースと一致。関連 E2E 10件・unit 64件・lint・smoke・build 成功。[全633件](<D:/AI-Runs/WritingPage/tmp/reading-effects-suite.log>)は623成功・4スキップ・6失敗。6件すべて前版にもある。調査から Windows 実機・全体試験まで約21分（見込み20〜40分）。 |
| プレイ日記 | [参考日記](https://len.s71.xrea.com/morrowind/)に合わせ、1章を1話とする。F2の場面挿入で、登場人物・プレイヤーの名前、原文、和訳を発言順に追加できる。過去の無記名の発言は「ゲーム内の台詞」と表示する。画像と本文は「筆者の記録」にまとめ、狭幅は会話の下に置く。読者表示と単体HTMLは目次・前後リンクに対応し、JSONで画像を含めて編集を再開できる。 |
| 聞き込み | F2 の「聞き込みの場面を挿入」で話者・場所・導入・複数の返答・旅の手帳を一度に入力。NarrativeGen `bc87be5` の [七人目の渡し賃](<D:/AI-Runs/WritingPage/verification/ash-ferry-inquiry.html>) を、Studio で結末まで実行した経路に沿って5章の編集用見本にした。正式な双方向連携は [NarrativeGen の契約](https://github.com/YuShimoji/NarrativeGen/blob/bc87be58e4135af5c66a6f67f109d77642cfc706/docs/specs/writingpage-io-contract.md) の着手条件（形式の安定・双方合意など）を待つ。 |
| 閲覧用プレイ日記 | [玄武岩砦の当番帳](<D:/AI-Runs/WritingPage/verification/basalt-watch.html>)、[雨の日、窓辺の席](<D:/AI-Runs/WritingPage/verification/lamp-in-the-window.html>)、[北堰の十二年](<D:/AI-Runs/WritingPage/verification/twelve-years-at-the-dam.html>)。各3章。通常のJSON読み込み→再読込→読者表示→HTML保存を4原稿で確認。外部通信を切ったHTMLで画像・目次・開閉、幅390pxで横はみ出しなしを確認。聞き込みの入れ子がリッチ編集とHTMLの往復で崩れる回帰を守る試験を追加。関連E2E 37件、unit 64件、lint・smoke・Webビルド成功。 |
| 日記の確認 | Windows確認版で旅人の質問・渡し守の返答を1場面に入力し、再読み込み後の[読者表示](<D:/AI-Runs/WritingPage/verification/speaker-layout-windows.png>)で名前と和訳を確認。[書き出したHTML](<D:/AI-Runs/WritingPage/verification/speaker-layouts.html>)は900px幅で会話と記録が横並び、390px幅で縦並び。実行用136ファイルがsourceと一致。旧形式・2話の目次・画像のJSON復元も日記のE2Eで確認。 |
| 日記版の検証結果 | 日記のE2E 8件、unit 64件、smoke、Web・Windowsビルド、変更JSとMarkdownのlintが成功。[全631件のログ](<D:/AI-Runs/WritingPage/tmp/diary-speakers-suite.log>)は620成功・4スキップ・7失敗。うち6件は前版と同じ項目。残る箇条書きの試験は準備中にタイムアウトし、単独再実行で成功。話者別レイアウトの実機・全体試験の確認まで約21分（見込み15〜30分）。 |
| ブランチ統一 (2026-11-15) | main = origin/main。docs スリム化 `52bfb8e` と参照切れ修正を ff 統合。旧 cascade / feature 系25本・`.windsurf` worktree 15本・stash 3件・リモート slim ブランチは、全 ref の bundle と未コミット差分・stash patch を `D:\AI-Runs\WritingPage\removed\20261115\`（`all-refs.bundle` + `refs.txt`）へ退避してから削除。残りは `codex/*`（ローカル2本・リモート4本。10月候補で一部のみ採用）と、その worktree `D:\AI-Runs\WritingPage\worktree-2966f3-20261005`。 |
| リファクタ (2026-11-15) | `editor-wysiwyg.js` のパステキスト操作 約280行を `js/modules/editor/RichTextPathTextActions.js` へ移動（メソッド名・挙動は不変、プロトタイプへ差し込み）。lint・unit 56・関連E2E 74件 pass。 |
| 別端末での再開 | 候補と同じ製品を調べる場合は「Git / main」行の該当ブランチ・sourceを照合する。Windows の実行物と本人確認用プロファイルは生成した端末の output 以下にある。通常開発は main の最新を確認し、CURRENT_STATE → INVARIANTS → INTERACTION_NOTES の順に読む。 |
| この端末だけにあるもの | 退避物 `D:\AI-Runs\WritingPage\removed\20261115\`（旧ブランチ25本の bundle・未コミット差分・stash patch）と `output/electron-candidates/c61d9c0.../`（候補exe）は git に無く、他端末からは見えない。旧ブランチの内容が要るときはこの端末で `git fetch <bundle> <ref>`。 |
| 11月15日時点で見送った範囲 | ①`codex/*` の未採用差分は丸ごと merge しない（`codex/rich-editor-control-friction` の toolbar 配置・リンク affordance は本文/CSS/E2E のみ移植済み、CI binding=`codex/release-ci-evidence-binding`、release identity=`codex/release-candidate-identity-b02ceb1`）。②追加の大規模分割（下表）は未着手。③本ファイルの Historical 節は 2026-11-15 の本人承認で削除済み（1287行/178663B→44行/7734B。原本は D:\AI-Runs\WritingPage\removed\20261115-current-state\、git 履歴にも残る）。④リファクタの Electron 実機確認と E2E 全件は未実行（CI 側で確認）。ブラウザ実画面ではツールバー配置・リンクモーダル・ルビを確認済み、傍点は未確認。 |
| 製品と CI | [iA Writer の Library と Editor](https://ia.net/writer/how-to/quick-tour)、[Obsidian のコマンド検索](https://obsidian.md/help/plugins/command-palette)を参考に原稿選択・検索・保存表示を整理。390×540 でも候補のスクロール・絞り込み・キーボード選択、保存表示の画面内配置を確認。[11月24日版 `61333a8` の CI](https://github.com/YuShimoji/WritingPage/actions/runs/45371004911) は E2E 616件成功・4件スキップ。調査から実機・CI確認まで約25分（見込み20〜40分）。 |
| 候補 | 上記 source の clean checkout から Windows 確認版を生成。exe SHA `d5124d4c…a3db10c3a`、app.asar SHA `5a525e26…9d5034dd`。入口 HTML と css・js・electron 配下の実行用 HTML/CSS/JS 135ファイルが source と一致。 |
| Native | Windows 確認版で22字×10行の横書き・縦書き、MDプレビューからの編集復帰、Reader、別文書の作成と元文書の組み設定復元を確認。縦書き140段落のA4 PDFは15ページで本文末尾まで収録。旧版 `61333a8` の原稿ツリー・保存表示・F2の実画面は `output/release-readiness/2026-11-24/writing-interface/`。 |
| 文字数と組み設定 (2026-11-25) | `ManuscriptMetrics` がルビの読み・下線タグ・傍点記法を除いた本文を数える。右下、執筆目標、Design Cockpit、セクション一覧が共有する。改行・空白を除く方式が既定。改行だけを除く／すべて数える方式に切替可能。「表示 → この文書の組み設定」で縦横・1行の字数・1ページの行数・ページ枠を指定し、編集・MDプレビュー・Reader・印刷・HTMLに反映する。右下は文書の字数×行数で約0.5枚から枚数を表示する（既定換算20×20）。セクション一覧は各見出しから次の見出しまでの本文字数を示す。JSONの書き出し・読み込みで文書の設定を引き継ぐ。 |
| 組み設定の検証 | Windows Electron の編集面と MD プレビューで22字の同じ長さを実測。Reader・印刷PDF・HTML・JSON往復、節本文138字を確認。unit 64件、lint、smoke、Webビルド成功。全E2Eは612成功・4スキップ・7失敗。選択ツールバーの1件は単独再検証で成功。他の6件は[変更前のCI](https://github.com/YuShimoji/WritingPage/actions/runs/45549508729)でも失敗している。 |
| ローカルの一時出力 | 自動承認が削除を拒否し、今回の中間ビルド `output/electron-candidates/5798130890332e0ab7091706537c7184a35012b3/`、検証プロファイル `writing-interface-*` 5個、画像 `writing-interface/after-*.png` 3枚が残る。前回の `7de4a938…`、`sidebar-review-rXlFUE`・`structure-sidebar-7de4a93` と `structure-sidebar/draft.png` も同じ状態。組み設定の検証用プロファイル（output/verification-profiles に6個、D:\AI-Runs\WritingPage\tmp に4個）、同じ tmp の検証用3ファイル、output/release-readiness/document-layout-focused も自動承認が再帰削除を拒否して残る。いずれも体験確認リンクの対象外。 |
| Windows の通常起動 | この端末に「WritingPage」を登録。両方のショートカットは通常の保存先を使う [Windows アプリ](<../build/win-unpacked/Zen Writer.exe>) を指す。スタートメニューのリンクから起動し F2 の表示を確認。パッケージの実行用137ファイルがソースと一致。隔離プロファイルで4原稿を読み込み、読者表示・折りたたみの開閉・画像を確認。[実画面](<D:/AI-Runs/WritingPage/verification/ash-ferry-inquiry-windows.png>)。削除コマンドがポリシーで拒否され、[一時プロファイル](<D:/AI-Runs/WritingPage/tmp/writingpage-shortcut-profile>)と確認用3ファイルが残る。 |
| 画面の表示サイズ | 「設定」の先頭でコンパクト（既定）・標準・大きめを選択し、左ナビ・コマンド検索・保存表示へ即時反映。Windows で再起動後の復元を確認し、設定の折りたたみ見出し5行を約338→210 CSS pxに短縮。[実画面](<D:/AI-Runs/WritingPage/verification/display-size-settings.png>)・[Windows 確認版](<../output/electron-candidates/display-size/win-unpacked/Zen Writer.exe>)。通常起動側は執筆ウィンドウが開いているため差し替え保留。実装から実機確認まで約14分（見込み15〜30分）。 |
| 日記の中間出力 | 再帰削除がポリシーで拒否され、[一時出力](<D:/AI-Runs/WritingPage/tmp>) に字幕・伏せ書きの検証プロファイル6個（`reading-effects-native/diag/inspect-*`）と試験出力2個（`reading-effects-focused`・`reading-effects-tests`）が残る。話者配置の `output/playwright/diary-speakers*`、同じ tmp のプロファイル2個と確認スクリプト、前版の候補 `a5228eba`・`output/playwright/play-diary*`・`play-diary-native-*` 5個も残る。 |

前候補 `c61d9c0` の Undo/Redo 修正・native 観察の記録は
[`verification/2026-11-02/undo-redo-wiki-candidate.md`](verification/2026-11-02/undo-redo-wiki-candidate.md)。
前候補の[技術確認](verification/2026-11-02/ci-package-verification.md)と、
[Wikiの仕様・画面確認](verification/2026-11-02/wiki-requirements-verification.md)は各sourceの記録として保持する。

## 次に推奨する作業

| 作業 | 目的と次に可能になること |
| --- | --- |
| 新候補の本人操作感レビュー | 使用中の体験確認ウィンドウは保存後に閉じ、[場面字幕と伏せ書きの Windows 確認版](<../output/electron-candidates/c44aa9b4e9e48ffa97b67af15e686c1be559f0d6/Zen Writer 場面字幕と伏せ書き.lnk>) の F2 から普段の原稿に場面の切り替わりと伏せたい情報を入れ、Alt+Shift+R で読む。既存の体験確認用プロファイルを使用。話者別会話も同じ版に含む。組み設定は [11月25日の組み設定版](../output/electron-candidates/04cd77305c0143d93ddee49c598ec6785863a7b8/Zen%20Writer%20体験確認.lnk) で確認。 |
| UI 再設計案の確認（本人） | ①左ナビ4区分、②文字数・枚数の集計と節別表示、③文書の組み設定を候補ブランチに実装。確認対象は、普段の原稿での文字数の既定（改行・空白を除く）とページ枠の見やすさ。旧文書の向きは旧編集設定を優先し、未設定時は旧Reader設定を参照する。[要望と採否](USER_REQUEST_LEDGER.md) |
| 次の切り出し（1回1クラスタ） | ルビ/傍点・DSL モーダル/ブロック挿入・リンク挿入・フローティングツールバー/書式状態同期（`RichTextRubyKentenActions.js` / `RichTextDslActions.js` / `RichTextLinkActions.js` / `RichTextFloatingToolbarActions.js`）は切り出し済み（`editor-wysiwyg.js` 2895→1944行。lint・unit 56・関連E2E・build 確認、リンクは実ブラウザで差し込み・モーダル開閉も確認）。`editor-wysiwyg.js` 内の次の候補は未選定（`_showWikiComplete` 周辺の Wiki 補完など）。他の大物は `storage.js` 1928 / `story-wiki.js` 1655 / `sidebar-manager.js` 1602 / `floating-memo-field.js` 1513 行。 |
| 未採用Rich候補の限定評価 | Enter後の太字解除や選択toolbar等は今回未採用（差分は上記 `codex/*` に残る）。実際に困る場面を再現し、一括統合せず必要な差分を選ぶ |
| サンプルを編集 | Windows の「WritingPage」を開き、「原稿」→「入出力」→「JSON読み込み」で[編集用サンプル](../samples/README.md)を開く。Alt+Shift+R で読者表示。 |

<!-- CURRENT_STATE_LIVE_END -->

## Historical Snapshot Log

過去のスナップショット（2026-05-15〜2026-07-08）は削除済み。`git show 1712ed4:docs/CURRENT_STATE.md` で参照できる。
