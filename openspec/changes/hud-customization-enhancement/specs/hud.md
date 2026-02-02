# HUD Customization Enhancement

## Overview
Extend the Mini HUD feature with additional customization options for width and font size to improve user experience and visual accessibility.

## MODIFIED Requirements

### HUD Settings Gadget
The HUDSettings gadget shall include width and font size controls.

#### Scenario: User adjusts HUD width
Given the HUDSettings gadget is open
When user changes width input to 300
Then HUD width updates to 300px immediately
And setting persists in localStorage

#### Scenario: User adjusts HUD font size
Given the HUDSettings gadget is open
When user changes font size input to 16
Then HUD font size updates to 16px immediately
And setting persists in localStorage

#### Scenario: Invalid width input
Given width input receives 1000
When input loses focus
Then width is clamped to 800px

#### Scenario: Invalid font size input
Given font size input receives 5
When input loses focus
Then font size is clamped to 10px

## Constraints
- Width range: 120-800px
- Font size range: 10-24px
- Backward compatible with existing settings
