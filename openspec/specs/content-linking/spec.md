# content-linking Specification

## Purpose
ドキュメント間・セクション間・アセット間のリンク機能を定義する。内部リンク、外部リンク、リンク検証を規定（将来実装予定）。
## Requirements
### Requirement: Content Linking Across Entities
The system SHALL support links across documents, sections, and assets. Links MAY include text and images.

#### Scenario: Navigate with link
- WHEN user clicks a link [Label](doc://<id>#<section>)
- THEN the target document opens and scrolls to section
- AND browser URL updates to reflect current document
- WHEN link points to non-existent document/section
- THEN displays error message with create option

#### Scenario: Asset link
- WHEN user clicks an image link (asset://<id>)
- THEN the image opens in overlay or lightbox
- WHEN asset is hidden
- THEN link is inactive or shows placeholder

#### Scenario: External links
- WHEN user clicks http(s):// link
- THEN opens in new tab/window
- WHEN user clicks mailto: link
- THEN opens default email client

#### Scenario: Link creation
- WHEN user selects text and uses link shortcut
- THEN creates [text](url) format
- WHEN user drags document/asset to text
- THEN inserts appropriate link format

#### Scenario: Link validation
- WHEN document loads
- THEN validates all links and highlights broken ones
- WHEN link becomes invalid
- THEN updates link style (e.g., red underline)

#### Scenario: Back/forward navigation
- WHEN user clicks browser back/forward
- THEN navigates to previous/next document state
- AND preserves scroll position

