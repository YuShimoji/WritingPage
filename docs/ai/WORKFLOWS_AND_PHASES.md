# WORKFLOWS_AND_PHASES.md
Ruleset-Version: v20
Status: canonical

## Recommended read order on resume / continue / refresh
1. `docs/CURRENT_STATE.md`
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. If choosing work: `docs/USER_REQUEST_LEDGER.md` and `docs/ROADMAP.md`
5. If changing user-facing features or boundaries: `docs/FEATURE_REGISTRY.md` and the relevant spec

Do not begin restart by reading old handoff, health, or runtime-counter documents. Those files were intentionally removed.

## Resume / Continue / Refresh
### Resume
Recover the current fact base from `CURRENT_STATE` first, then identify the active artifact and bottleneck.

### Continue
Do not rely on momentum. Re-check whether the current block still matches the bottleneck, actor, and value path.

### Refresh / Reanchor / Scan
These are read-only unless the user explicitly asks for mutation in the current block.
Do not auto-fill project docs and claim progress merely because a template was updated.

## Task-scout requirements
A scout pass should inspect, when relevant:
- active artifact and bottleneck
- stale evidence / visual evidence freshness
- user-carried constraints
- re-ask risk
- canonical coverage
- value path risk
- bottleneck substitution risk
- actor risk
These are not mandatory report headings.

## Manual verification pattern
- Put verification items in normal text, not inside the ask field.
- Use `OK / NG` or a short result code only when the user is doing a narrow mechanical confirmation.
- For reviewable artifacts, do not require fixed phrases. Use a Review Card and accept freeform feedback.
- Parse freeform review internally into target / intent / constraints / confidence. Continue scoped reversible work when confidence is medium or high.
- Ask a clarification card only once, and only when confidence is low and a wrong interpretation would materially change direction.
- Ask for next direction separately.

## Long-run autonomy loop
When the next 1-3 actions are clear, reversible, and inside the current scope,
execute them instead of only listing them. This includes small scoped fixes to
tests, lint, smoke checks, docs links, artifact manifests, report templates, and
review access.

Report at a checkpoint, Review Card point, true stop condition, or repeated
blocker. If the user inserts freeform micro-management, treat it as the newest
explicit steering input within safety and scope.

## Option generation
Options are response hooks, not a ritual table. Offer 2-4 meaningfully different hooks when the next move is open:
- `Advance`: continue the product path
- `Audit`: inspect a risk or inconsistency
- `Excise`: remove stale code/docs/surfaces
- `Explore`: widen a UX or creative direction with prototypes
- `Verify`: close a narrow evidence gap

Each hook should make clear which workflow stage it touches and what becomes possible if chosen. Mention actor / owner only when it changes the decision.

Avoid options whose main meaning is merely commit / not commit / cleanup only / end.

## Macro workflow connection
When reporting or proposing next work, connect local changes to the broader authoring flow: launch → write → structure → decorate → preview → output → save. If the work is infrastructure or cleanup, say which part of that flow becomes less noisy, safer, or more open to creative iteration.

## Workflow-proof examples
Good workflow-proof tasks:
- validate that the human-authoring path runs once end-to-end
- confirm the operator can use the designed toolchain without improvising new steps
- move a verification target into a debug harness instead of using main content as the experiment bed

## Interaction safety
Do not compress unrelated intents into one ask.
Do not use markdown tables in a short ask field.
Do not present broad re-explanation prompts when canonical context already exists.

## Commit and push hygiene
Commit/push are not primary next-direction choices.
They are follow-through actions after a justified block, not substitutes for strategy.
