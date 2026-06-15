# CODEX_OPERATIONS.md
Ruleset-Version: v1
Status: canonical

Codex and similar agents use this file for repository operations that are not
product behavior work: sync gates, Git identity checks, commit/push separation,
incident triage boundaries, and handoff prompt shape.

This file does not replace `CORE_RULESET.md`, `DECISION_GATES.md`, or
`STATUS_AND_HANDOFF.md`. It adds operational rules for cases where a thread can
accidentally mix product implementation with maintenance, security, identity, or
publication work.

## Work Type Boundary

Classify the current block before editing:

| Work type | Scope | Must not mix with |
|---|---|---|
| product work | user-facing behavior, UI, tests, runtime code | identity remediation, incident claims, commit-only/push-only logistics |
| maintenance | docs, tooling, cleanup, handoff, repo hygiene | product feature expansion |
| incident triage | evidence gathering for suspected credential/account/config problems | product changes or history rewrites |
| commit-only | create a local commit from already validated changes | push, new feature work, unrelated cleanup |
| push-only | publish already reviewed local commits | new edits, rebases, identity changes |

If a prompt is a maintenance or incident block, do not enter product code unless
the prompt explicitly changes the work type and gives a new approval boundary.

## Permission Flags

Use explicit flags when a block has publication, sync, or mutation risk:

| Flag | Meaning |
|---|---|
| `DOCS_CHANGE_OK=YES` | Long-lived docs may be edited within the stated scope. |
| `CODE_CHANGE_OK=YES` | Product/runtime/test code may be edited within the stated scope. |
| `SYNC_OK=YES` | Fetch/pull/sync work is allowed for this block. |
| `COMMIT_OK=YES` | A local commit may be created after validation. |
| `PUSH_OK=YES` | Approved local commits may be pushed. |

`COMMIT_OK` and `PUSH_OK` are separate. A local commit does not imply permission
to publish it. A user-requested sync is allowed for that sync block, but future
blocks should not infer `SYNC_OK=YES` unless the current prompt says so.

## Sync and Dirty Worktree Rules

Before sync or editing, run:

```powershell
git status --short --branch
git branch --show-current
git remote -v
git rev-list --left-right --count "HEAD...@{u}"
```

If there are uncommitted changes, do not run `git pull` by default. First inspect
the diff and identify owner, target, and intent. Treat existing changes as
user-owned or previous-work artifacts unless proven otherwise.

Do not discard changes with `git reset --hard`, `git restore`, `git checkout --
<file>`, `git clean`, or `git stash` unless the current prompt explicitly
allows that exact operation.

When `SYNC_OK=NO`, do not fetch or pull. Report the current upstream distance
from local readback only.

## Upstream Distance Semantics

Read `git rev-list --left-right --count "HEAD...@{u}"` by state:

| State | Typical output | Meaning |
|---|---:|---|
| clean parity before work | `0 0` | local HEAD and upstream match |
| local commit after `COMMIT_OK`, before push | `1 0` | normal unpublished local commit |
| after successful push | `0 0` | publication reached upstream |
| remote moved ahead | `0 1` | stop and decide whether sync is allowed |
| both sides moved | `n m` | stop; do not hide divergence with reset/rebase |

Do not use `0 0` as the completion condition for commit-only work. In a
commit-only block, `1 0` is usually the expected final state.

## Git Identity Check

Run these before commit-only, push-only, identity remediation, or incident
triage:

```powershell
git config --show-origin --get-regexp "user\.(name|email)"
git config --local --get-regexp "user\.(name|email)"
git config --global --get-regexp "user\.(name|email)"
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
git log -1 --format=fuller --decorate
```

An empty repo-local `user.name` / `user.email` can be normal when the effective
identity resolves from global config. Historical commits with a different author
or committer are not proof that the current config is still contaminated.

## Attribution vs Credential Incident

Keep these separate:

- Attribution contamination: a local config or automation created commits under
  an unexpected name/email.
- Credential incident: evidence that an account, token, key, app grant, or
  credential was misused or exposed.

Do not describe attribution contamination as an intrusion or credential incident
without evidence. Do not claim complete safety without checking the relevant
surfaces. Past commits with unwanted attribution may remain in history when the
current prompt forbids history rewrite.

The following checks are human-owned unless the prompt explicitly provides
approved tooling and scope:

- GitHub collaborators
- deploy keys
- GitHub Apps and OAuth grants
- PATs / SSH keys
- security log and account sessions

Agents may summarize what the human reports, but must not claim they revoked,
approved, or uninstalled these items unless the action was actually performed
and verified.

## Prompt and Handoff Shape

The prompt pasted for the current block is the current execution target. Only the
final `Next Prompt` emitted at the end of a report is a future handoff artifact.
Do not confuse the two.

When asked to output a next prompt, make it a complete single code block. It
should include purpose, assumptions, permissions, prohibitions, first commands,
steps, validation, stop conditions, deliverables, completion conditions, and the
expected output shape.

Do not add role-assignment text such as "you are ..." to Codex prompts.

## Validation and Stop Conditions

For docs-only operations, prefer:

```powershell
git diff --check
git diff --stat
git diff --name-only
```

Stop before commit, push, or completion claims if:

- uncommitted diff ownership is unclear
- product code changes appear in a maintenance-only block
- identity or credential facts would require unsupported claims
- sync is needed but `SYNC_OK=NO`
- commit is needed but `COMMIT_OK=NO`
- push is needed but `PUSH_OK=NO`
