# PUSH_ONLY_PROMPT

Use this prompt when local commits already exist and the only approved operation
is publishing them to the configured upstream.

## Purpose

Push approved local commits without editing files, rewriting history, or adding
new commits.

## Assumptions

- The user has provided `PUSH_OK=YES`.
- Local commits are already approved for publication.
- Worktree state and upstream distance must be verified first.

## Permission Flags

```text
PUSH_OK=YES
SYNC_OK=
COMMIT_OK=NO
```

`PUSH_OK=YES` does not imply permission to create new commits.

## Prohibited

- Do not edit files.
- Do not create new commits unless `COMMIT_OK=YES` is also provided.
- Do not force push or rewrite history.
- Do not push if upstream has moved in a way that makes the publication
  ambiguous.
- Do not hide divergence with reset, rebase, or checkout.

## First Commands

```powershell
pwd
git status --short --branch
git remote -v
git branch --show-current
git rev-list --left-right --count "HEAD...@{u}"
git log -1 --format=fuller --decorate
```

The latest commit author and committer must be checked before pushing.

## Steps

1. Confirm `PUSH_OK=YES`.
2. Confirm branch and upstream.
3. Confirm worktree is clean unless the prompt explicitly permits pushing with
   unrelated local dirt.
4. Confirm upstream distance. `1 0` usually means one local commit ready to
   push; `n 0` may be valid if all local commits are approved.
5. Confirm latest commit identity and message.
6. Push to the configured upstream.
7. Verify final parity and report the pushed branch.

## Validation

Before push:

```powershell
git status --short --branch
git rev-list --left-right --count "HEAD...@{u}"
git log -1 --format=fuller --decorate
```

After push:

```powershell
git status --short --branch
git rev-list --left-right --count "HEAD...@{u}"
```

## Stop Conditions

- `PUSH_OK` is not `YES`.
- Upstream is ahead or divergent.
- Latest commit identity is wrong or unexplained.
- Local uncommitted changes make publication state ambiguous.
- A force push would be required.

## Deliverables

- Pushed branch and remote.
- Latest commit identity readback.
- Final upstream distance, normally `0 0`.
- Any skipped or blocked publication reason.

## Completion Conditions

- Approved local commits are published.
- Final upstream distance is verified.
- No edits or new commits were made.
- No force push occurred.

## Next Prompt Output

If more work remains, output one complete future handoff prompt as the final code
block.
