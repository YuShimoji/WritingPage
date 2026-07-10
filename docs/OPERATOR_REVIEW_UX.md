# Operator Review UX

Status: canonical
Version: v1.9 Outcome Package / Creative Direction Gate

This document defines how an assistant asks for human review, consumes freeform
feedback, and returns to autonomous work in this repository. It complements
`docs/OPERATOR_WORKFLOW.md`, `docs/INTERACTION_NOTES.md`, and
`docs/ai/STATUS_AND_HANDOFF.md`.

## Review Card

Use a Review Card when user judgment is actually needed for an artifact,
workflow decision, UI feel, creative direction, or other human-owned evaluation.
Place it near the top of the report or immediately after Artifacts / Review
Access so the operator can see the ask before reading the rest of the report.

A Review Card must include:

- the review target
- what to look at, in no more than 3 concrete points
- confirmation that freeform feedback is accepted
- examples of valid freeform feedback
- how the assistant will interpret the review and continue

Do not require fixed phrases such as `accept`, `reject`, or
`small_adjustment`. Those words may be used internally after parsing, but the
operator should be able to answer naturally.

Example:

```text
Review Card
Target: local docs navigation for review workflow
Look at: whether the new entry is findable; whether the examples sound natural;
whether the next action is clear.
Freeform is fine: "this is enough", "move it closer to AGENTS", "too wordy",
or "keep the card but shorten the examples" are all valid.
Agent handling: I will parse your note into target / intent / constraints /
confidence. If confidence is medium or high, I will make the scoped reversible
edit and continue verification. I will ask one clarification only if confidence
is low and the wrong interpretation would materially change direction.
```

## Freeform Review Intake

Treat any user freeform response as valid review input. Internally parse it into:

- `target`: which artifact, file, UI surface, or decision the feedback applies to
- `intent`: accept, adjust, reject, defer, compare, verify, or other practical action
- `constraints`: boundaries, examples, tone, timing, or scope limits the user gave
- `confidence`: high, medium, or low

If confidence is high or medium, return to reversible, scoped work without
asking the user to rewrite the review. Preserve the newest user instruction as
the current steering input.

Ask a Review Clarification Card only once, and only when confidence is low and a
wrong interpretation would materially change the artifact direction. A
clarification card should state the likely interpretation, the blocking
ambiguity, and the smallest answer that would unblock action. It should still
accept freeform text.

## Review Debt

Review Debt is the residue left when a human judgment is useful but not required
to keep working safely. Track it in Operation Cockpit reports so it does not
become an invisible blocker.

Use these meanings:

- `none`: no user review is waiting
- `pending`: a Review Card is open and user judgment is required before that
  artifact direction can close
- `deferred`: judgment would improve the artifact, but assistant-owned reversible
  work can continue
- `resolved`: freeform review was consumed and the assistant already acted on it

Review Debt must not be used to stop the autonomy loop while the route to the
accepted outcome checkpoint is clear, reversible, and inside the current scope.

## Long-Run Autonomy

Use long-run autonomy for implementation, docs hygiene, verification, and other
assistant-owned repo work.

- Do not stop after a single self-review when the next safe action is obvious.
- Execute the reversible, scoped route to the accepted outcome checkpoint instead of stopping at an arbitrary action count.
- If tests, lint, smoke checks, links, docs indexes, artifact manifests, or
  templates need small scoped fixes, perform those fixes before reporting.
- Report at a real checkpoint, a Review Card point, a true stop condition, or a
  repeated blocker.
- If the user inserts freeform micro-management, treat it as the newest explicit
  instruction within safety and scope.

Stop before destructive operations, dependency additions, DB/auth/API contract
changes, broad publication risk, or unresolved specification conflicts.

## Operation Cockpit Review Fields

When an Operation Cockpit report is used, include review state explicitly:

- `Review Card / Review Debt`: say whether a Review Card is present and whether
  review debt is none, pending, deferred, or resolved
- `Freeform Review Intake Result`: include only when user review was consumed;
  summarize target, intent, constraints, confidence, and the action taken
- `User-Side Work`: state `none` or `required`
- `Handoff Gate result`: state whether a next-agent prompt is warranted; do not
  emit a next-agent prompt unless the handoff gate is actually satisfied

`docs/RUNTIME_STATE.md` remains intentionally absent. Runtime and restart facts
belong in `docs/CURRENT_STATE.md`; Operation Cockpit is a report shape, not a
new persistent runtime-state file.
