# Top Menu Cleanup Capability

## REMOVED Requirements

#### Scenario: Calendar element
- GIVEN top menu
- THEN calendar element is removed
- AND no unrequested calendar displays

## MODIFIED Requirements

#### Scenario: Writing goal visibility
- WHEN WritingGoal gadget is disabled
- THEN writing goal elements do not appear in top menu
- AND re-enable when gadget is activated
