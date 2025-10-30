## ADDED Requirements
### Requirement: Tabs Presentation Strategies
システムは、サイドバー主要タブの表示形式を選択可能にしなければならない（SHALL）。

- システムは tabsPresentation を settings.ui.tabsPresentation に保存する。
- 表示方式は 'buttons' | 'tabs' | 'dropdown' | 'accordion' をサポートする。
- ルートコンテナに data-tabs-presentation 属性を付与し、CSS/A11y を切替える。

#### Scenario: 切替と永続化
- WHEN ユーザーが UI Settings ガジェットで presentation を 'accordion' に変更
- THEN サイドバーはアコーディオンで表示される
- AND 次回起動時も同様に表示される

### Requirement: Sidebar Width Adjustment
システムは、ユーザーがサイドバー幅を調整できる機能を提供しなければならない（SHALL）。

- システムは settings.ui.sidebarWidth を保存/適用する（範囲 220px–560px）。
- 変更は即時適用され、次回起動時に復元される。

#### Scenario: スライダーで変更
- WHEN ユーザーがサイドバー幅を 420px に設定
- THEN サイドバーは 420px で表示される
- AND 再読込後も 420px が維持される

### Requirement: List Presentation Strategy (Future-proof)
システムは、ガジェット内リストに同一のプレゼンテーション戦略を適用可能な設計を提供しなければならない（SHALL）。

- システムは data-list-presentation 属性による表示切替 API を公開する（ガジェット任意実装）。
- UI Settings ガジェットからの適用は将来的対応（現状は spec のみ）。

#### Scenario: ガジェット内リストの戦略適用（将来）
- WHEN ガジェットが data-list-presentation="dropdown" を設定
- THEN そのガジェットのリストはドロップダウン表示になる
