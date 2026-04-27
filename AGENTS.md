# AGENTS.md
# Codex adapter. Keep thin.
# Canonical source of truth lives in `docs/CURRENT_STATE.md`, `docs/ai/*.md`, and role-limited project docs.

## Read order on restart
1. `docs/CURRENT_STATE.md`（Snapshot・最新 handoff・ドキュメント地図・検証結果）
2. `docs/INVARIANTS.md`（破ってはいけない条件・責務境界・テスト作法）
3. `docs/INTERACTION_NOTES.md`（UI 状態モデル・手動確認・報告形式）
4. 必要時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`

## Adapter rules
- Do not restate the whole ruleset here.
- Agent-wide behavior rules live in `docs/ai/*.md`; read them when the task touches agent workflow, decision gates, handoff, or option generation.
- Project facts, session state, and restart direction are anchored in `docs/CURRENT_STATE.md`.
- Removed stale restart magnets must not be recreated; use `docs/CURRENT_STATE.md` instead.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.
