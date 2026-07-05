# UI capture verification recovery

## 目的

`npm run test:ui:capture` が旧 `#settings-modal` の表示待ちで止まっていたため、現行の left nav / advanced settings / Design Cockpit architecture に合わせて capture route を更新した。

## 変更した検証 route

| capture/readback | 目的 | 現在の判定 |
| --- | --- | --- |
| `01-main-desktop.png` / `app_launch` | ローカル起動後に editor surface と writing status chip が存在する | `uiMode=normal`, `leftNavState=root`, editor visible |
| `02-advanced-settings-sidebar.png` / `advanced_settings_sidebar` | `openSettingsModal()` が現在の詳細設定 sidebar route を開くことを確認する | `leftNavActive=advanced`, `advancedContentOpen=true`, `legacySettingsModalVisible=false` |
| `03-design-cockpit.png` / `design_cockpit` | Design Cockpit を自動 capture し、summary privacy marker を読む | `summaryIncludesPrivacyMarker=true`, fixture manuscript text not in panel/summary |
| `04-help-modal.png` | Help modal capture を維持する | visible modal route |
| `05-sidebar-desktop-edit.png` | edit sidebar category を current API で開く | `sidebarManager.activateSidebarGroup('edit')` |
| `06-command-palette.png` | command palette capture を維持する | visible command palette |
| `07-mobile-sidebar-open.png` | mobile sidebar capture を offscreen toggle click ではなく sidebar manager API で開く | current left-nav category route |

## 検証結果

- Reproduced before fix: `npm run test:ui:capture` failed at `scripts/capture-ui-verification.js:294`, waiting for hidden `#settings-modal`.
- `npm run test:ui:capture`: passed after recovery.
- Latest local artifact folder: `C:\Users\thank\Storage\Media Contents Projects\WritingPage\output\playwright\manual-verification-2026-07-05T18-07-23-020Z`
- `manifest.json` and `readback.json` are written beside screenshots. Generated screenshots/readbacks are local verification output and are not committed.

## 境界

- Product UI layout was not redesigned.
- `Design Cockpit` behavior was not changed.
- Storage schema, autosave, Documents, import/export, cloud/account/public sharing, and Electron packaging were not changed.
- The seeded editor text is a local fixture for screenshot composition. The Design Cockpit panel and readback do not copy body text into the dashboard summary.
