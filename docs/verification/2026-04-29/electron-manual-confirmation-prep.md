# Electron Manual Confirmation Prep — 2026-04-29

## Purpose

Electron packaged app で、直近の shell / writing workflow / deferred visual checks を人間が短時間で確認できるようにする。

## Prepared Environment

| Item | Result | Note |
|------|--------|------|
| `npm run build` | PASS | `dist/` generated |
| `npm run electron:build` | PASS | `build/win-unpacked/Zen Writer.exe` generated |
| `npm run test:smoke` | PASS | basic app/static/docs checks passed |
| `npm run lint:js:check` | PASS | ESLint passed |
| `git diff --check` | PASS | whitespace check passed |

## Launch

Recommended launch command:

```powershell
npm run app:open:package
```

Direct executable:

```text
build\win-unpacked\Zen Writer.exe
```

## Manual Checkpoints

Record each item as `PASS`, `FAIL`, or `HOLD`.

| # | Area | Checkpoint | Expected |
|---|------|------------|----------|
| 1 | Initial shell | Open packaged app | App opens without JavaScript error; initial writing surface is usable |
| 2 | Top chrome retirement | Look at the top edge at rest | No visible persistent top chrome / toolbar seam |
| 3 | Command palette | Press `F2` | Command palette opens; old top toolbar does not appear |
| 4 | Right window controls | Hover / focus the upper-right corner | Minimize, maximize/restore, and close controls fade in locally |
| 5 | Window drag handle | Drag the upper-right handle before and after hover reveal | At rest the invisible handle area does not move the window; after reveal the right-side handle moves it; upper-left text/sidebar area is not covered |
| 6 | Left nav root | Move to the left edge | Root icon rail fades in; it does not force-open the sidebar |
| 7 | Left nav category | Open `セクション`, then return | Back icon / category back rail returns to root predictably |
| 8 | Daily writing | Create or open a document and type in Rich editing | Text appears in the main Editor surface and remains editable |
| 9 | Chapter add | In `セクション`, use `+ 新しい章` | New chapter starts as empty title / placeholder, not saved as `新しい章` |
| 10 | Manual save | Use command palette `保存（手動・即時）` | `保存しました` HUD appears |
| 11 | Status chip | Return to normal writing surface | Character count / save status appears when Reader and memo lab are closed |
| 12 | Reader roundtrip | Open Reader / replay surface, then `編集に戻る` | Reader is read-only; focus returns to Rich editing |
| 13 | Reader button style | Check Reader controls visually | Buttons look consistent enough; note any mismatch |
| 14 | Focus left panel spacing | Check at the real working window size | Left panel spacing feels acceptable; note crowding or dead space |
| 15 | WP-004 parity pack | Load `samples/sample-wp004-parity-pack.zwp.json` if doing release-level check | Differences between MD preview and Reader are recorded in `docs/WP004_PHASE3_PARITY_AUDIT.md` |

## FAIL Record Format

For any `FAIL`, record this set:

- Reproduction steps
- Actual result
- Expected result
- Screenshot if visual
- Whether the same issue appears in web/local build

## Scope Boundaries

- Do not judge cloud sync, OAuth, Google Keep, EPUB, or DOCX in this pass.
- Do not treat Floating memo lab as production editor behavior.
- Do not reopen visible top chrome as a solution; current route is command palette plus hover islands.
