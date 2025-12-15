# workspace-ui Specification

## Purpose
ワークスペースUIの階層構造を定義する。ツリーペイン、フォルダ構造、ガジェット階層登録を規定（将来実装予定）。
## Requirements
### Requirement: Tree Pane with Folder Structure
The system SHALL provide a hierarchical tree pane for gadgets and documents with unlimited nesting and lazy rendering.

#### Scenario: Expand/Collapse folders
- WHEN user clicks a folder node
- THEN the folder toggles expanded state and child nodes render lazily

#### Scenario: Drag and drop reordering
- WHEN user drags a gadget or note
- THEN the item reorders within the same folder or moves across folders

### Requirement: Extensible Gadget Registry (Hierarchical)
The system SHALL register gadgets under folders and support dynamic discovery.

#### Scenario: Register gadget under a folder
- WHEN a plugin registers a gadget with a path "structure/corkboard"
- THEN it appears under that folder in the tree

