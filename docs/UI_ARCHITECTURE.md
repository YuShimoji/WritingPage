# UI Architecture (Panels, Gadgets, Scenes)

> Draft / 開発用メモ。今後の OpenSpec や詳細設計ドキュメントと連携して更新予定。

## Goals

- メインエディタ以外の UI 要素を **疎結合なレイヤ** として整理する。
- Panel / Gadget / Scene / FAB などを共通の概念で扱い、拡張性とテスト容易性を高める。
- 将来の背景グラデーション・動画背景・複数エディタ分割を無理なく追加できる基盤を作る。

## Core Concepts

### Region

- 画面レイアウト上の「場所」の抽象化。
- 例: `top`, `left`, `right`, `bottom`, `floating` など。
- 一つ以上の Panel を含む。

### Panel

- ユーザーに見える「枠」や「ウィンドウ」に相当。
- Region にドッキングされた Panel と、フローティング Panel を同じ概念で扱う。
- パネル内には 1..N 個の GadgetContainer を配置できる。

### Gadget / GadgetContainer

- `Gadget`:
  - 機能の最小単位（例: EditorLayout, Outline, SceneGradient, SnapshotManager...）。
  - UI ロジックと状態はガジェット内に閉じる。
- `GadgetContainer`:
  - 複数の Gadget をまとめる箱。
  - 開閉状態や表示順序、格納場所（Panel / フローティング）を管理する。

### Scene (Background)

- 執筆エリアの「背景」を担当するレイヤ。
- 単色 / グラデーション / パターン / 動画 + ぼかし などを扱う。
- Scene 自体も Gadget として実装し、ON/OFF やプリセット切り替えを行う。

### EditorArea

- 執筆エリア 1 つ分の抽象。
- 主な属性:
  - `id`: 永続 ID（レイアウト保存用）
  - `order`: 画面内の並び順（上から / 右から など）
  - `docId`: 表示対象のドキュメント ID
  - `projectId`: 所属プロジェクト ID（管理はプロジェクト側）

## FAB Layer

- すべての FAB を共通クラス `fab-button` と CSS 変数で管理。
- 個々の FAB は「どの Panel / GadgetContainer を開くか」を指定するだけにする。
- 将来: サイト上の設定 UI から `--fab-size`, `--fab-icon-size`, `--fab-bottom` などを編集できるようにする。

## Scenes & Gradients (Design)

Scene ガジェットは、背景を以下の 3 レイヤ構造で扱うことを想定する。

1. **Base Layer**
   - 単色または基本的な線形/放射/円錐グラデーション。
   - CSS: `background-image: linear-gradient(...)` などを直接利用。

2. **Pattern Layer**
   - 模様・形状・タイル表現を担当するレイヤ。
   - 例:
     - 繰り返しグラデーション (`repeating-linear-gradient` など)
     - タイル状のノイズテクスチャ（将来、Canvas / SVG パターンなど）
   - CSS の `background-size`, `background-repeat` を利用してタイル状に配置。

3. **Overlay Layer**
   - 手前側に半透明の単色 or グラデーションを重ね、
     部分的な強さ・フォーカスの強弱を調整するレイヤ。
   - 例:
     - 中央を明るく、上下端を暗くする vignette 風の表現
     - スクロール位置に応じて強さを変えるフェードエフェクト

### Strength / Local Strength

- 各レイヤには `strength` (0.0 - 1.0) を持たせ、
  - `0.0` なら無効
  - `1.0` なら最大
  - 中間値では `rgba(..., alpha)` を段階的に変化させる。
- 部分的な強さ:
  - 背景グラデーションそのものの色停止 (color stop) を複数持ち、
    エリアごとに透明度や色を変えることで対応。
  - 将来余裕があれば、スクロール位置を入力として shader 風に計算する余地を残す。

### Tiling

- Pattern Layer は CSS の `background-image` / `background-size` / `background-repeat`
  を用いてタイル化する。
- 初期実装では CSS の表現に絞り、Canvas 等の重い処理は別ガジェット（例: `SceneVideo` / `SceneCanvas`）に分離する。

## Panels & Layout PoC

- `js/panels.js` と `css/style.css` / `css/special.css` の `dockable-panel` / `floating-panels` を基盤とする。
- 開発用ページ `docs/ui-lab.html` 上で、以下を確認する:
  - Sidebar Region (`SIDEBAR_LEFT`) にドッキング可能な Panel
  - Floating Panel として画面上を自由に移動できる Panel
  - 将来的な GadgetContainer 追加に備えた Panel 構造

### Left Sidebar Runtime Mapping (PoC)

- 実運用の左サイドバーでは、次のように Region / Panel / GadgetContainer をマッピングする。
  - **Region**: `#sidebar`（左サイドバー全体; `SIDEBAR_LEFT` ゾーン相当）
  - **Panel**: `section.sidebar-group[data-group="<groupId>"]`（各タブに対応するパネル）
  - **GadgetContainer**: `div.gadgets-panel[data-gadget-group="<groupId>"]`（各パネル内のガジェットコンテナ）
- 実装メモ:
  - `SidebarManager._ensureSidebarPanel(groupId, label)` が、左サイドバー用の Panel と GadgetContainer をまとめて生成/確保する薄い抽象レイヤになっている。
  - `SidebarManager.addTab(id, label)` はこのヘルパを利用して `section.sidebar-group` / `div.gadgets-panel` を用意し、`ZWGadgets.init('#' + groupId + '-gadgets-panel', { group: groupId })` を呼び出す。

今後、

- 左サイドバー以外の Region（例: bottom ゾーンやフローティングパネル）にも同様の Panel/GadgetContainer 抽象レイヤを拡張する。
- Panel/GadgetContainer API の安定化
- EditorArea 分割とレイアウト保存形式の定義

を追加し、この文書を更新していきます。

SceneGradient ガジェットの PoC 実装は 2025-12-04 時点で完了済みであり、詳細は HANDOVER.md を参照してください。
