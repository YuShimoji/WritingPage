# editor-markdown Specification

## Purpose
TBD - created by archiving change ui-future-enhancements. Update Purpose after archive.
## Requirements
### Requirement: Typora-like Markdown Editing
The editor SHALL support Markdown authoring with live preview and familiar shortcuts.

#### Scenario: Live preview
- WHEN Markdown content is edited
- THEN a preview updates in near real-time with minimal flicker
- AND preview panel supports collapsible/expandable state
- AND preview scrolls synchronously with editor (optional sync toggle)

#### Scenario: Keyboard behaviors
- WHEN user types list markers (e.g., "- " or "1. ")
- THEN the editor auto-continues the list on Enter
- WHEN user types heading markers (e.g., "# " or "## ")
- THEN the editor applies heading formatting
- WHEN user presses Ctrl+B or Cmd+B
- THEN selected text is wrapped in **bold**
- WHEN user presses Ctrl+I or Cmd+I
- THEN selected text is wrapped in *italic*
- WHEN user presses Ctrl+K or Cmd+K
- THEN selected text is wrapped in [link](url)
- WHEN user presses Ctrl+Shift+K or Cmd+Shift+K
- THEN selected text is wrapped in `code`

#### Scenario: Image embeds
- WHEN user inserts images (asset:// or data URL)
- THEN preview renders images with alt text and clickable links
- AND export to .md preserves asset:// links as relative paths
- AND export to .txt inlines base64 data URLs
- AND image size/alignment follows asset metadata

#### Scenario: Table editing
- WHEN user types | separated values
- THEN editor recognizes table and provides navigation shortcuts
- WHEN user presses Tab in table cell
- THEN cursor moves to next cell

#### Scenario: Code blocks
- WHEN user types ```
- THEN editor highlights code with syntax coloring
- AND supports language-specific indentation

#### Scenario: Performance
- WHEN editing large documents (>10k lines)
- THEN preview update latency < 100ms
- AND memory usage scales linearly with document size

