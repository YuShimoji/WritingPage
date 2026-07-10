# WORKFLOWS_AND_PHASES.md
Ruleset-Version: v21
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
Recover the current fact base from the `CURRENT_STATE` live block first, then
identify the active outcome and bottleneck. Read historical blocks only when the
current outcome needs that evidence.

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
- Keep next-direction choice separate from the verification question; it may be a different section in the same checkpoint report.

## Long-run autonomy loop
When the route to the accepted outcome checkpoint is clear, reversible, and
inside the current scope, execute it instead of stopping after an arbitrary
number of actions. This includes directly related fixes to tests, lint, smoke
checks, docs links, artifact manifests, report templates, and review access.

Report at a checkpoint, Review Card point, true stop condition, or repeated
blocker. If the user inserts freeform micro-management, treat it as the newest
explicit steering input within safety and scope.

## Supervisor to executor package

The supervisor produces one outcome package, not a chain of command-sized
prompts. Use `docs/ai/prompts/supervisor_to_codex.md`. A usable package states:

- the user/workflow outcome and why it matters now
- current evidence and the active bottleneck
- one outcome slice containing up to three tightly coupled changes
- the autonomy envelope and red-band hard stops
- any single implementation decision gate
- acceptance evidence and the canonical status surface to update

The executor owns route discovery, implementation, related fixes, verification,
current-state sync, and normal Git follow-through inside that envelope.

## Outcome slice, not micro-topic

"One topic" means one coherent outcome and decision axis. It does not mean one
file, one CSS tweak, one test, or one assistant action. Up to three coupled
changes may travel together when separating them would create extra prompts or
leave the user outcome incomplete. Unrelated product decisions remain separate.

## Creative direction loop

For layout, language, content adjacency, color, type, motion, or other
preference-heavy work, use `Explore -> Choose -> Build -> Review`:

1. Generate 2-4 meaningfully different low-cost routes and recommend one.
2. Let the user choose at one labeled implementation decision gate.
3. Treat that choice as approval for the bounded route and build to the stated
   acceptance condition.
4. Collect review feedback into one revision batch. After two non-converging
   preference rounds, return to route comparison instead of serial micro-fixes.

Each outcome checkpoint also performs a small exploration pulse. Surface at
most two adjacent creative opportunities, each with benefit, cost, and why the
timing matters; do not turn them into automatic scope.

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

Prefer one cohesive outcome commit (or a small intentional series) containing
implementation, directly related tests, and live-state sync. Avoid a recurring
product-commit -> docs-handoff-commit pair when no real handoff occurred.
