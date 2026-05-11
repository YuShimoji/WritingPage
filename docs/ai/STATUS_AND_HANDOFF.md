# STATUS_AND_HANDOFF.md
Ruleset-Version: v20
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

## Closeout chain minimum
Final responses should not merely summarize activity; they should make the next move executable.
Do not force fixed section names or emit internal labels. Preserve the logical chain in normal language: what is complete, what was deliberately not changed, what changed for the workflow or decision space, what evidence supports it, what uncertainty remains, who moves next, and what happens after any return from the user.

File paths, line numbers, commits, and test names are evidence, not explanation. Put the user-readable meaning first, then cite files as support. Do not wait for the user to ask for "details" or "steps" before explaining what the change means and what happens next.

If the next blocker depends on operator input, explain why work is waiting or what can still run in parallel. A response that ends with only "please check" or "continue from here" is incomplete unless the exact required input and follow-up work are already clear.

## No progress laundering
Do not claim progress merely because:
- a doc was created during refresh
- a framework-compliant report was produced
- a list of changed files was shown
- a low-friction helper feature was specified
Report what became easier, safer, or more real for the actual artifact path.

## Drift self-check (silent unless something fires)
At slice boundaries and handoffs, self-diagnose against these patterns; surface only the ones that fire, with the next-step implication, not as a passive footnote:

- aesthetic tuning that fits one episode/script/asset but does not generalize
- polishing within-stage artifacts while drifting from the final shipped form
- contracts/specs/READMEs accumulating without returning to implementation, GUI ingest, or actual readback
- treating a one-off HTML / PNG / JSON / fixture as "done" without next-stage integration or proof path
- requiring the user to detect every direction shift before progress can resume
- next-stage artifact, its consumer, or blocked reasons not explicit

If none fire, say so briefly in passing. Silent self-checks do not count, but emitting the list as fixed headings is also wrong.
