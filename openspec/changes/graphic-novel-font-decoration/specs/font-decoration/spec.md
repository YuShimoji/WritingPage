## ADDED Requirements

### Requirement: Font decoration tags
The system MUST support applying font decoration effects using tag-like inline markers.

#### Scenario: Apply bold decoration
- **GIVEN** the editor contains text wrapped with a bold marker
- **WHEN** the editor renders the decorated content
- **THEN** the decorated text is displayed with a bold font weight

#### Scenario: Apply underline decoration
- **GIVEN** the editor contains text wrapped with an underline marker
- **WHEN** the editor renders the decorated content
- **THEN** the decorated text is displayed with underline styling
