# 10月候補から4件の保存・変換修正を main へ統合

調査・検証日: 2026-11-02 JST。統合前 main は `43432f75b8da546e3387d4593af0124db5a0d243`、候補は `2966f3caf0682c6741dea88b967e1593d06abe1a`。着手時の main と remote は一致し、作業ツリーは clean。main の branch protection は無効で、通常 push の禁止はなかった。

本人依頼:

> 10月の修正候補をレビューして、再現した4件の不具合修正をmainへ統合してください。検証と現状資料の更新、commit・pushまで進めてください。

## レビューと採用範囲

候補全体の merge/cherry-pick は行わず、4件に関係する変更を選択した。Wiki の2件は同じ cache／IDB 保存経路を共有する。

| 不具合 | 修正前の観測 | 採用した修正と確認 |
| --- | --- | --- |
| Wiki の削除復活 | ブラウザで記事を削除して reload すると、削除記事が再出現 | 明示削除 ID を LocalStorage に保留し、IDB の delete/upsert を単一 transaction へ。reload・最後の記事の削除・失敗 retry を確認 |
| Wiki の編集巻き戻り | 編集・IDB 保存後、保留した古い read を解放すると cache が古い本文へ戻る | session 内の編集世代と保存中状態で初期読込みを制限。保存を直列化し、保存中に行った次の編集と削除を反映。未読記事を保持し、transaction abort 時の部分更新を防ぐ |
| 空見出し消失 | 実際の Rich serializer で空 H1〜H6／末尾の空章境界が消失 | Turndown の blank-node 処理前に空見出しを保護し、末尾 space を含めて復元。fragment も同じ経路へ。JSON import は明示空章名を保持し、欠落／非文字列だけ補完 |
| 揃え付き段落の本文置換 | 11段落の `Distinct10` が `Distinct1` になる | 原稿内の literal／entity を避けた区切り付き token と callback 置換へ。11段落の保存・reload・実表示 preview・Reader まで本文を照合 |

製品変更は `js/storage.js`、`js/storage-idb.js`、`js/editor-wysiwyg.js`、`js/zw-markdown-it-body.js` の4ファイル。IDB version／WikiEntry schema は変更していない。履歴のない過去記事の自動削除、複数 window／cloud の競合方針も追加していない。

候補内の toolbar 配置・link 表示、Widget/loadout、Undo/Redo、Enter 後の太字解除、Rich 用の揃え描画拡張、HTML export、build 出力先変更は未採用。候補の `CURRENT_STATE` による既存履歴の置換も取り込んでいない。7月 toolbar branch、10月候補全体、CI binding branch の統合完了を意味しない。

## 検証

| 検査 | 結果 | 証明する範囲 |
| --- | --- | --- |
| 修正前の新規 unit 9件 | 7 fail / 2 pass | 空見出し・揃え token の旧処理で失敗し、Wiki 削除保留も未実装であること |
| 修正前の Wiki `[repro]` E2E | 2 fail | 実ブラウザの削除復活・遅延読込みによる巻き戻り |
| 修正後の unit 全件 | 46/46 pass | 既存36件と追加10件。変換の literal/code/entity、置換記号、空章名 import、LocalStorage fallback を含む |
| Wiki／import／章同期／段落揃え E2E | 19/19 pass | Wiki6件に加え、関連する既存保存経路 |
| 保存変換／Reader／執筆開始／Documents／Editor Trust E2E | 21/21 pass | 空見出しと11段落の新規2件、Reader pipeline と日常保存・復帰・入出力の既存経路 |
| JS lint、dist build、smoke、diff check | pass | 静的検査、Web build、入口契約と差分整合 |

focused E2E は2回の実行の合計40件であり、単一 full suite の成功ではない。Node `v22.19.0`／npm `10.9.3` の既存環境で実施。npm は package の11系指定と不一致のままであり、package 再生成前の整備は残る。unit の不正 JSON／強制保存失敗、Wiki の注入失敗／transaction abort の警告は、該当する負例の期待結果として検査した。

文書 lint は CURRENT_STATE に既存13件、USER_REQUEST_LEDGER に既存24件の警告がある。HEAD の同一本文との比較で増加なし。INVARIANTS と新規検証資料は警告0件。履歴の見出しや意図したコード内 space を今回の範囲で一括修正していない。

ローカル証跡は Git 管理外:

- 修正前ブラウザ: `output/playwright/nov02-four-fixes-red/`
- 修正後19件: `output/playwright/nov02-four-fixes-green/`
- 修正後21件: `output/playwright/nov02-four-fixes-workflow/` と `output/nov02-workflow-e2e.log`
- unit／smoke: `output/nov02-unit.log`、`output/nov02-smoke.log`

commit 後の exact HEAD と push 到達点は Git で読む。この記録のローカル40件を remote full CI 成功へ読み替えない。push 先は既存 upstream の `origin/main`。

## 残る作業

- 次候補のソースを確定し、未統合の exact CI binding を評価して、新しい package と証拠を結ぶ。
- Wiki の title 一意・カテゴリ追加 UI は今回の対象外で、10月候補でも未解消。
- Electron の起動・入力・保存・終了・再起動・復帰、複数 window、native IME、Documents の体感受入は今回未実施。既存 package の合格は継承しない。
- この checkout の既存 exe は SHA256 `6253997b504407f4148f7396812409a628381664027c52d9c04796204b494779`。app.asar の markdown-it は14.1.0で、main の14.3.0と異なる。既存 exe を今回の修正済み候補として起動しない。
