# DECISION_GATES.md
Ruleset-Version: v19
Status: canonical

## Active Artifact and Change Relation
Each block must know:
- active artifact
- artifact surface
- current bottleneck
- change relation: `direct`, `unblocker`, `cleanup`, or `evidence-only`

If change relation is repeatedly `cleanup` or `evidence-only`, do not use pendulum logic. Identify the actual bottleneck.

## Success Transition Gate
After a success definition is reached, do not invent a new frontier just to keep moving. Move only to:
- approved next frontier
- explicit user request
- a verified blocker that prevents the artifact path from continuing

## Frontier Re-entry Gate
The following do not become standard options without explicit re-approval:
- rejected
- hold due to unresolved prerequisites
- quarantined
- boundary-stopped or responsibility-external items

## Value Validation Gate
Before entering PLAN MODE or specification work for a proposed item, answer all of these in one sentence each:
1. What workflow step or integration point will the output feed into?
2. What manual step, judgment, copy, or transfer is actually removed?
3. If an external GUI/API is still the real integration point, does manual transfer remain?

If these cannot be answered, or the answer is effectively “manual copy still remains and little friction is removed”, stop and return the item as value-unverified.

This gate applies to speculative candidates. A clear user-requested outcome with
an observable acceptance condition is already value-validated; do not turn it
back into a proposal ceremony.

## Risk-Calibrated Execution Gate

Use the smallest gate that matches the actual risk:

| Band | Typical work | Default action |
|---|---|---|
| green | reversible code/docs/test/tooling changes, related cleanup, local verification, normal Git follow-through | proceed to the outcome checkpoint |
| yellow | subjective visual direction, meaningful interaction choice, or a choice that would cause broad rework if guessed | present 2-4 low-cost routes and one recommendation; use one implementation decision gate |
| red | destructive changes, dependency addition, DB/auth/API contract change, irreversible publication, or unresolved specification conflict | stop for explicit direction |

Absence of a special permission keyword is not a blocker when the user's natural
language and project-local defaults already authorize the green-band work.

## Bottleneck Proof Gate
A proposed next task must state the current bottleneck it resolves.
If the reason is only “we have done too much of X lately”, reject the proposal.

## Actor / Owner Gate
Every major action should have an internal actor / owner check:
- actor: `user`, `assistant`, `tool`, `shared`
- owner artifact: what artifact this actor actually owns
If the task is a human-owned creative/manual step, the assistant may support or scaffold it, but must not silently become the actor.
Report actor / owner explicitly when it prevents responsibility confusion; do not turn it into a mandatory table column for every next-step option.

For yellow-band creative work, the assistant must create the comparison material.
The user selects the direction; selection at the labeled implementation gate
approves the bounded build without a second permission round.

## Preference Revision Circuit Breaker

After a direction has been built, collect preference feedback into one revision
batch. If two preference-driven revision rounds still do not converge, do not
continue serial micro-fixes. Re-open the design axis with a compact comparison
and decide whether to change direction, accept known debt, or stop that lane.

## Workflow-Proof Gate
If the project depends on a human-authored production workflow, do not jump to quantity expansion (content writing, asset proliferation, mass production) before the workflow has been proven once end-to-end.
Examples of workflow proof:
- author → validate → generate → preview
- operator edits → tool runs → result observed

## Read-Only Refresh Gate
During REFRESH / REANCHOR / SCAN / AUDIT:
- no writes to long-lived repo files
- no commits / pushes
- no mutation justified only by “while we are here”
Creating local scratch notes is acceptable only if explicitly asked and clearly not treated as project progress.

## Write Failure Hard Stop
If any of the following occurs in the current block, stop before commit/push/handoff-complete:
- write failed
- readback mismatch
- permission denied
- tool output uncertain or truncated in a way that affects correctness

## Ask Hygiene Gate
Before asking:
- verify whether the answer already exists in canonical docs or recent verified context
- keep one intent per ask
- do not mix manual verification with next-direction choice
- do not use procedural yes/no traps as the main options
