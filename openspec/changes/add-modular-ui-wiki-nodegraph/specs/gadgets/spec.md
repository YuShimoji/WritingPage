## ADDED Requirements
### Requirement: Gadgetization of Editor Features
システムは、Typewriter, Snapshot Manager, Markdown Preview, Font Decoration, Text Animation をガジェットとして提供しなければならない（SHALL）。

- 各ガジェットは ZWGadgets.register で登録され、タイトルと配置グループを持つ。
- 各ガジェットは設定変更時に ZWGadgets の settings API を通じて永続化される。
- 設定変更は可能な限り即時反映される（例: Typewriter 適用、プレビュー開閉）。

#### Scenario: Typewriter Gadget
- WHEN ユーザーが Typewriter ガジェットで enabled を ON にする
- THEN エディタのスクロールがアンカー位置に追従する

#### Scenario: Snapshot Manager Gadget
- WHEN ユーザーが「今すぐスナップショット」をクリックする
- THEN 現在の本文がスナップショットに保存される

#### Scenario: Markdown Preview Gadget
- WHEN ユーザーが「プレビュー開閉」を押す
- THEN プレビュー領域が折りたたまれる/展開される

### Requirement: Gadget Group Assignment
ガジェットの配置タブは手動で変更可能であり、その割当はロードアウト適用時にも保持されなければならない（SHALL）。

- 手動割当は loadout 適用で上書きされない。
- 既定のロードアウトがマッピングを持たない場合、現状の割当を維持する。

#### Scenario: Manual move persists
- WHEN ユーザーがガジェットを assist→structure に移動
- AND ロードアウトを適用
- THEN ガジェットは structure に留まる
