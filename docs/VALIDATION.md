# Validation

This file records commands that are real for this repository. `docs/CURRENT_STATE.md` and `docs/verification/*` remain the source for accepted result history.

## Install

```bash
npm install
```

Use when `node_modules/` is missing or `package-lock.json` changed. On 2026-07-10, `package-lock.json` and `node_modules/` were present.

## Development server

```bash
npm run dev
```

Expected local preview URL: `http://localhost:8080`.

## Build

```bash
npm run build
```

2026-07-10 result: pass. Output summary: `Build completed: C:\Users\thank\Storage\Media Contents Projects\WritingPage\dist`.

## Test

```bash
npm run test:smoke
npm run test:unit
npm run test:e2e
```

Use `npm run test:smoke` as the quick restartability check. On 2026-07-10, `npm run test:smoke` passed with `ALL TESTS PASSED`.

## Lint

```bash
npm run lint:js:check
npm run lint:md
```

Use `npm run lint:js:check` for runtime JavaScript checks. Markdown lint is broader and may be unsuitable for a narrow docs-only closeout unless the touched files are in scope.

## Preview

```bash
npm run app:update:dry-run
npm run app:update:open
npm run app:update:open:dist
npm run app:update:open:package
```

`npm run app:update:dry-run` checks the update/build/open route without opening a window. `npm run app:update:open` is the normal real-window route for the current operator tactile review.

## Screenshot capture

```bash
npm run test:ui:capture
```

Expected output shape: `output/playwright/manual-verification-*` with `manifest.json`, `readback.json`, and PNG screenshots.

## Artifact generation

```bash
node scripts/capture-full-showcase.js
```

Expected output shape: `output/showcase/full-*` with `manifest.json`, `readback.json`, and PNG screenshots.

## Validation rule

A validation entry is valid only when it includes:

- command
- date
- result
- output path or log summary

## Re-kickstart task

Every kit placeholder command has been replaced with a repo-real command or a repo-specific availability note. This replacement does not count as the main deliverable; the 2026-07-10 smoke/build command results are the material evidence for this BUILD turn.
