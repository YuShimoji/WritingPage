# Editor Trust Workflow

Zen Writer の保存信頼性を説明する短い入口。実装上の不変条件は `docs/INVARIANTS.md`、UI 状態モデルと報告形式は `docs/INTERACTION_NOTES.md`、現在の作業状態は `docs/CURRENT_STATE.md` を正とする。

## 保存モデル

- 本文と章構造は、このブラウザ上のローカル保存に保持される。主な保存先は IndexedDB / LocalStorage。
- 通常の本文入力は自動保存される。Documents の `保存` は現在本文を明示保存する入口。
- `#writing-status-chip` は通常執筆中に保存状態を表示する。少なくとも `編集中`、`保存済み`、`保存失敗` をユーザーが観測できる。
- chapterMode では、章レコードが存在する場合だけ親 document の結合本文として保存・書き出しへ使う。章がない document を close / reload するとき、空の assembled text で本文を上書きしない。
- current selection が章レコードを指していても、保存・書き出し対象は親 document へ正規化する。

## 外部退避

- Documents の `入出力` は、現行 UI では `TXT書き出し`、`JSON書き出し`、`JSON読み込み` を扱う。
- TXT は現在本文の外部退避、JSON は本文と章構造の外部退避。
- Markdown export は editor export API / legacy Documents 経路に残る現行対応範囲として検証する。現行 Documents hierarchy の `入出力` menu には Markdown 項目を追加しない。
- JSON import は既存文書を上書きせず、新規 document として復元する。不正 JSON は既存 document を変更せず失敗する。
- JSON import が失敗したときは、通知で現在の文書が保持されたことまで伝える。

## 同期しないこと

- 別端末同期、cloud sync、外部 DB、auth、Google Drive / Keep 連携はこの workflow の対象外。
- TXT / JSON 書き出しは外部退避であり、別端末同期の代替ではない。
- 壊れた JSON import、保存失敗、権限・quota などの失敗は、既存 project を破壊しない方向で扱う。
