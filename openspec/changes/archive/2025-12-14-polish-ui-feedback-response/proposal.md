## Why
ユーザーテストフィードバックに基づくUI/UX改善を実施。サイドバー展開時のレイアウト崩れ、Wikiガジェットのデータ重複、目標計算の限界、ボタン色固定、スクロールバグ、スタンプ非表示などの問題を解決し、安定したユーザー体験を提供する。

## What Changes
- サイドバー展開時のヘッダー伸縮を修正し、閉じるボタンを配置
- Wikiガジェットの項目名ループと重複を修正
- 目標文字数計算を100%超えで継続し、カレンダー/Clock連携
- ボタン色を変更可能に
- スクロール戻しバグを修正
- 文字数スタンプ表示を修正

## Implementation Notes (申し送り)
### Undo/Redo保持
- `insertTextAtCursor` を `setRangeText` ベースに変更し、ブラウザのUndoスタックを維持。文字装飾適用時もUndo可能に。

### インライン文字数スタンプ
- 本文へHTML挿入せず、オーバーレイで表示（イタリック・小さめ・半透明）。
- 位置: 選択末尾/段落末尾に表示。スクロール/リサイズで追従。
- 総文字数カウントに非加算。

### 左サイドバー
- ヘッダー非干渉（top:60px, height:calc(100vh-60px)）。
- 開時メインエリアをサイドバー幅だけ押し出し（重なり防止）。
- 開/閉ボタンは同一座標で表示切替。

### 文字装飾
- `setRangeText` でタグ挿入、選択なし時は内側にキャレット移動。
- 本文文字消失を防ぎ、Undo保持。

## Impact
- Affected specs: ui/spec.md
- Affected code: css/style.css, js/editor.js, js/gadgets.js, js/storage.js, js/app.js, index.html
