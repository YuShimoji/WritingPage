# TASK_053: エディタ領域スクロール不能の修正

## ステータス: OPEN（P0 — 執筆不能）

## 問題

エディタ（`#editor` textarea）にテキストを入力し、画面外に達した後、上方向へスクロールして戻れない。執筆の基本操作が不可能になる致命的バグ。

## 根本原因（調査結果）

`css/layout.css` の `.editor-container` に以下の組み合わせがある:

```css
.editor-container {
  flex: 1;
  display: flex;
  align-items: center;   /* ← 原因 */
  min-height: 100vh;
  position: relative;
}
```

**`align-items: center` + `min-height: 100vh`** が問題。Flex コンテナの交差軸（縦方向）で中央寄せしているため、内容がコンテナより高くなると上端がコンテナの表示領域外に押し出され、スクロールで到達できなくなる。これは CSS Flexbox の既知問題（"flex centering overflow" 問題）。

### 副次的要因

- `#editor` は `overflow: auto` だが `scrollbar-width: none` でスクロールバー非表示のため、スクロール可能であることがユーザーに伝わらない
- `.editor-container` 自体に `overflow` プロパティが未設定
- スプリットビュー（`split-view.js`）がエディタ要素を DOM ツリー間で移動させるため、復帰時にレイアウトが壊れる可能性あり

## 修正方針

1. `.editor-container` の `align-items: center` を `align-items: flex-start` に変更
2. エディタの縦方向の中央寄せが必要な場合は `margin: auto` で代替（overflow-safe）
3. `#editor` に明示的な `height` を設定（`calc(100vh - var(--toolbar-height))` 等）
4. スクロールバーの視認性について検討（`scrollbar-width: thin` への変更検討）

## 影響範囲

- `css/layout.css` — `.editor-container`, `#editor`
- `css/style.css` — `#editor`, `#wysiwyg-editor` のパディング
- `js/split-view.js` — エディタ復帰時のレイアウト検証

## テスト

- テキストを大量入力 → 上方向スクロールで先頭に戻れること
- ツールバー表示/非表示でレイアウトが崩れないこと
- スプリットビュー → 通常ビュー復帰後にスクロールが正常なこと
- モバイルビューポートでの動作確認
