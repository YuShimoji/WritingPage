# TASK_056: テキストアニメーション再生機能の修正

## ステータス: OPEN（P2）

## 問題

テキストアニメーションパネル（`#text-animation-panel`）からアニメーション効果（タイプライター、フェードイン等）を適用しても、プレビュー上で再生されず、効果の確認ができない。

## 調査結果

### 現在の実装状況

1. **パネル UI は存在** — `index.html` に `#text-animation-panel` があり、ボタン（`#anim-typewriter`, `#anim-fadein` 等）と設定スライダー（速度・持続時間）が配置済み
2. **タグ挿入は動作** — ボタンクリックで `<typewriter>`, `<fadein>` 等のカスタムタグがテキストに挿入される
3. **アニメーション CSS/JS が未実装または不完全** — 挿入されたタグを実際にアニメーションとしてレンダリングする仕組みが見つからない

### 関連ファイル

- `index.html` L389-431 — パネル HTML
- `js/editor.js` — `font-decor` / `text-anim` パネルのイベント参照あり
- `js/modules/editor/EditorUI.js` — `text-anim` 関連の参照あり
- `e2e/decorations.spec.js` — E2E テストが存在するが一部失敗中

### 不足しているもの

- カスタムタグ (`<typewriter>`, `<fadein>` 等) の CSS アニメーション定義
- Markdown プレビューパネルでのカスタムタグレンダリング対応
- WYSIWYG モードでのアニメーションプレビュー
- `reduce-motion` 設定の CSS `prefers-reduced-motion` 連動

## 修正方針

### Phase 1（最小限）
1. カスタムタグの CSS アニメーション定義を追加
2. Markdown プレビュー時にカスタムタグを保持してレンダリング
3. アニメーション速度・持続時間設定の反映

### Phase 2（Phase 4 ロードマップ連携）
1. WYSIWYG エディタ内でのリアルタイムアニメーションプレビュー
2. アニメーションのタイムライン制御UI
3. `reduce-motion` 設定の完全対応

## 依存

- TASK_055（WYSIWYG 改善）— プレビュー再生はプレビューパネルに依存
- TASK_054（フローティングパネル修正）— パネル操作の前提
