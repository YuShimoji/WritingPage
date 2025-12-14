## ADDED Requirements

### Requirement: Dynamic Sidebar Tabs Management
 The system MUST allow users to add, rename, and remove sidebar tabs and MUST persist and restore the configuration on startup.
アプリはサイドバータブの追加/名称変更/削除と、設定の永続化・起動時復元を提供しなければならない。

#### Scenario: Add tab
- WHEN ユーザーが UI Settings ガジェットから新しいタブ名を入力し追加
- THEN `SidebarManager.addTab()` が呼ばれ、タブボタンと対応パネルが生成され、`settings.ui.customTabs` に保存される

#### Scenario: Rename tab
- WHEN ユーザーが既存タブを選択し新しい名前に変更
- THEN `SidebarManager.renameTab()` が呼ばれ、ボタン表示と設定が更新される

#### Scenario: Remove tab
- WHEN ユーザーが既存タブを選択し削除
- THEN `SidebarManager.removeTab()` が呼ばれ、ボタンとパネルが削除され、設定からも除去される

#### Scenario: Restore custom tabs on startup
- WHEN アプリ起動
- THEN `settings.ui.customTabs` の内容が復元され、必要に応じて未登録DOMタブは自動登録される
