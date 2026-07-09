# Artifact Index

| Date | Type | Path / URL | Purpose | How to reproduce | Quality notes | Next improvement |
|---|---|---|---|---|---|---|
| 2026-07-10 | validation-log | `docs/verification/2026-07-10/re-kickstart-build.md` | material evidence for re-kickstart BUILD | run `npm run test:smoke` and `npm run build` | command evidence only; no fresh screenshot in this pass | run UI capture if next work touches visual behavior |
| 2026-07-07 | ui-capture | `output/playwright/manual-verification-2026-07-06T17-22-39-216Z` | latest local Documents focus-return screenshot/readback evidence | `npm run test:ui:capture` or the focused capture route from the verification note | ignored local artifact; rerun if unavailable in another terminal | refresh before UI-specific review |
| 2026-07-07 | showcase | `output/showcase/full-2026-07-06T17-22-52` | latest local full showcase evidence for Documents focus return | `node scripts/capture-full-showcase.js` | ignored local artifact; not committed | refresh before broad visual audit |
| 2026-07-10 | restart-placeholder | `artifacts/review/.gitkeep` | reserve review artifact directory | not applicable | no generated artifact stored here yet | place representative review outputs here only when they are meant to be tracked |

## Rule

Generated videos, texts, images, previews, and review outputs must be indexed here before a BUILD turn is reported complete with artifact evidence. Ignored local evidence under `output/` may be indexed as local evidence, but it should not be treated as portable unless explicitly copied into a tracked artifact path.
