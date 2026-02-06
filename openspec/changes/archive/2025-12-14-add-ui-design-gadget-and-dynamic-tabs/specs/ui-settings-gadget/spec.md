## ADDED Requirements

### Requirement: UI Settings Gadget Enhancements
 The system MUST provide UI Settings gadget controls to add/rename/remove sidebar tabs and MUST apply tab presentation changes immediately.
 UI Settings ガジェットは、サイドバータブの追加/名称変更/削除を提供し、表示方式変更時に即時適用されるUI更新を行わなければならない。

#### Scenario: Manage tabs via gadget
- WHEN ガジェット内のフォームでタブの追加/名称変更/削除を操作
- THEN SidebarManager のAPIが呼ばれ、DOMと設定が整合的に更新される

#### Scenario: Apply presentation mode change
- WHEN タブ表示方式（tabs/buttons/dropdown/accordion）を変更
- THEN `sidebarManager.applyTabsPresentationUI()` により現在のUIに即時反映される
