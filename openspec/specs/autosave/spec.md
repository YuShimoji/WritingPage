# autosave Specification

## Purpose
自動保存とスナップショット機能の要件を定義する。編集内容の自動永続化、スナップショット作成・復元、保持ポリシーを規定。
## Requirements
### Requirement: Autosave & Snapshot Controls
The system SHALL autosave on edits and support configurable snapshot thresholds and intervals, including restore UI.

#### Scenario: Autosave
- WHEN content changes
- THEN it persists without explicit user action

#### Scenario: Snapshot threshold
- WHEN both time and content delta exceed configured thresholds
- THEN a snapshot is created and older ones are pruned by retention policy

#### Scenario: Restore snapshot
- WHEN user selects a snapshot
- THEN content restores and previous state is preserved as a new snapshot

