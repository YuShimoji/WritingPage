## Why
ユーザーテストフィードバックに基づくUI/UX改善を実施。サイドバー展開時のレイアウト崩れ、Wikiガジェットのデータ重複、目標計算の限界、ボタン色固定、スクロールバグ、スタンプ非表示などの問題を解決し、安定したユーザー体験を提供する。

## What Changes
- サイドバー展開時のヘッダー伸縮を修正し、閉じるボタンを配置
- Wikiガジェットの項目名ループと重複を修正
- 目標文字数計算を100%超えで継続し、カレンダー/Clock連携
- ボタン色を変更可能に
- スクロール戻しバグを修正
- 文字数スタンプ表示を修正

## Impact
- Affected specs: ui/spec.md
- Affected code: css/style.css, js/editor.js, js/gadgets.js, js/storage.js, js/app.js, index.html
