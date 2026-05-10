# Remote sync handoff

Date: 2026-05-11

## Purpose

別端末からすぐ再開できるよう、現在の product context、remote sync proof、次の読み順を project docs に固定する。

## Current state

- Current branch: `main`
- Remote branch: `origin/main`
- Latest product slice: `55cd355 docs: clean visual profile ui mode wording`
- Latest product slice scope: VisualProfile docs/comment-only cleanup。runtime API / profile schema / UI / storage は未変更。
- Active restart anchor: `docs/CURRENT_STATE.md`

## Resume order

1. `git pull --ff-only origin main`
2. `docs/CURRENT_STATE.md`
3. `docs/INVARIANTS.md`
4. `docs/INTERACTION_NOTES.md`
5. 次スライス選定時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`

## Next decision

- `Writing status settings exposure`: chip の表示有無・詳細度設定化。UI / storage / tests が広がるため、体感要求が出た時だけ扱う。
- `next stale-resource target`: 新規 1 ターゲットが見つかった時だけ別スライス化する。
- `WP-004 / unified shell`: 新規 FAIL 報告時だけ局所修正する。

## Proof

- `git status --short --branch` -> clean
- `git rev-list --left-right --count HEAD...origin/main` -> `0 0`
