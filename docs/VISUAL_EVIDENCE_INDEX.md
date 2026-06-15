# Visual Evidence Index

This page records where screenshot and visual proof evidence can be found or generated. It does not create a new visual proof set by itself.

## Current Quick-Check Status

No current committed screenshot set for immediate progress review was found in the docs tree during this pass.

That means a reviewer can read the feature and verification documents, and can generate fresh screenshots locally, but cannot yet open a stable `docs/visual-evidence/...` folder and inspect current curated images.

## Generated Local Evidence

| Evidence type | Location | How it is produced | Commit policy |
| --- | --- | --- | --- |
| Manual UI capture set | `output/playwright/manual-verification-.../` | `npm run test:ui:capture:build` | Generated output; do not commit by default |
| Playwright failure screenshots and traces | `test-results/` | Playwright writes them when tests fail | Generated output; do not commit by default |
| Temporary debug screenshots | repository root as `debug-screenshot-*.png` | Debug flows described in [Development](local-view/root/DEVELOPMENT.md) | Temporary and ignored |

See [Testing](TESTING.md) for the current capture command and [Development](local-view/root/DEVELOPMENT.md) for the temporary debug screenshot flow.

## Historical Or Stale References

Some older verification documents mention screenshots or manual visual checks. Treat these as historical evidence unless the file itself says it is current for the active slice.

Useful starting points:

- `docs/archive/session-history.md`
- `docs/verification/session22-investigation.md`
- `docs/verification/session25-status-matrix.md`

## Suggested Committed Layout For Future Curated Screenshots

If the project needs a stable visual checkpoint, use a small, curated folder under:

```text
docs/visual-evidence/turn-NN-short-slice-name/
```

Recommended contents:

- `index.md` explaining the slice, command, browser size, and what each image proves
- a small set of representative PNG files only
- no raw Playwright trace archives, full generated output folders, or cache files

This keeps progress screenshots easy to inspect through the MkDocs tree without confusing generated evidence with source documents.
