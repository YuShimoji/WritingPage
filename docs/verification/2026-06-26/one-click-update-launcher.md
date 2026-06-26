# One-Click Update Launcher

## Purpose

The launch path had several valid routes: direct `index.html`, `dist/`,
development server, and Electron packaged app. This slice adds one normal
Windows-friendly route for manual confirmation after agent work: update the
repo safely, rebuild `dist/`, and open the app without making localhost the
default check.

## Scope

- Added `scripts/update-build-open.js`.
- Added `ZenWriter-UpdateAndLaunch.cmd` for double-click launch.
- Added `scripts/install-update-launcher-shortcut.js` and
  `npm run app:install:update` for a Start Menu launcher.
- Kept the existing `Zen Writer.url` quick-open shortcut behavior intact.
- Did not change editor runtime behavior, storage, Electron packaging, or add
  auto-update infrastructure.

## Behavior

- The update path checks for a clean worktree before pulling.
- It runs `git fetch origin` and `git pull --ff-only`.
- If local changes, merge conflicts, detached HEAD, or pull failure appear, it
  stops visibly and does not discard work.
- It rebuilds `dist/` with `npm run build`, then opens through the existing
  `app:open:dist` route.
- `app:update:open:dist` is available when a dist HTML launch is explicitly
  preferred.

## Verification

- `node --check scripts/update-build-open.js`
- `node --check scripts/install-update-launcher-shortcut.js`
- `node scripts/update-build-open.js --dry-run --no-open`
- `npm run build`
- `npm run app:install:update`
- `npx markdownlint docs/verification/2026-06-26/one-click-update-launcher.md`
- `git diff --check`

## Result

Manual confirmation now has a stable Windows entry point:
`ZenWriter-UpdateAndLaunch.cmd` or the Start Menu shortcut
`Zen Writer Update and Launch`. The development server remains an explicit
development path, and Electron packaged verification remains a separate app
packaging path.
