# MAINTENANCE_IDENTITY_REMEDIATION_PROMPT

Use this prompt when a repository needs Git identity cleanup, attribution
boundary review, or maintenance documentation for commit identity handling. This
is not product behavior work.

## Purpose

Separate current Git identity configuration, historical attribution, and possible
credential/security concerns. Fix only the approved maintenance surface and
preserve a clear handoff.

## Assumptions

- The current workspace is the target repository.
- Historical commits may contain an unwanted author or committer.
- History rewrite is not allowed unless the prompt explicitly says otherwise.
- GitHub account and app/security checks are human-owned unless separate tooling
  and approval are provided.

## Permission Flags

Set these explicitly in the task prompt:

```text
DOCS_CHANGE_OK=
CONFIG_CHANGE_OK=
COMMIT_OK=
PUSH_OK=
SYNC_OK=
```

`COMMIT_OK` and `PUSH_OK` are separate. `SYNC_OK=NO` means do not fetch or pull
in this block.

## Prohibited

- Do not change product code.
- Do not rewrite history, force push, run `filter-repo`, or run `filter-branch`.
- Do not run `git reset --hard`, `git restore`, `git checkout -- <file>`,
  `git clean`, or `git stash` to discard changes.
- Do not output secrets, tokens, PATs, SSH keys, or credential values.
- Do not claim intrusion, compromise, or complete safety without evidence.
- Do not claim GitHub Apps, OAuth grants, PATs, deploy keys, or security-log
  items were changed unless the action was actually performed and verified.

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
```

If `git config --local --get-regexp` returns no values, report that as empty
local identity config, not as a failure by itself.

## Steps

1. Confirm worktree state and upstream distance.
2. Read repo-local instructions and operations docs.
3. Compare local, global, effective, and latest commit identity.
4. Search raw Git author/committer records for the suspected string or address
   only if the prompt asks for history evidence.
5. Classify the issue as current config, historical attribution, or
   human-owned account/security follow-up.
6. If docs/config changes are approved, make only the approved change.
7. Preserve a handoff that states what was proven, what was not proven, and who
   owns remaining checks.

## Validation

For docs-only changes:

```powershell
git diff --check
git diff --stat
git diff --name-only
```

For config changes, rerun the Git identity commands and report effective author
and committer. Do not print secrets.

## Stop Conditions

- Uncommitted diff ownership is unclear.
- The requested fix would require history rewrite.
- Credential/security claims require evidence not available in the repo.
- Commit is needed but `COMMIT_OK=NO`.
- Push is needed but `PUSH_OK=NO`.
- Sync is needed but `SYNC_OK=NO`.

## Deliverables

- Current identity readback.
- Attribution vs credential-incident classification.
- Any approved docs/config changes.
- Human-owned GitHub/account checks listed separately.
- Validation results.

## Completion Conditions

- Current effective identity is stated.
- Historical attribution is not misreported as current config.
- Credential incident language is evidence-bounded.
- No product work was changed.
- Commit/push/sync flags were respected.

## Next Prompt Output

If a next prompt is needed, output exactly one complete code block at the end of
the report. Treat that block as a future handoff artifact, not as work already
performed.
