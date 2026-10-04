# 執筆・保存・Wikiの局所修正

この候補は既存mainから製品修正と必要な回帰テストをまとめたsourceである。本文データ、端末別の起動設定、個人の回答・ローカル検証記録は配布内容へ含めない。package・インストーラー・通常入口の更新は行っていない。

| 変更 | 利用者が見る動作 | 回帰で確認する境界 |
|---|---|---|
| RichとMarkdownの往復 | 揃え、太字、改行、空見出しを保存後も保持 | Undo/Redo、段落境界、literal/code/entityを含む往復 |
| 見出しEnterの太字解除 | nativeが解除済みの太字を遅延callbackで再有効化しない | 明示書式、削除/retype、保存/reload |
| 選択toolbar | 操作中は待ち、選択行と隣接行の外へ配置する | keyboard focus、Escape、狭い画面、書式操作 |
| Reader/HTML | align/strike等を単独HTMLへ反映 | 表示・退避・再読込の意味の一致 |
| Widget/loadout/保存案内 | detach設定、複製/削除、保存状態と継続focusを保持 | reload、既存設定、実際の保存flag |
| Wiki IDB | 削除記事を再読込で復活させず、古いread結果で編集を戻さない | 空集合、古い保存中の次変更、失敗retry、atomic rollback、本文Undo |

Wikiは既知の明示削除IDだけを保留し、1 transactionでdeleteとupsertをcommitする。未読記事を一括clearせず、明示復元は削除保留を取消す。WikiEntry schema/IDB versionを変更せず、履歴のない過去記事を自動削除しない。複数window/cloudの競合方式は変更しない。

引継いだ同版コードのWikiブラウザ証拠は5件＋制御fixtureを補正した2件の合成で、単一7件runではない。local fallbackと既存保存unit9件も成功している。以前の失敗注入/abortのwarningは想定した負例として分類した。検証には架空の本文/Wikiと独立profileのみを用いた。

今回export候補では、製品コード/資産/テストが検証元とbyte一致することを確認し、選定したunit6ファイル20件が成功し、選定29JSのlintが成功した。軽量検証は単一workerで直列実行した。全browser suiteやnativeの新しい合格は主張しない。rawの端末別証拠と元の開発記録は別途保全している。

残る作業: このsourceのpackage化・正規native確認、Wikiのカテゴリ追加UI/title一意、Richの表編集、cloud方式選定。個々の仕様採用・通常切替と外部公開を区別する。
