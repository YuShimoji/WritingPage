# images-interactive Specification

## Purpose
Define requirements for interactive image controls and presets, including per-image persistence.
## Requirements
### Requirement: Interactive Image Controls
The system SHALL provide interactive controls and presets for images, including VN-oriented behavior.

#### Scenario: Preset selection
- WHEN user chooses a preset (e.g., VN/CG style)
- THEN image parameters apply (size, alignment, opacity, filters)

#### Scenario: Fine-grained controls
- WHEN user adjusts numeric parameters
- THEN changes apply immediately and persist per image

#### Scenario: Hover interactions
- WHEN user hovers over an image overlay
- THEN interactive handles and toggles appear

