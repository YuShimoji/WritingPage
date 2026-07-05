# Full showcase capture alignment

## 目的

`scripts/capture-full-showcase.js` を現行の left nav / advanced settings / Design Cockpit architecture に合わせ、広い visual showcase route が旧 settings modal や offscreen sidebar click に戻らないようにした。

## 変更した route

| capture/readback | 目的 | 現在の判定 |
| --- | --- | --- |
| `02`-`06-sidebar-*` | sidebar category captures | `sidebarManager.activateSidebarGroup(...)` route |
| `07-settings-advanced-route.png` / `settings_route` | settings entry captures current advanced sidebar, not old modal | `leftNavActive=advanced`, `legacySettingsModalVisible=false` |
| `08-design-cockpit.png` / `design_cockpit` | Design Cockpit is included in full showcase | privacy marker true, fixture manuscript text not in panel/summary |
| `14-focus-compat.png` / `15-normal-shell.png` | current supported UI-mode API is used | `ZenWriterApp.setUIMode('focus'/'normal')` |
| `18-mobile-sidebar.png` / `mobile_sidebar` | mobile sidebar no longer clicks offscreen `#toggle-sidebar` | current left-nav category route |

The obsolete `07-settings-modal.png` and direct `data-ui-mode='blank'` capture path were removed from the full showcase route.

## 検証結果

- Reproduced before fix: `node scripts/capture-full-showcase.js` failed at `scripts/capture-full-showcase.js:412`, where Playwright could not click offscreen `#toggle-sidebar` on mobile.
- `node scripts/capture-full-showcase.js`: passed after alignment, producing 19 screenshots.
- Latest local artifact folder: `C:\Users\thank\Storage\Media Contents Projects\WritingPage\output\showcase\full-2026-07-05T18-27-48`
- `manifest.json` and `readback.json` are written beside screenshots. Generated showcase artifacts are local verification output and are not committed.

## 境界

- Product UI layout was not redesigned.
- Design Cockpit behavior was not changed.
- Storage schema, autosave, Documents, import/export, cloud/account/public sharing, and Electron packaging were not changed.
- Seeded editor text remains a local fixture for screenshot composition. Design Cockpit panel/readback assertions prevent copying body text into the dashboard summary.
