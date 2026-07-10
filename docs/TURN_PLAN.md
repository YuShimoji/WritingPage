# Turn-Based Development Plan

Status: legacy reading layer (2026-06-15). Not current planning authority. Use
`CURRENT_STATE.md` live block, `ROADMAP.md`, and `USER_REQUEST_LEDGER.md`.

The current source plan is not primarily turn-count based. [Roadmap](ROADMAP.md) tracks lanes and status, while [User Request Ledger](USER_REQUEST_LEDGER.md) records current requests and next-slice context.

This page preserves the earlier turn-count experiment for reference. Current
workflow uses an outcome package and does not stop after an arbitrary action or
turn count.

## Turn Unit

For this project, one turn should be small enough to finish with local validation and a clear handoff. A turn may be docs-only, product code, test hardening, or visual evidence, but it should not quietly absorb unrelated product decisions.

| Turn | Purpose | Reads first | Expected output |
| --- | --- | --- | --- |
| Turn 1 | Make the project overview auditable | [Project Overview Map](PROJECT_OVERVIEW.md), [Feature Registry](FEATURE_REGISTRY.md), [Roadmap](ROADMAP.md) | A clearer docs entry point and explicit gaps |
| Turn 2 | Make current visual progress inspectable | [Visual Evidence Index](VISUAL_EVIDENCE_INDEX.md), [Testing](TESTING.md) | Fresh local screenshots, then a decision on whether to curate a committed set |
| Turn 3 | Close feature-registry coverage gaps | [Feature Registry](FEATURE_REGISTRY.md), [App Specification](APP_SPECIFICATION.md), `docs/specs/` | Missing legacy or broad features split into reviewable registry entries |
| Turn 4 | Reconcile stale or ambiguous next-slice references | [User Request Ledger](USER_REQUEST_LEDGER.md), [Roadmap](ROADMAP.md), latest verification notes | Active next work separated from historical references |

## How To Use This With The Existing Roadmap

Use this page to choose a manageable next work unit. Use [Roadmap](ROADMAP.md) and [User Request Ledger](USER_REQUEST_LEDGER.md) to decide whether that unit is actually the active project priority.

If a turn touches UI behavior, the turn is not complete until the relevant manual or automated verification path is recorded. If a turn touches only navigation docs, `mkdocs build` and link/navigation checks are the main proof.

## Current Reading

Turn 1 is represented by the docs overview work that added this page, [Project Overview Map](PROJECT_OVERVIEW.md), and [Visual Evidence Index](VISUAL_EVIDENCE_INDEX.md).

Turn 2 is the first product-adjacent follow-up if the project needs immediate screenshot review. It should generate current images locally first, then decide whether a curated docs-visible screenshot folder is worth committing.

Turns 3 and 4 are audit turns. They reduce ambiguity in the feature registry and next-slice handoff before larger product work resumes.
