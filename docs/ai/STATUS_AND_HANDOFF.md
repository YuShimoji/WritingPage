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

## Forward-looking report contract (workspace-wide, set 2026-05-11)

Substantive work reports (commits, push events, hotfix delivery, slice progress, feature additions) must do more than log activity. Include:

- **Diff focus**: what was touched and deliberately left untouched.
- **Position vs final form / North Star**: where this delta lands relative to the project's end state, derived backwards from the goal — not chronological "after step N".
- **Evidence**: readback, tests, smoke runs, push/sync state.
- **Residual risk and unsettled judgement**: stale evidence, deferred decisions, areas needing user confirmation.
- **Recommended next hook**: the most natural assistant-owned next move.
- **Branching options**: 2–3 meaningfully different next directions, not a single linear next-step.
- **Next owner**: assistant / user / both.

At slice boundaries, handoffs, or explicit closeouts, also include a **feature status table** — implemented / in-progress / unimplemented / parked — scoped to the current slice or relevant feature-registry section. Keep the table tight (slice scope, not the whole registry).

This is the expected default for substantive reports across the workspace, not a mechanical template. Short Q&A, lookups, and exploratory direction questions remain terse. The goal is to give enough forward-looking context that the next move is obvious without re-prompting. A fixed audit form remains an anti-pattern; the minimum reporting contract is the floor — this contract raises the default density when the work is non-trivial.

### Drift / overfitting self-check

At slice boundaries, handoffs, and closeouts, self-diagnose against these failure modes and surface any that fire — with the next-step implication, not as a passive aside:

- **case overfitting**: aesthetic tuning that fits one episode/script/asset but does not generalize.
- **local optimization**: polishing within-stage artifacts while drifting from the North Star.
- **docs-only loop**: contracts/specs/READMEs accumulating without returning to implementation smoke, GUI ingest, or YMM4 readback.
- **standalone artifact completion**: treating a one-off HTML / PNG / JSON / fixture as "done" without next-stage integration or proof path.
- **user-as-governor dependency**: requiring the user to detect every direction shift before progress can resume.
- **next-artifact continuity**: whether the next-stage artifact, its consumer, and any blocked reasons are explicit.

If none fire, say so briefly. Silent self-checks do not count.

### Recommended default path

When listing 2–3 branching options, mark one as the assistant's **recommended default** and state why in one line (typically: shortest path to North Star, smallest blast radius, unblocks the most downstream work, or matches a standing user preference). Split the next moves into:

- **assistant-owned**: what the assistant can advance without further user input under standing approvals.
- **user-owned**: what requires user judgement, creative authorship, or external action (GUI / YMM4 / external tool).

Do not present options as an undifferentiated menu that punts the choice back to the user.

### Cross-project scope declaration

For cross-project work, declare scope in one line at the top of the report, e.g. `Scope: NLMYTGen / WritingPage / ClipPipeGen`. Keep it minimal — just enough to satisfy the guardrails cross-project pattern. Do not re-justify the cross-project context every report once it is established.
