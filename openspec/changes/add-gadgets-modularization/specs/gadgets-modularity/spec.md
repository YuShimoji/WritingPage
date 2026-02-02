## MODIFIED Requirements

### Requirement: ZWGadgets Modularity
 The system MUST modularize the ZWGadgets implementation by separating responsibilities to improve maintainability and extensibility.
 ZWGadgets クラスは責務分離によりモジュール化され、保守性と拡張性を向上させる。

#### Scenario: Rendering Queue Extraction
- WHEN ZWGadgetsRenderer モジュールが読み込まれる
- THEN レンダリングキューが独立して管理され、_renderLast が ZWGadgets から切り離される

#### Scenario: Settings Management Extraction
- WHEN ZWGadgetsSettings モジュールが使用される
- THEN 設定永続化が統一APIで提供され、ガジェット設定が分離される

#### Scenario: Loadout Handling Extraction
- WHEN ZWGadgetsLoadouts モジュールが使用される
- THEN ロードアウト管理が独立し、ガジェットグループ管理が簡素化される

## ADDED Requirements

### Requirement: Backward Compatibility
 The system MUST maintain full backward compatibility for the existing ZWGadgets API after modularization.
 既存の ZWGadgets API は変更後も完全に互換性を維持する。

#### Scenario: Existing Code Works
- WHEN 既存のガジェットコードを実行
- THEN すべてのメソッドとイベントが正常動作し、破壊的変更なし
