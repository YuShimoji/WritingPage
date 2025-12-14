# Sidebar Tab Switching Capability

## MODIFIED Requirements

### Requirement: Sidebar Tab Switching
The system MUST update the active tab state and the corresponding panel state when a sidebar tab is selected.

#### Scenario: User clicks on sidebar tab button
- **WHEN** user clicks a sidebar tab button
- **THEN** the active tab receives 'active' class and aria-selected='true'
- **AND** other tabs lose 'active' class and aria-selected='false'
- **AND** corresponding panel receives 'active' class and aria-hidden='false'
- **AND** other panels lose 'active' class and aria-hidden='true'

#### Scenario: Dynamic tab addition
- **WHEN** new tab is added via ZWGadgets.addTab
- **THEN** the new tab button is clickable
- **AND** follows same switching behavior as static tabs
