# Undo/Redo の未確定入力と Wiki を含む新候補

作業日: 2026-11-02 JST。開始 source は `8cebb339a626b6a55a02603330d5a5c338b8865a`、main / origin/main 一致、clean。

本人依頼:

> Undo/Redoの2件を画面上で再現し、必要な最小修正と回帰検証を進めてください。その後、Wiki変更も含めた新しいElectron候補を作り、隔離プロファイルで保存・終了・再起動・復帰まで確認し、現状資料の更新、commit・pushまで進めてください。

## 再現と修正

| 操作 | 修正前の画面 | 修正 |
| --- | --- | --- |
| 初回入力直後の Undo | `First pending input` が残る | `_undoAction()` で履歴数の確認前に現在入力を確定する |
| Undo 後、新規入力直後の Redo | `New pending input` が `Original branch` に置き換わる | `_redoAction()` でも現在入力を先に確定し、古い Redo 分岐を破棄する |

製品変更は `js/editor-wysiwyg.js` の上記2メソッドだけ。10月候補 `2966f3c` の同修正を参照し、toolbar・Enter後の太字・揃え描画などは追加していない。既存の Space / Enter / blur / compositionend 境界と同期通知を維持する。

Browser plugin は利用できないため、既存 Playwright を使用した。ブラウザの実入力とキーボードショートカットを使い、各操作前後の screenshot / HTML / Markdown / 履歴数を採取した。回帰では既定500msの未確定入力区間をテスト側だけで60000msへ延ばし、端末速度で自動確定が先行しないようにした。製品の待ち時間や履歴メソッドはテストから書き換えていない。

Redo の再現準備は command palette の開閉による通常の blur 確定を使用。修正前の最終確認は2件とも期待した本文不一致で fail。最初の試行の Space は独立した履歴境界となり、Redo 再現前の準備に不適切だったため、最終確認とは分けている。

修正後の2件は Undo → Redo と、新規入力を保持した Redo の双方について保存・reload まで確認する。ページ識別・エディタ表示・ブラウザ例外・console error/warning も検査する。

## 検証と残る工程

- unit 56/56、JS lint、dist build、smoke: pass。
- Undo/Redo新規2件、既存WYSIWYG履歴・Wiki・Wiki IDB・保存変換を含む75件: 75/75 pass（2.6分）。
- 修正source `c61d9c0d46c25b074bab963305f085bd5e837174` をcommit/push済み。[CI E2E run 41406872761](https://github.com/YuShimoji/WritingPage/actions/runs/41406872761) は同一SHAでsuccess、606 passed / 4 skipped。
- npm 11.6.2 の既存実行経路でclean sourceからcheckpoint/packageを生成。既定5ファイルに加え、Wikiの `js/story-wiki.js` / `css/style.css` も梱包内容とsourceのhash一致を確認。
- 新候補を隔離profileで起動し、40文字の保存済み表示、通常終了、同じexe/profileでの再起動と本文一致、再終了後の候補process 0件を確認。今回の独立したtechnical PASSであり、前候補 `33dd238` の結果を継承していない。

初期見込み45〜90分。画面再現後の残り見込み35〜65分。CI、package build、native操作に幅があり、時間を停止条件にはしない。

## ローカル証跡

- 最初の試行: `output/playwright/nov02-undo-red/`、`output/nov02-undo-red.log`
- 修正前の最終再現: `output/playwright/nov02-undo-red-confirmed/`、`output/nov02-undo-red-confirmed.log`
- 修正後: `output/playwright/nov02-undo-green/`、`output/nov02-undo-green.log`
- unit / smoke: `output/nov02-undo-unit.log`、`output/nov02-undo-smoke.log`

generated evidence はGit管理外。Electronの技術確認、本人の操作感受入、通常起動先の切替、外部公開・配布を分けて記録する。

## 既定の入力タイミングでの追加確認

製品の500msを変更せず、修正前 `8cebb33` と修正後 `c61d9c0` をブラウザで比較した。修正前のeditor JSだけを固定commitから配信し、他の製品ファイルは両sourceで同一。入力から操作結果の読取りは6〜11msで、修正前はUndo不発／Redoで旧本文復活、修正後はUndoで空へ／Redoで新規入力保持。Redoの準備では最初の本文が通常のデバウンスで確定したことを待ち、次の入力だけを未確定にした。証跡は `output/playwright/nov02-undo-default-timing/readback.json` と4枚のPNG。

## 新候補と実機観察

| 対象 | 識別・結果 |
| --- | --- |
| Source | `c61d9c0d46c25b074bab963305f085bd5e837174` / clean |
| Checkpoint | `output/release-readiness/2026-11-02/c61d9c0-undo-wiki-checkpoint/checkpoint.json` |
| Checkpoint SHA256 | `8a41b801adca8f710a016dd86c1d306f00ef42969af67a9d4857f60f65551384` |
| Executable | `output/electron-candidates/c61d9c0d46c25b074bab963305f085bd5e837174/build/win-unpacked/Zen Writer.exe` |
| Executable SHA256 | `207c30bcdf032d138774285e2018712515e676ed448b39ab398b36af6be4cbbe` |
| app.asar SHA256 | `bb4587f50acd4cf3ffa41d7054f47c6dbb4e588e5d88842dcaf4f28069a9fb43` |
| 梱包照合 | checkpointの5 source + Wiki JS/CSSの2 sourceが一致。packed / installed / lockのmarkdown-itは14.3.0で一致 |
| 隔離profile | `output/verification-profiles/c61d9c0-undo-wiki-native` |
| テスト本文 | `Codex Undo Wiki c61d9c0 saved recovery.x`（40文字） |
| 保存・復帰 | 本文・40文字・保存済みを確認 → Alt+F4 → 候補process 0件 → 同じexe/profileで再起動 → 同じ本文・40文字・保存済み → Alt+F4 → process 0件 |
| 観察後の同一性 | exe / app.asar / original checkpointのSHAが観察前後で一致 |
| 人の受入 | pending。original checkpoint / operator sheetは変更せず、technical観察を別JSONへ記録 |

native確認はWindows Computer Useによる操作とAX/screenshotの読戻し。GUI入力toolの貼付けが `v` だけになったため、その試行を合格とせず、編集面のValue設定後に実キー `x` を入力した。本文同期後の40文字と保存済み、再起動後の完全一致をもって判定した。閉じるbuttonへのclickは反応を確認できなかったため、通常のAlt+F4で終了した。初期のHidden起動は対象windowを取得できず、未入力の当該test processだけを止めて、別の新規profileでNormal起動した。これらをnative全操作の合格や本人の操作感受入へ広げない。

隔離して再度開く場合は、上記Executableに `--verification-user-data-dir=` で上記profileの絶対パスを指定する。通常の `app:open:package` は固定の旧build先を指すため、この候補の起動確認には使わない。

追加の証跡はcheckpoint folder内の `wiki-packed-content.json` と `native-technical-observation.json`。技術確認後の追記commitは資料だけで、candidate sourceを変更しない。独立した本人受入・native IME・他端末・通常起動先切替・公開配布は今回未実施。
