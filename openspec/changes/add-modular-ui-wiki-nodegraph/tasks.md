## 1. Implementation
- [ ] 1.1 UI Presentation: Sidebar tabs presentation strategies (buttons|tabs|dropdown|accordion) — selector and data attribute API, CSS, a11y roles
- [ ] 1.2 UI Settings Gadget — persist `ui.tabsPresentation`, `ui.sidebarWidth`, live-apply
- [ ] 1.3 Gadgets Framework: Respect manual group assignments when applying loadouts
- [ ] 1.4 Gadgetization — Typewriter, Snapshot Manager, Markdown Preview, Font Decoration, Text Animation
- [ ] 1.5 Wiki — CRUD, search (title/body/tags/folder), AI generation hook, gadget UI, storage schema
- [ ] 1.6 Node Graph — nodes/edges schema, drag, SVG edges+labels, open in dockable panel, storage per doc
- [ ] 1.7 Panels — API surface for multiple sidebars, floating windows, resizable sidebars; minimal docking
- [ ] 1.8 Editor — Typewriter mode re-enable (anchorRatio/stickiness), header icons working, element font scale design
- [ ] 1.9 Help as Wiki — seed help pages, link from Help button; expose specs and feature guides

## 2. Tests
- [ ] 2.1 E2E: editor-settings (regression) — already green
- [ ] 2.2 E2E: UI presentation switch (tabs→buttons→dropdown→accordion) persists and re-renders
- [ ] 2.3 E2E: Typewriter gadget toggles + scrolling behavior smoke
- [ ] 2.4 E2E: Snapshot Manager manual snapshot increments list
- [ ] 2.5 E2E: Node Graph add node/link; persists after reload
- [ ] 2.6 E2E: Wiki create/search/save; AI fallback stub path exercised

## 3. Migration
- [ ] 3.1 Settings merge: add `typewriter`, `snapshot`, `preview`, `ui`
- [ ] 3.2 Preserve gadget group assignments on loadout changes

## 4. Docs
- [ ] 4.1 Update Help (Wiki pages) for each feature with scenarios
- [ ] 4.2 Update AI_CONTEXT.md with new testing scope
