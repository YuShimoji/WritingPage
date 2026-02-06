## ADDED Requirements

### Requirement: Flexible Panels Layout (Docking/Split)
The system SHALL allow docking, splitting, and rearranging panels with persistence across sessions.

#### Scenario: Split editor vertically
- WHEN user drags a panel to the right zone
- THEN a vertical split is created and layout persists

#### Scenario: Detach/Attach
- WHEN user detaches a panel
- THEN it becomes a floating pane and can be reattached to zones
