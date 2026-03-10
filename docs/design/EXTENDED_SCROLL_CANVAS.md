# 拡張スクロール機能 開発設計

## 対象

- 仕様: `docs/specs/spec-extended-scroll-canvas.md`
- 連携仕様: `docs/specs/spec-richtext-enhancement.md`
- 既存実装: `index.html`, `css/style.css`, `js/editor.js`, `js/editor-wysiwyg.js`, `js/modules/editor/*`

---

## 設計方針

- 既存Classic編集系を温存し、Canvas Modeを横に追加する
- Markdown正本は維持し、Canvas情報は設定/メタとして分離保存する
- 入力安定性（キャレット・IME）を最優先し、変形は段階導入する
- 初期リリースは単一ノードを正式対象とし、複数ノードはPhase 2で導入する

---

## アーキテクチャ

## 1. 新規モジュール

### `js/modules/editor/CanvasViewportController.js`

責務:
- pan/zoom/rotation状態管理
- Pointer/Wheel/Touchジェスチャ解釈
- Viewport行列の生成と適用

主要API:
- `setPan(x, y)`
- `setZoom(z, anchor)`
- `setRotation(deg)`
- `screenToWorld(point)`
- `worldToScreen(point)`
- `resetView()`

### `js/modules/editor/CanvasNodeStore.js`

責務:
- Text NodeのCRUD
- ノード順序・サイズ・位置の永続化
- `contentRef` と本文ストレージの関連付け

主要API:
- `createNode(direction, fromNodeId)`
- `updateNodeRect(id, patch)`
- `deleteNode(id)`
- `serialize()` / `hydrate(data)`

### `js/modules/editor/CanvasRenderLayer.js`

責務:
- Canvas DOMレイヤ構築
- ノード、ミニマップ、選択枠の描画
- 表示領域外ノードの更新抑制

主要API:
- `mount(containerEl)`
- `render(viewState, nodes)`
- `setActiveNode(id)`

### `js/modules/editor/CanvasRichTextBridge.js`

責務:
- `fixedTextScale` 時の逆スケール補正
- WYSIWYG (`contenteditable`) とCanvas transformの整合
- 回転導入時の入力面補正

主要API:
- `applyTextScaleCompensation(nodeEl, zoom)`
- `syncWysiwygNode(nodeId)`
- `syncTextareaNode(nodeId)`

---

## 2. 既存改修

### `index.html`

- `editor-container` 直下にCanvas Layerを追加
- 既存 `#editor`, `#wysiwyg-editor` はClassic Layerに残す
- 追加案:
  - `#editor-canvas-root`
  - `#editor-canvas-viewport`
  - `#editor-canvas-hud`

### `css/style.css`

- Canvas Mode用スタイルを追加:
  - `.editor-container[data-mode="canvas"]`
  - `.canvas-viewport`
  - `.canvas-node`
  - `.canvas-hud`
- 既存レイアウトとの衝突を避けるため、`data-mode` スコープで限定

### `js/editor.js`

- `EditorManager` にCanvas制御委譲を追加
- 起動時に `CanvasViewportController` / `CanvasNodeStore` を初期化
- モード切替時にClassic系イベントとCanvas系イベントを排他制御

### `js/modules/editor/EditorCore.js`

- 保存処理を拡張:
  - 本文: 従来通り `saveContent`
  - Canvasメタ: `saveEditorCanvasState`（新設）
- 読み込み時にCanvas状態を復元

### `js/storage.js`

- `DEFAULT_SETTINGS.editor.canvas` を追加
- マイグレーション:
  - 既存ユーザーは初回起動時に `node-main` 自動生成

### `js/editor-wysiwyg.js`

- Canvas Mode中の同期タイミングを制御
- `fixedTextScale` 時のフォント見かけサイズ固定をBridge経由で適用

---

## イベント設計

- `ZWCanvasViewChanged`
  - detail: `{ panX, panY, zoom, rotation }`
- `ZWCanvasNodeChanged`
  - detail: `{ id, x, y, w, h }`
- `ZWCanvasModeChanged`
  - detail: `{ enabled }`

利用先:
- HUD更新
- ミニマップ更新
- 将来のプラグイン連携

---

## 入力モデル

## 優先順位

1. テキスト選択/入力中は編集優先
2. `Space` 押下中のみパン優先
3. タッチ2本指は常にパン/ズーム優先

## IME配慮

- `compositionstart` 中はパン開始を抑止
- `compositionend` 後にジェスチャ状態を再評価

---

## パフォーマンス設計

- 変形更新は `requestAnimationFrame` で集約
- 高頻度イベントは state更新のみで、DOM再描画は1フレーム1回
- ノード数閾値（例: 50）以上でミニマップ詳細を簡略表示
- 回転+ズーム時にテキストぼやけが出る場合は `transform: translateZ(0)` を限定適用

---

## テスト設計

## 1. E2E（新規）

- `e2e/editor-canvas-navigation.spec.js`
  - パン・ズーム・リセット
  - Space+Drag
  - タッチ相当イベント（可能範囲）
- `e2e/editor-canvas-fixed-text-scale.spec.js`
  - ズーム変化時の文字サイズ維持
  - WYSIWYG切替後も視認サイズが維持される
- `e2e/editor-canvas-rotation.spec.js`
  - 回転後の入力継続性

## 2. 既存回帰

- `e2e/editor-scroll-regression.spec.js` をCanvas Modeも含めて拡張
- `e2e/wysiwyg-editor.spec.js` の主要ケースをCanvas ON/OFFで実行

---

## 実装ステップ（推奨）

1. Viewport Controller + Canvas rootの骨組み実装（機能フラグ付き）
2. pan/zoomのみ先行（単一ノード）
3. fixedTextScale + richtext連携
4. 回転導入（Editor全体回転のみ）
5. ノード追加（上下左右）
6. ミニマップ・ショートカット・UX調整

---

## ロールアウト方針

- 初期は設定トグルで `Canvas Mode (beta)` として提供
- 既定OFFで段階検証し、E2E安定後に既定ONを再評価
- 既存文書互換性を壊す変更は禁止（Markdown本文への破壊的埋め込み禁止）

---

## 既知リスク

- `contenteditable` + CSS transform のブラウザ差
- Overlay画像座標系とCanvas座標系の同期コスト
- タッチ端末での誤ジェスチャ（編集とパンの衝突）

対策:
- Transform対象の分離（入力面と視覚補助面）
- ジェスチャ閾値（移動px/時間）を設定化
- 早期にPlaywrightで回帰シナリオを固定
