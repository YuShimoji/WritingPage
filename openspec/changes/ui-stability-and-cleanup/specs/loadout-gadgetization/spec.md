# Loadout Gadgetization Capability

## ADDED Requirements

#### Scenario: Loadout management as gadget
- GIVEN loadout UI is gadgetized
- WHEN user enables LoadoutManager gadget
- THEN loadout selector and buttons appear in sidebar
- AND functionality matches previous hardcoded behavior

#### Scenario: Save current loadout
- WHEN user clicks save button in LoadoutManager
- THEN current gadget configuration is saved as new loadout
- AND loadout appears in selector dropdown

#### Scenario: Apply loadout
- WHEN user selects loadout from dropdown
- THEN gadgets are configured according to saved loadout
