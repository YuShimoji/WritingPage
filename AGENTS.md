# AGENTS.md
# Codex adapter. Keep thin.
# Canonical source of truth lives in `docs/CURRENT_STATE.md`, `docs/ai/*.md`, and role-limited project docs.

## Read order on restart
1. `docs/CURRENT_STATE.md` の live block（履歴は必要な証拠を探す時だけ読む）
2. `docs/INVARIANTS.md`（破ってはいけない条件・責務境界・テスト作法）
3. `docs/INTERACTION_NOTES.md`（UI 状態モデル・手動確認・報告形式）
4. 必要時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`

## Adapter rules
- Do not restate the whole ruleset here. Reporting style and closeout chain live in `docs/ai/STATUS_AND_HANDOFF.md` and `docs/INTERACTION_NOTES.md`.
- Review Card / freeform review intake / long-run autonomy rules live in `docs/OPERATOR_REVIEW_UX.md`.
- Agent-wide behavior rules live in `docs/ai/*.md`; read them when the task touches agent workflow, decision gates, handoff, or option generation.
- Project facts, session state, and restart direction are anchored in `docs/CURRENT_STATE.md`.
- Removed stale restart magnets must not be recreated; use `docs/CURRENT_STATE.md` instead.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.

## Reporting style (workspace-wide, set 2026-05-11)

Reports make the work usable without forcing the user to open files.
State what changed, why it matters for the workflow or decision space,
what remains uncertain, and what the next concrete moves are — in natural language.

Non-trivial reports are expected to include, as substance (not as fixed-label
fillers):

- a **comparison table** for changes / options / residual work when more than
  one item is in play. Column names are flexible — pick ones that fit the
  actual axis of comparison (e.g. 作業 / 目的 / 効果 / 必要条件 / 現在状態 /
  次の動き). The table supports the prose, it does not replace it.
- a **次に推奨する作業 / 次の取っ掛かり** section with 2〜4 entries that solve
  different bottlenecks — for example `Advance` (進める), `Audit` (見る),
  `Excise` (削る), `Explore` (広げる), `Verify` (確かめる). Each entry should
  say which workflow stage friction it relieves and what becomes possible
  after it.

What is forbidden is mechanical empty-label scaffolding — e.g. emitting
`summary` / `evidence` / `risk` / `next owner` / `assistant status` /
`assistant next` / `差分の焦点` / `次の owner` as fixed English / labeled
headings with thin one-line content underneath. Those concepts are internal
checks, not output fields. Use Japanese natural section headings and keep the
content substantive. Avoid `P0/P1`, bare path lists, or test names as the
explanation itself; cite them as evidence after the meaning is stated.

Short Q&A, lookups, and exploratory direction questions stay terse and do not
require the table + recommended-move structure.

## Git follow-through (assistant-owned by default)

Git follow-through is assistant-owned by default. After a validated slice, run
non-destructive `git add` / `git commit` / `git push` without asking again. Stop
and confirm before destructive operations (force-push, history rewrite,
ambiguous large deletions), cross-repo publication, or when the user has
explicitly prohibited a step.

## Imported Claude Cowork project instructions
