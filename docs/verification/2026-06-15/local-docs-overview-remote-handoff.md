# Local Docs Overview Remote Handoff

This handoff preserves the local documentation-view context in repository files so another terminal can resume without relying on chat history.

## Current Sync State Before This Handoff

- Branch: `main`.
- Pre-handoff local state: clean `## main...origin/main`.
- Pre-handoff remote comparison: `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Latest pushed context before this handoff: `6add8c4 docs: add project overview map`.
- Previous docs-browser base: `5b60db7 docs: add local mkdocs browser view`.

## What Was Added In The Local Docs View Work

- MkDocs Material remains the adopted local-only browser view.
- `mkdocs.yml` defines the left navigation tree and excludes generated, dependency, build, code, and cache-heavy paths from the docs site.
- `docs/index.md` is the local browser entry point and links to the project overview pages.
- `docs/PROJECT_OVERVIEW.md` explains where to read past implementation, current progress, future feature candidates, implementation grouping, screenshot status, and turn-based planning.
- `docs/VISUAL_EVIDENCE_INDEX.md` records that no current committed quick-check screenshot set exists yet, and separates generated screenshot locations from a possible future curated docs-visible layout.
- `docs/TURN_PLAN.md` adds a turn-count reading layer over the existing roadmap and ledger. It does not replace `docs/ROADMAP.md` or `docs/USER_REQUEST_LEDGER.md`.
- `tools/generate-doc-nav.ps1` classifies the new overview pages under `Overview` when regenerating nav candidates.

## Validation Already Run

- `python -m mkdocs build --clean` completed successfully.
- The build still reports existing warnings from source docs linking to excluded code, E2E, generated files, and wrapper-relative paths. These warnings were present in the local docs-view approach and were not introduced as failures by the new overview pages.
- `git diff --cached --check` passed before commit `6add8c4`.
- The running local MkDocs server at `http://127.0.0.1:8005/` returned HTTP 200 for `/PROJECT_OVERVIEW/`, `/VISUAL_EVIDENCE_INDEX/`, and `/TURN_PLAN/`.
- The HTTP checks confirmed the expected page titles and key cross-links.

## Current Local Server Context

Ports `8000`, `8001`, `8002`, `8004`, `8005`, and `8006` were already listening during the docs-view validation. The verified docs server was available at:

```text
http://127.0.0.1:8005/
```

If another terminal starts fresh and port `8000` is free, use:

```powershell
python -m mkdocs serve
```

If port `8000` is occupied, choose an explicit local port, for example:

```powershell
python -m mkdocs serve -a 127.0.0.1:8005
```

## Restart Route From Another Terminal

1. Run `git pull --ff-only origin main`.
2. Confirm `git status --short --branch` is clean on `main...origin/main`.
3. Confirm `git rev-list --left-right --count HEAD...origin/main` returns `0 0`.
4. Read `docs/CURRENT_STATE.md`.
5. Read `docs/INVARIANTS.md`.
6. Read `docs/INTERACTION_NOTES.md`.
7. For the local documentation view specifically, read:
   - `docs/PROJECT_OVERVIEW.md`
   - `docs/VISUAL_EVIDENCE_INDEX.md`
   - `docs/TURN_PLAN.md`
   - `docs/index.md`

Use browser page translation only as a temporary reading aid. Do not create permanent translated source files.

## Non-Targets Preserved

- No existing specification body was translated, summarized as a replacement source, deleted, or structurally moved.
- No permanent translation files were created.
- No product runtime code, storage behavior, DB/auth/API contract, Electron/package behavior, or external deployment was changed.
- Generated MkDocs output under `../WritingPage-mkdocs-site` is not a repository source artifact.
- Generated screenshots, traces, and Playwright output remain non-commit targets unless a future curated screenshot set is explicitly selected.

## Next Practical Entry Points

| Entry | Purpose | What becomes possible |
| --- | --- | --- |
| Verify visual evidence | Generate current UI screenshots locally and decide whether to curate a small committed set | Reviewers can inspect progress visually from the docs tree instead of rerunning capture first |
| Audit feature registry gaps | Compare `FEATURE_REGISTRY`, `APP_SPECIFICATION`, and current specs for missing user-facing items | Implementation history becomes more reliably itemized |
| Excise stale references | Separate historical verification/archive references from active next-slice instructions | New terminals are less likely to reopen old work by mistake |
| Advance product work | Choose the next actual product slice from `ROADMAP` / `USER_REQUEST_LEDGER` | Docs hygiene stops becoming a substitute for product progress |
