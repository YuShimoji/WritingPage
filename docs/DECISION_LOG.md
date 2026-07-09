# Decision Log

## 2026-07-10: Adopt Project Capsule without replacing WritingPage authority docs

Decision:

- Install the re-kickstart Project Capsule as repo-local docs, but keep the existing WritingPage read order anchored on `docs/CURRENT_STATE.md`, `docs/INVARIANTS.md`, and `docs/INTERACTION_NOTES.md`.
- Do not overwrite `AGENTS.md`; the existing adapter explicitly says to keep it thin and not turn it into procedure, status, roadmap, closeout template, or history.
- Merge the template roadmap intent into the existing `docs/ROADMAP.md` instead of replacing that long-running authority document.

Reason:

- The kit's default `AGENTS.md` and `ROADMAP.md` are generic. This repo already has stronger project-local authority docs and a detailed roadmap history.
- The re-kickstart goal is to make the next BUILD turn easier to start, not to erase existing restart contracts.

Evidence:

- Restart kit `CODEX_REKICKSTART_KIT=2026-07-09.v1` was inspected from `ALL_FILES_INLINE.md` because the physical `PROJECT_REPO_TEMPLATE/` directory was not present in the extracted folder.
- `npm run test:smoke` and `npm run build` passed on 2026-07-10.

Reversal condition:

- If a future kit provides repo-specific instructions that supersede WritingPage's current docs, update `AGENTS.md` explicitly and record that change in `docs/CURRENT_STATE.md`.

## 2026-07-10: BUILD completion requires material evidence

Decision:

- A BUILD turn in this repo cannot complete with analysis, planning, research, or docs updates alone.
- Each BUILD turn should leave implementation, validation, screenshot, generated artifact, or reproducible probe evidence.

Reason:

- WritingPage already has enough docs to restart; the recurring bottleneck is avoiding docs-only progress when a local check, artifact, or narrow slice can be produced.

Evidence:

- This re-kickstart records smoke/build command results in `docs/verification/2026-07-10/re-kickstart-build.md`.
