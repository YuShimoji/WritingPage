## ADDED Requirements
### Requirement: Node Graph (Plot/Relationship)
システムは、ノードとエッジを管理し、キャンバス上に可視化する機能を提供しなければならない（SHALL）。

- ノードは位置(w,h,x,y)、色、タイトル、ステータスを持つ。
- エッジは from/to/label を持つ。
- ドキュメント単位の保存（localStorage: `zw_nodegraph:<docId>`）。
- ドラッグ移動と簡易リンク作成を提供する。
- Dockable パネルで拡大ビューを開ける。

#### Scenario: Add node
- WHEN ユーザーが「ノード追加」をクリック
- THEN 新しいノードがキャンバスに追加され保存される

#### Scenario: Link nodes
- WHEN ユーザーが「リンク」をクリック
- THEN 2つのノード間にエッジが作成される
