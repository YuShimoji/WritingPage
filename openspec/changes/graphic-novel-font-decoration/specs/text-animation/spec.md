## ADDED Requirements

### Requirement: Text animation tags
The system MUST support applying text animation effects using tag-like inline markers.

#### Scenario: Apply fade animation
- **GIVEN** the editor contains text wrapped with a fade marker
- **WHEN** the editor renders the animated content
- **THEN** the decorated text is displayed with a fade animation

#### Scenario: Disable animation
- **GIVEN** the editor contains text wrapped with an animation marker
- **WHEN** the user disables animations
- **THEN** the content is displayed without motion effects
