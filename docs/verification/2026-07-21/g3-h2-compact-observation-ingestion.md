# G3 H2 compact Electron observation ingestion

Date: 2026-07-21 (JST)

## Outcome

The accepted compact user observation is now bound to the exact clean G3
checkpoint and Electron package without modifying either base artifact. The
derivative human gate is `pass`, `behaviorObserved=true`, and the derivative
decision is `READY_FOR_INTERNAL_RELEASE_REVIEW`.

This does not approve signing, tagging, publication, upload, or external
distribution. It advances only to a bounded internal release review.

## Immutable identities

| Evidence | Identity | Readback |
| --- | --- | --- |
| Base product | `889a6427f3c9ec39b7e39d90e956ff528ec7f75e` | clean checkpoint source |
| Base checkpoint | `7b06d1d5ad2e146d218fca08cb0dc72e60285f3b91cfae2b7b389dccc5824f77` | same SHA-256 before and after derivative generation |
| Electron package | `063a785693a5dc781459176f9a1a2cf01bb1483b34a464039e5febbad06d93c6` | 201233408 bytes; checkpoint, requiredIdentity, reported SHA, and independent file hash match |
| Ingestion implementation | `3926f945beff421b99f5e57c28c12239337d2726` | reusable command and focused tests |
| Final synthesis tool | `083ba87affc7eaf7e2fd01941120707c1c80b8c6` | clean committed tool HEAD with exact `observed_user_reported` current-observation grade |

The primary checkout retained its user/tool-owned `.serena/project.yml`
difference. It was not restored, stashed, staged, hidden, or committed.

## Observation provenance

Original user statement:

> packageは起動でき、主要操作に重大な問題はありません。保存・再起動復帰はPASSとして継承します。

The derivative records package launch and aggregate-only major operations as
`observed_user_reported`. It does not claim that every control was checked.
Save and restart recovery are `inherited_prior_repeated_user_verification`,
with `persistenceEvidenceReuse.explicitlyAcceptedBySupervisor=true`.

The current exact package was not replayed for persistence during this turn.
`observedAt` remains `null` with precision `not_supplied`; report ingestion time
is separate. Web comparison remains `not_compared`, and no visual finding was
invented.

## Canonical route and artifacts

```powershell
npm run release:observe -- --checkpoint "<checkpoint.json>" --package "<Zen Writer.exe>" --observation "<observation.json>" --out "<new sibling review folder>"
```

Final ignored input:

`WritingPage-g3-checkpoint-889a642/output/release-readiness/observation-thank-889a642-20260721T024221JST.json`

Final ignored derivative:

`WritingPage-g3-checkpoint-889a642/output/release-readiness/review-thank-889a642-20260721T030510JST`

It contains `electron-observation.json`, `internal-release-review.json`, and
`INTERNAL_RELEASE_REVIEW.md`. All JSON was parsed, the Markdown was inspected,
and the generated files were scanned for manuscript-body fixture leakage.

## Decision protection

Focused coverage proves these cases:

- matching compact PASS plus explicitly accepted inherited persistence -> READY;
- inherited persistence without supervisor acceptance -> HOLD;
- actual package hash mismatch or checkpoint identity mismatch -> BLOCKED/nonzero;
- FAIL -> BLOCKED and HOLD -> `HOLD_FOR_ELECTRON_OBSERVATION`;
- missing launch evidence -> HOLD;
- `observedAt=null`, current-package persistence replay false, Web comparison
  `not_compared`, base checkpoint immutability, and no manuscript fixture leak.

Validation passed: syntax checks for the new scripts/test, focused ingestion
tests 12/12, full Node unit tests 33/33, `npm run test:smoke`,
`npm run lint:js:check`, and `git diff --check`. Full Playwright, SP-071,
package rebuild, package launch, and checkpoint regeneration were intentionally
not performed because this slice changed evidence orchestration only and had no
new product-failure evidence.

## Compact reporting policy

The default repeated success report may be:

`PASS。package起動・主要操作に重大問題なし。保存復帰は既存確認を継承。`

Detailed reproduction remains mandatory for FAIL/HOLD, storage/autosave/
document-model/Electron-lifecycle changes, a newly observed persistence issue,
or an explicitly requested final external-distribution candidate. Inherited
evidence must remain labelled and must never be presented as a fresh replay.
