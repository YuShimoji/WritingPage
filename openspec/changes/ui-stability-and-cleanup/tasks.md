# Tasks for UI Stability and Cleanup

## 1. Implementation
- [ ] 1.1 Implement Sidebar Tab Switching
  - [ ] 1.1.1 Add click handlers to dynamically generated tab buttons
  - [ ] 1.1.2 Ensure active tab state updates correctly
  - [ ] 1.1.3 Verify tab panels show/hide on switch

- [ ] 1.2 Gadgetize Loadout Management
  - [ ] 1.2.1 Create LoadoutManager gadget to replace hardcoded loadout UI
  - [ ] 1.2.2 Move loadout logic from hardcode to gadget
  - [ ] 1.2.3 Ensure save/load functionality works

- [ ] 1.3 Implement Wiki Help Functionality
  - [ ] 1.3.1 Add help button to Wiki tab
  - [ ] 1.3.2 Create help content display
  - [ ] 1.3.3 Verify help opens/closes correctly

- [ ] 1.4 Clean Up Top Menu
  - [ ] 1.4.1 Remove unrequested calendar element
  - [ ] 1.4.2 Make writing goal optional via gadget enable/disable
  - [ ] 1.4.3 Remove sudden color changes and emojis from goal UI

- [ ] 1.5 Improve Writing Goal UI
  - [ ] 1.5.1 Remove blue bar on input
  - [ ] 1.5.2 Allow user control over colors and emojis
  - [ ] 1.5.3 Smooth transitions for UI changes

- [ ] 1.6 Document Word Count Behavior
  - [ ] 1.6.1 Add comments explaining space-based counting
  - [ ] 1.6.2 Reference as mockup behavior for future changes

## 2. Verification
- [ ] 2.1 Run smoke test (`npm run test:smoke`)
- [ ] 2.2 Run lint (`npm run lint`)
- [ ] 2.3 Run e2e (`npm run test:e2e:ci`)
