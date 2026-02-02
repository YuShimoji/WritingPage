## MODIFIED Requirements
### Requirement: Typewriter Mode
システムは、エディタのタイプライターモードを設定（enabled/anchorRatio/stickiness）に基づき適用するものとする（SHALL）。

- caret 位置に応じてスクロール位置をアンカーに合わせて追従させる。
- stickiness により追従の強度（補間）を制御する。

#### Scenario: Follow caret
- WHEN enabled=true かつ 入力/移動
- THEN スクロールがアンカー位置に近づく

### Requirement: Header Buttons Work via Editor API
「フォント装飾」「テキストアニメーション」アイコンは、パネル開閉と適用が機能しなければならない（SHALL）。

#### Scenario: Toggle panels
- WHEN ツールバーアイコンをクリック
- THEN 対応パネルが開閉する

### Requirement: Element Font Size Design (Plan)
システムは、見出しや本文ごとにフォントサイズと色を設定できる仕組みを設計するものとする（SHALL）。

#### Scenario: List and adjust
- WHEN 設定UIで要素ごとのサイズを編集
- THEN プレビューと本文に反映され、保存される
