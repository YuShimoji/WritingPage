## ADDED Requirements

### Requirement: Icon System Integration
アプリは Lucide アイコンセットを統合し、UI 要素で一貫したアイコンを使用できる機能を提供しなければならない。

#### Scenario: Load icons on page load
- WHEN ページ読み込み時
- THEN Lucide の最小サブセット（Eye, EyeOff, Settings）が非同期で読み込まれ、エラーなく利用可能となる

#### Scenario: Replace overlay toggle emoji
- WHEN overlay-toggle ボタンをクリック
- THEN Eye/EyeOff アイコンが表示され、表示/隠すラベルとともに機能する

#### Scenario: Replace settings emoji in gadgets
- WHEN ガジェット設定ボタンをクリック
- THEN Settings アイコンが表示され、設定パネルを開く

## MODIFIED Requirements

### Requirement: UI Accessibility
UI 要素はアイコン使用でアクセシビリティを向上させなければならない。

#### Scenario: Icon with label
- WHEN アイコン付きボタンをスクリーンリーダーで確認
- THEN 適切な aria-label が付き、意味が伝わる
