# AGENTS.md
# Codex adapter. Keep thin.
# Canonical source of truth lives in `docs/CURRENT_STATE.md`, `docs/ai/*.md`, and role-limited project docs.

## Read order on restart
1. `docs/CURRENT_STATE.md`（Snapshot・最新 handoff・ドキュメント地図・検証結果）
2. `docs/INVARIANTS.md`（破ってはいけない条件・責務境界・テスト作法）
3. `docs/INTERACTION_NOTES.md`（UI 状態モデル・手動確認・報告形式）
4. 必要時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`

## Adapter rules
- Do not restate the whole ruleset here. Reporting style and closeout chain live in `docs/ai/STATUS_AND_HANDOFF.md` and `docs/INTERACTION_NOTES.md`.
- Agent-wide behavior rules live in `docs/ai/*.md`; read them when the task touches agent workflow, decision gates, handoff, or option generation.
- Project facts, session state, and restart direction are anchored in `docs/CURRENT_STATE.md`.
- Removed stale restart magnets must not be recreated; use `docs/CURRENT_STATE.md` instead.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.

## Reporting style (workspace-wide, set 2026-05-11)

Reports make the work usable without forcing the user to open files. State what changed, why it matters for the workflow or decision space, what remains uncertain, and what the next concrete move is — in natural language.

Do not emit fixed closeout labels such as `summary` / `evidence` / `risk` / `next owner` / `assistant status` / `assistant next` / `差分の焦点` / `次の owner` as visible output structure unless the user explicitly asks for that shape. Those concepts are internal checks, not output fields. Preserve the logical chain in normal sentences.

When listing residual work or options, give each item enough context to choose: purpose, effect, prerequisite, current state, who moves next. Avoid `P0/P1`, bare path lists, or test names as the explanation. Tables are optional and column names are not fixed.

## Git follow-through (assistant-owned by default)

Git follow-through is assistant-owned by default. After a validated slice, run non-destructive `git add` / `git commit` / `git push` without asking again. Stop and confirm before destructive operations (force-push, history rewrite, ambiguous large deletions), cross-repo publication, or when the user has explicitly prohibited a step.
