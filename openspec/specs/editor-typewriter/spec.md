# editor-typewriter Specification

## Purpose
タイプライターモード機能を定義する。キャレット位置の固定アンカー、スティッキネス設定を規定（将来実装予定）。
## Requirements
### Requirement: Typewriter Mode
The editor SHALL provide a typewriter mode that keeps the caret at a fixed vertical anchor with configurable stickiness.

#### Scenario: Fixed cursor anchor
- WHEN typewriter mode is enabled
- THEN the caret position remains at the configured anchor (default center) during typing and navigation

#### Scenario: Stickiness on newline
- WHEN the user inserts a newline
- THEN the scroll adjusts with a configurable stickiness factor (0.0–1.0)

#### Scenario: Toggle via settings
- WHEN user toggles typewriter mode
- THEN the behavior activates immediately without reload

