# Tasks for UI Stability and Cleanup

## 1. Implementation
- [x] 1.1 Implement Sidebar Tab Switching
  - [x] 1.1.1 Add click handlers to dynamically generated tab buttons
  - [x] 1.1.2 Ensure active tab state updates correctly
  - [x] 1.1.3 Verify tab panels show/hide on switch

- [x] 1.2 Gadgetize Loadout Management
  - [x] 1.2.1 Create LoadoutManager gadget to replace hardcoded loadout UI
  - [x] 1.2.2 Move loadout logic from hardcode to gadget
  - [x] 1.2.3 Ensure save/load functionality works

- [x] 1.3 Implement Wiki Help Functionality
  - [x] 1.3.1 Add help button to Wiki tab
  - [x] 1.3.2 Create help content display
  - [x] 1.3.3 Verify help opens/closes correctly

- [x] 1.4 Clean Up Top Menu
  - [x] 1.4.1 Remove unrequested calendar element
  - [x] 1.4.2 Make writing goal optional via gadget enable/disable
  - [x] 1.4.3 Remove sudden color changes and emojis from goal UI

- [x] 1.5 Improve Writing Goal UI
  - [x] 1.5.1 Remove blue bar on input
  - [x] 1.5.2 Allow user control over colors and emojis
  - [x] 1.5.3 Smooth transitions for UI changes

- [x] 1.6 Document Word Count Behavior
  - [x] 1.6.1 Add comments explaining space-based counting
  - [x] 1.6.2 Reference as mockup behavior for future changes

## 2. Verification
- [x] 2.1 Run smoke test (`npm run test:smoke`)
- [x] 2.2 Run lint (`npm run lint`)
- [x] 2.3 Run e2e (`npm run test:e2e:ci`)
