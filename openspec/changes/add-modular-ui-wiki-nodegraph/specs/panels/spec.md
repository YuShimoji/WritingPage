## ADDED Requirements
### Requirement: Multi-Panel and Multi-Sidebar Architecture
システムは、複数のパネル領域にガジェットやエディタを柔軟に配置できる設計を提供しなければならない（SHALL）。

- Dockable パネル API を公開（createDockablePanel/showPanel/closePanel/move/split）。
- 将来的に複数のサイドバー（左/右）やサイズ変更をサポートする。
- サイドバー幅は可変で、ユーザー設定に保存される。

#### Scenario: Open in dockable panel
- WHEN ガジェットが拡大ビューを要求
- THEN パネルとして表示され、移動やサイズ変更が可能（将来）。

### Requirement: Multiple Editor Panes (Plan)
システムは、エディタを複数開いてタブ/パネルとして配置できる設計を提供しなければならない（SHALL）。

- エディタインスタンスごとに現在ドキュメントIDを持ち、編集内容を独立して保存。

#### Scenario: Open second editor tab
- WHEN ユーザーが「新しいエディタ」を開く
- THEN 2つ目のエディタタブが作成される（将来）
