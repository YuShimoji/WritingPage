# PRODUCT_WORK_WITH_UNCOMMITTED_DIFF_PROMPT

Use this prompt when product work may continue from a repository that already
contains uncommitted changes. The first goal is to protect existing work.

## Purpose

Identify and preserve existing uncommitted changes before deciding whether
product implementation can continue in the same worktree.

## Assumptions

- Existing uncommitted changes may belong to the user or to previous assistant
  work.
- Selection of a product task is not automatic approval to overwrite or discard
  those changes.
- Sync is risky when local changes exist.

## Permission Flags

```text
CODE_CHANGE_OK=
DOCS_CHANGE_OK=
SYNC_OK=
COMMIT_OK=
PUSH_OK=
```

`SYNC_OK=YES` permits sync only when the worktree state allows it or the prompt
explicitly explains how to handle local changes.

## Prohibited

- Do not run `git pull` while uncommitted changes exist unless the prompt gives
  explicit current-block approval and a conflict plan.
- Do not run `git reset --hard`, `git restore`, `git checkout -- <file>`,
  `git clean`, or `git stash` to hide or discard changes.
- Do not assume uncommitted changes are disposable.
- Do not mix product implementation with identity remediation, incident triage,
  or publication logistics.
- Do not commit or push unless `COMMIT_OK=YES` or `PUSH_OK=YES` respectively.

## First Commands

```powershell
pwd
git status --short --branch
git remote -v
git branch --show-current
git rev-list --left-right --count "HEAD...@{u}"
git diff --name-status
git diff --stat
```

If the worktree is dirty, inspect the relevant diffs before editing. Use focused
reads rather than broad file dumps.

## Steps

1. Confirm branch, upstream distance, and dirty files.
2. If dirty, classify each changed file by likely owner and surface:
   product code, test, docs, generated artifact, or unknown.
3. If ownership or intent is unclear, stop and report the exact files and why
   continuing would be unsafe.
4. If continuing is safe and approved, edit only the files needed for the
   selected product slice.
5. Use existing project patterns and focused tests for the touched surface.
6. Keep maintenance/security/identity observations out of the product slice
   unless they block the product work.

## Validation

Run the smallest validation set that proves the touched product surface. Always
include:

```powershell
git diff --check
git diff --stat
git diff --name-only
```

Add lint, unit, Playwright, or build checks according to the files changed and
repo-local invariants.

## Stop Conditions

- Dirty diff ownership is unclear.
- A required sync is blocked by `SYNC_OK=NO`.
- Product work would require changing unrelated existing diffs.
- Tests fail in a way that cannot be scoped.
- Commit is needed but `COMMIT_OK=NO`.
- Push is needed but `PUSH_OK=NO`.

## Deliverables

- Dirty-worktree classification.
- Product change summary, if implementation proceeded.
- Validation results.
- Remaining uncommitted files and their owner/intent if known.

## Completion Conditions

- Existing user/previous-work changes were not discarded.
- Product work stayed within the approved slice.
- Validation is reported, including failures or skipped checks.
- Publication flags were respected.

## Next Prompt Output

If another thread must continue, output one complete code block at the end of the
report. State that the block is the future handoff artifact.
