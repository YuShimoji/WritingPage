# Design for UI Stability and Cleanup

## Architecture Considerations

### Sidebar Tab Switching
- Reuse existing `activateSidebarGroup` function in app.js.
- Ensure dynamic tabs integrate with existing tab management.
- Maintain accessibility attributes (aria-selected, aria-hidden).

### Loadout Gadgetization
- Extract loadout UI from hardcoded HTML into ZWGadgets registry.
- Use existing storage APIs (ZenWriterStorage).
- Keep loadout data structure consistent.

### Wiki Help
- Add simple modal or tooltip for help content.
- Store help content in gadget definition.
- Integrate with existing UI patterns.

### Top Menu Cleanup
- Conditionally render elements based on gadget enablement.
- Use CSS classes for hiding/showing.
- Avoid global style changes that affect other components.

### Writing Goal UI Improvements
- Replace sudden color changes with smooth CSS transitions.
- Make colors configurable via gadget settings.
- Remove hardcoded emojis, allow user input.

### Word Count Documentation
- Add inline comments in word count calculation function.
- Reference mockup status to guide future implementations.
