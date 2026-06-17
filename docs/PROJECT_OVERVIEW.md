# Project Overview Map

This page is a reading map for the existing Markdown documents. It does not replace the source documents, translate them, or summarize their requirements as a new authority.

Use it when you want to answer quickly:

- where past implementation work is recorded
- where current and future feature progress is tracked
- whether implementation topics are grouped by item
- where screenshot evidence lives
- whether the next development plan is readable by turn count rather than by date

## Fast Route

| What you need to check | Open first | Then check | What it tells you |
| --- | --- | --- | --- |
| Latest restart context and current proof | [Current State](CURRENT_STATE.md) | [User Request Ledger](USER_REQUEST_LEDGER.md), latest files under `docs/verification/` | The latest handoff, current proof anchors, and what not to reopen as active work |
| Implemented user-facing features | [Feature Registry](FEATURE_REGISTRY.md) | [App Specification](APP_SPECIFICATION.md), files under `docs/specs/` | Feature IDs, status, linked specs, implementation files, and tests where registered |
| Broad app capability map | [App Specification](APP_SPECIFICATION.md) | [Architecture](ARCHITECTURE.md), [Gadgets](GADGETS.md), [UI Surface and Controls](UI_SURFACE_AND_CONTROLS.md) | The larger product surface and major responsibility boundaries |
| Future work and progress lanes | [Roadmap](ROADMAP.md) | [User Request Ledger](USER_REQUEST_LEDGER.md), [Turn-Based Development Plan](TURN_PLAN.md) | Candidate work, current lanes, and a turn-count reading layer |
| Save/load/import/export trust work | [Editor Trust Workflow](EDITOR_TRUST_WORKFLOW.md) | [Current State](CURRENT_STATE.md), relevant verification notes | The current writing trust vertical slice and its validation anchors |
| Agent reports and review flow | [Operator Review UX](OPERATOR_REVIEW_UX.md) | [Status and Handoff](ai/STATUS_AND_HANDOFF.md), [Interaction Notes](INTERACTION_NOTES.md), [Operator Workflow](OPERATOR_WORKFLOW.md) | How Review Cards, freeform review intake, Review Debt, and long-run checkpoints should work |
| Screenshot and visual proof status | [Visual Evidence Index](VISUAL_EVIDENCE_INDEX.md) | [Testing](TESTING.md), historical verification notes | Whether there is a current committed screenshot set and where generated captures are written |
| Local browser reading and translation checks | [Local Docs View Home](index.md) | `mkdocs.yml` navigation | How to open the local tree view and use browser page translation as a temporary aid |

## What Is Currently Easy To See

Past implementation work is mostly discoverable through [Feature Registry](FEATURE_REGISTRY.md), [Roadmap](ROADMAP.md), [Current State](CURRENT_STATE.md), and the dated verification notes under `docs/verification/`.

The strongest item-by-item view is [Feature Registry](FEATURE_REGISTRY.md). It records user-facing features with linked specs, implementation files, focused tests, and proof notes. It also explicitly notes that some existing or legacy features are still being migrated into the registry, so it should be read as the current feature index, not as a guaranteed complete inventory of every historical capability.

Future work is visible in [Roadmap](ROADMAP.md) and [User Request Ledger](USER_REQUEST_LEDGER.md). The roadmap is organized by status and lanes. The ledger is useful for current request context and next-slice selection. The turn-count view in [Turn-Based Development Plan](TURN_PLAN.md) is an added reading layer so a reviewer can reason in "next 1-4 turns" terms without replacing those source documents.

## Gaps This Map Makes Explicit

| Area | Current state | Where to look now | Practical consequence |
| --- | --- | --- | --- |
| Implementation items | Mostly grouped in the feature registry, with broader history in roadmap and verification notes | [Feature Registry](FEATURE_REGISTRY.md), [Roadmap](ROADMAP.md), `docs/verification/` | Use the registry for item-level review, then fall back to roadmap or verification notes for older work |
| Current screenshots | No current committed quick-check screenshot set was found | [Visual Evidence Index](VISUAL_EVIDENCE_INDEX.md), [Testing](TESTING.md) | A reviewer can generate screenshots locally, but there is not yet a curated image set to inspect immediately from the docs tree |
| Future plan by turns | The canonical plan is still lane/status oriented, not purely turn-count based | [Turn-Based Development Plan](TURN_PLAN.md), [Roadmap](ROADMAP.md) | Turn-based planning is now readable, but actual slice authority remains in roadmap and ledger until a future pass promotes a turn plan |
| Local docs overview | MkDocs gives a tree, but the project-level "where do I look?" answer needed a single entry | This page and [Local Docs View Home](index.md) | New reviewers can start from a single map instead of searching across many Markdown files |

## Review Rule

When this map and a source document disagree, treat the source document as authoritative. This page is only a navigation and audit aid.
