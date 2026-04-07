# AGENTS.md
# Codex adapter. Keep thin.
# Canonical source of truth lives in docs/ai/*.md and project-local canonical docs.

## Read order
1. `docs/ai/CORE_RULESET.md`
2. `docs/ai/DECISION_GATES.md`
3. `docs/ai/STATUS_AND_HANDOFF.md`
4. `docs/ai/WORKFLOWS_AND_PHASES.md`
5. `docs/INVARIANTS.md`
6. `docs/CURRENT_STATE.md`（Snapshot・ドキュメント地図・検証結果。事実関係の起点）
7. `docs/USER_REQUEST_LEDGER.md`
8. `docs/OPERATOR_WORKFLOW.md`
9. `docs/INTERACTION_NOTES.md`
10. `docs/runtime-state.md`（補助: カウンター・量的指標）
11. `docs/project-context.md`（補助: 長命背景・暗黙仕様メモ）
12. `docs/FEATURE_REGISTRY.md`
13. `docs/AUTOMATION_BOUNDARY.md`

## Adapter rules
- Do not treat this file as the place to restate the whole ruleset.
- 作業再開時の事実関係は `docs/CURRENT_STATE.md` の Snapshot・地図・検証結果を先に読む。詳細な不変条件は `INVARIANTS.md`。`runtime-state` / `project-context` はカウンター・背景メモ。
- Project-local canonical docs are factual memory and should be used before asking the user to repeat context.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.
