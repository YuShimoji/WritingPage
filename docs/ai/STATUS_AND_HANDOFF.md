# STATUS_AND_HANDOFF.md
Ruleset-Version: v18
Status: canonical

## Feature status semantics
Keep priority separate from status.

### Priority
Priority answers: “How worth looking at is this item compared with others?”
Examples: high / medium / low, or a ranked list.

### Status
Status answers: “What lifecycle state is this item in now?”
Use these meanings strictly:
- `proposed`: value is still being validated or the spec is incomplete
- `approved`: specification and scope are defined enough for implementation to start, and the user has approved that move
- `hold`: not rejected, but not the current move due to prerequisites, weak value path, timing, or other blockers
- `rejected`: should not be pursued within the current product/workflow scope
- `quarantined`: potentially contaminated or unauthorized batch-derived item; do not treat as a normal candidate until re-reviewed

Selection of a `proposed` item for deeper review does **not** upgrade it to `approved`.

## FEATURE_REGISTRY discipline
For each feature candidate, keep at least:
- short description
- priority
- status
- rationale
- integration point / value path note
- actor / owner note when relevant

`approved` requires all of the following:
- clear input/output or scope boundary
- no unresolved boundary violation
- value path is stated
- user approval for implementation is explicit

If an unauthorized item appears in a proposal batch, quarantine the whole batch by default until individually re-reviewed.

## Report assembly guidance
Canonical fields are an internal checklist, not a fixed final-answer template. Surface only the fields that reduce ambiguity for the current block.

A useful report should connect:
- what changed / did not change
- why that move mattered for the active artifact
- what evidence was checked
- what risk or judgment remains
- what different next moves are now available

## Current Trust Assessment
When a thread has become noisy or risky, classify changes into:
- trusted
- needs re-check
- dangerous / rollback candidate
State why.

## Handoff minimum
A robust handoff should preserve the facts below, but it should not force every normal completion report into this shape:
- shared focus
- non-negotiables
- current trust assessment
- active artifact and bottleneck
- recovered canonical context
- feature/backlog status with strict semantics
- safe next-thread plan
- what not to do next
- new fossils created in the current thread

## No progress laundering
Do not claim progress merely because:
- a doc was created during refresh
- a framework-compliant report was produced
- a low-friction helper feature was specified
Report what became easier, safer, or more real for the actual artifact path.
