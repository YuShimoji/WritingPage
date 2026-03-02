# Story Wiki Implementation

## Overview
Implement a story wiki feature with AI-assisted content generation to help users build and manage story elements like characters, plots, and world-building.

## COMPLETED Requirements

### Story Wiki Gadget
The application shall include a Story Wiki gadget that allows users to create and manage wiki pages for story elements.

#### Scenario: Creating a character wiki page
Given the Story Wiki gadget is open
When user creates a new page for "Protagonist"
Then a wiki page is created with sections for traits, backstory, relationships
And AI can assist in generating initial content

#### Scenario: AI-assisted plot generation
Given a plot wiki page exists
When user requests AI generation for plot points
Then AI generates plot suggestions based on existing story elements
And suggestions are integrated into the wiki

#### Scenario: Linking wiki pages
Given multiple wiki pages exist
When user creates links between pages (e.g., character to location)
Then links are navigable and maintain story consistency

## ADDED Requirements

### AI Integration for Wiki
The wiki shall integrate with AI services to assist content creation.

#### Scenario: Generating character descriptions
Given a character wiki page
When user provides basic traits
Then AI generates detailed descriptions and backstories

#### Scenario: Plot development assistance
Given current plot points
When user requests expansion
Then AI suggests plot twists and developments

## Implementation Details

### Storage Layer
- Wiki pages stored in localStorage under 'zenWriter_wiki' key
- Each page has: id, title, content (Markdown), tags, createdAt, updatedAt
- CRUD operations via ZenWriterStorage API

### UI Features
- Wiki tab added dynamically with ZWGadgets.addTab
- Search functionality for finding pages by title/content/tags
- Inline editing with modal dialogs
- Tag-based organization

## Constraints
- AI generation is optional and configurable
- Wiki data stored in localStorage with export/import
- Links between wiki pages maintain referential integrity
- AI requires external API key (user provided)
