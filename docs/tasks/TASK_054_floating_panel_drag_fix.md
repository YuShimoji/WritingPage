# TASK_054: フローティングパネルのスクロール追従・ドラッグ不可の修正

## ステータス: OPEN（P1）

## 問題

リッチテキスト関連のフローティングパネル（フォント装飾パネル `#font-decoration-panel`、テキストアニメーションパネル `#text-animation-panel`）が以下の問題を持つ:

1. **スクロール全体に追従** — `position: fixed` で固定表示されるが、エディタのスクロールに対して不自然に追従し、操作の邪魔になる
2. **ドラッグ操作ができない** — `panels.js` にドッカブルパネル向けの `makeDraggable()` が実装されているが、`.floating-panel` クラスのパネルにはこのドラッグ機能が適用されていない

## 根本原因

### 1. スクロール追従

`css/style.css` L1831:
```css
.floating-panel {
  position: fixed;
  right: 16px;
  bottom: 128px;
  z-index: 1600;
}
```

`position: fixed` はビューポート基準のため、ページスクロールには追従しない（正常）。しかしエディタコンテナの `min-height: 100vh` + `align-items: center`（TASK_053）により、ページ全体のスクロール挙動が異常になっており、パネルの位置が結果的にずれて見える。

### 2. ドラッグ不可

`panels.js` の `makeDraggable()` はドッカブルパネルシステム（`createPanel()` で生成されるパネル）にのみ適用される。HTML 直書きの `.floating-panel`（フォント装飾・テキストアニメーション・検索・フィードバック等）はこのシステムの管轄外。

## 修正方針

1. TASK_053 のスクロール修正が前提（スクロール挙動正常化で追従問題は解消見込み）
2. `.floating-panel` にドラッグ機能を追加:
   - `panels.js` の `makeDraggable()` を共用関数として公開
   - `app-ui-events.js` のパネル初期化時に `.panel-header` をドラッグハンドルとして設定
3. パネル位置の保存/復元は将来対応（TASK_054b として分離可能）

## 依存

- TASK_053（エディタスクロール修正）
