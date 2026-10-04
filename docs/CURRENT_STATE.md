# Current State

<!-- CURRENT_STATE_LIVE_START -->

このbranchには、既存mainを基点にした執筆・保存・出力・ウィジェットの局所修正が含まれる。製品コードと回帰テストの候補であり、新しいpackageや通常入口への反映はまだ行っていない。

| 操作 | このsourceの変更 | 残る確認 |
|---|---|---|
| Rich編集・保存 | 書式を含む保存往復、Undo/Redo、揃え付き段落の改行、空章名/空見出し、見出しEnter後の太字解除を修正 | 全IME・縦書き/RTL・全組合せ |
| 選択・操作案内 | 選択本文を覆わないtoolbar、保存表示/focus、loadout複製/削除、Widget detach/restoreを修正 | 実機の操作感・全入力機器 |
| Reader・HTML | align/strike等の表示とstandalone HTML出力を修正 | 全装飾・複合DSLのparity |
| Wiki保存 | 明示削除を保持し、遅いIDB読込みによる編集上書きを防止。保存世代を直列化し原子的に反映 | 複数window・native |

基本の執筆・章・Reader・ローカル保存、Wiki CRUD/リンク/graph、ウィジェット、Rich・装飾は実装されている。Wikiカテゴリ追加UI/title一意、専用表編集、話metadataの導線などには残件がある。cloud本文同期は未実装で方式は未採用ドラフト。全面デザイン変更・remote plugin・新しい削除/同期policyをこの候補へ追加しない。

変更の説明と確認範囲は [公開用修正ノート](verification/2026-10-04/exported-writing-fixes.md)。操作契約は [INTERACTION_NOTES](INTERACTION_NOTES.md)、保存契約は [INVARIANTS](INVARIANTS.md) を参照。過去の仕様索引doneや旧package確認を、この候補の全機能完成やnative成功に置き換えない。

次にこのsourceを評価するときは、必要なFrontend回帰を確認し、packageを作る場合は別identityにする。正規nativeでの起動・入力・保存・再起動・復帰と、通常切替前の未保存/原稿継続は別工程。

<!-- CURRENT_STATE_LIVE_END -->
