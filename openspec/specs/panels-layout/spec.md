# panels-layout Specification

## Purpose
パネルのドッキング・分割・再配置機能を定義する。セッション間での永続化を規定（将来実装予定）。
## Requirements
### Requirement: Flexible Panels Layout (Docking/Split)
The system SHALL allow docking, splitting, and rearranging panels with persistence across sessions.

#### Scenario: Split editor vertically
- WHEN user drags a panel to the right zone
- THEN a vertical split is created and layout persists

#### Scenario: Detach/Attach
- WHEN user detaches a panel
- THEN it becomes a floating pane and can be reattached to zones

