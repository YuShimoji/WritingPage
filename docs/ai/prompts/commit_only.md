# COMMIT_ONLY_PROMPT

Use this prompt when changes are already reviewed enough to create a local
commit, but pushing is not approved.

## Purpose

Create a local commit from the approved diff without starting new work or
publishing to remote.

## Assumptions

- The diff already exists in the worktree.
- The user has provided `COMMIT_OK=YES`.
- `PUSH_OK` may still be `NO`.

## Permission Flags

```text
COMMIT_OK=YES
PUSH_OK=
SYNC_OK=
```

Do not commit without `COMMIT_OK=YES`. Do not push unless `PUSH_OK=YES`.

## Prohibited

- Do not make new feature changes.
- Do not include unrelated files.
- Do not push after the commit unless `PUSH_OK=YES`.
- Do not require final upstream distance `0 0`; commit-only completion often
  ends at `1 0`.
- Do not rewrite history or amend unrelated prior commits unless explicitly
  requested.

## First Commands

```powershell
pwd
git status --short --branch
git remote -v
git branch --show-current
git rev-list --left-right --count "HEAD...@{u}"
git config --show-origin --get-regexp "user\.(name|email)"
git config --local --get-regexp "user\.(name|email)"
git config --global --get-regexp "user\.(name|email)"
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
git log -1 --format=fuller --decorate
git diff --stat
git diff --name-only
```

## Steps

1. Confirm `COMMIT_OK=YES`.
2. Confirm worktree diff scope and identity.
3. Run or verify the validation required for the diff.
4. Stage only the approved files.
5. Create a concise commit message that matches repository style.
6. Verify the new commit with `git log -1 --format=fuller --decorate`.
7. Check upstream distance.

## Validation

Before commit, run:

```powershell
git diff --check
git diff --stat
git diff --name-only
```

Run additional tests required by the changed surface. After commit, run:

```powershell
git status --short --branch
git rev-list --left-right --count "HEAD...@{u}"
git log -1 --format=fuller --decorate
```

## Stop Conditions

- `COMMIT_OK` is not `YES`.
- Identity is wrong or uncertain.
- Diff scope includes unapproved files.
- Validation fails.
- Staging would require discarding or hiding unrelated changes.

## Deliverables

- Commit hash and message.
- Author/committer readback.
- Final worktree and upstream distance.
- Explicit note that push was not performed unless `PUSH_OK=YES`.

## Completion Conditions

- Approved files are committed locally.
- Latest commit identity is verified.
- If push was not approved, upstream distance `1 0` is reported as normal.
- No remote publication happened without `PUSH_OK=YES`.

## Next Prompt Output

If push or follow-up work remains, output one complete code block at the end of
the report. The code block is a future handoff artifact.
