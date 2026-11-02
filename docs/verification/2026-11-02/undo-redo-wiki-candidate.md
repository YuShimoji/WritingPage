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
- 修正sourceのcommit / push後、そのSHAのCIを確認してから新checkpoint / packageを生成する。
- Wikiを含む `js/story-wiki.js` / `css/style.css` も梱包内容とsourceのhashを照合する。
- 新候補の隔離profileでの保存・終了・再起動・復帰は未実施。前候補 `33dd238` の結果を継承しない。

初期見込み45〜90分。画面再現後の残り見込み35〜65分。CI、package build、native操作に幅があり、時間を停止条件にはしない。

## ローカル証跡

- 最初の試行: `output/playwright/nov02-undo-red/`、`output/nov02-undo-red.log`
- 修正前の最終再現: `output/playwright/nov02-undo-red-confirmed/`、`output/nov02-undo-red-confirmed.log`
- 修正後: `output/playwright/nov02-undo-green/`、`output/nov02-undo-green.log`
- unit / smoke: `output/nov02-undo-unit.log`、`output/nov02-undo-smoke.log`

generated evidence はGit管理外。Electronの技術確認、本人の操作感受入、通常起動先の切替、外部公開・配布を分けて記録する。
