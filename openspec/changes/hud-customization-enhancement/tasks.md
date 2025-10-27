## 1. Update Default Settings
- [ ] Add `width: 240` and `fontSize: 14` to `DEFAULT_SETTINGS.hud` in `js/storage.js`
- [ ] Verify settings load with new defaults

## 2. Extend HUDSettings Gadget
- [ ] Add width and fontSize number inputs in HUDSettings function in `js/gadgets.js`
- [ ] Position controls after opacity control
- [ ] Width control: min=120, max=800, step=10, value=hud.width || 240
- [ ] FontSize control: min=10, max=24, step=1, value=hud.fontSize || 14
- [ ] Add event handlers for change/input with value clamping

## 3. Update Setting Merge Logic
- [ ] Ensure `merged.hud` includes width and fontSize in loadSettings() in `js/storage.js`
- [ ] Verify existing settings merge correctly with new keys

## 4. Add E2E Test
- [ ] Add test for HUD width/fontSize customization in `e2e/gadgets.spec.js`
- [ ] Test steps: Open gadget, change values, verify HUD style updates
- [ ] Assertions: CSS properties match settings

## 5. Update Documentation
- [ ] Document new HUD settings options in `docs/GADGETS.md`
- [ ] Include valid ranges, default values, and behavior
