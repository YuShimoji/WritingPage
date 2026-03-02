# Top Menu Cleanup Capability

## REMOVED Requirements

### Requirement: Remove calendar element
The system MUST NOT display an unrequested calendar element in the top menu.

#### Scenario: Calendar element
- **GIVEN** top menu
- **THEN** calendar element is removed
- **AND** no unrequested calendar displays

## ADDED Requirements

### Requirement: Writing goal visibility
The system MUST show or hide writing goal elements in the top menu based on whether the WritingGoal gadget is enabled.

#### Scenario: Writing goal visibility
- **WHEN** WritingGoal gadget is disabled
- **THEN** writing goal elements do not appear in top menu
- **AND** re-enable when gadget is activated
