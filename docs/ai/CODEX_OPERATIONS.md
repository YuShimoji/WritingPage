# CODEX_OPERATIONS.md
Ruleset-Version: v2
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
| product work | user-facing behavior, UI, runtime code, and the directly related tests/docs/tooling needed to deliver it | identity remediation, incident claims, unrelated cleanup |
| maintenance | docs, tooling, cleanup, handoff, repo hygiene | unrelated product feature expansion |
| incident triage | evidence gathering for suspected credential/account/config problems | product changes or history rewrites |
| commit-only | create a local commit from already validated changes | push, new feature work, unrelated cleanup |
| push-only | publish already reviewed local commits | new edits, rebases, identity changes |

Work type prevents unrelated scope expansion; it does not split one outcome into
separate prompts. Product work includes its related verification and canonical
doc sync. Maintenance may change maintenance tooling when that is the requested
outcome. Incident triage remains read-only unless the prompt explicitly changes
the boundary.

## Permission Overrides

Explicit flags may be used by machine-generated operational prompts, but they
are overrides, not mandatory magic words. Natural-language user authorization
and project-local defaults remain valid. In this repository, validated Git
follow-through is assistant-owned by default unless the current request forbids
it.

| Flag | Meaning |
|---|---|
| `DOCS_CHANGE_OK=NO` | Do not edit long-lived docs in this block. |
| `CODE_CHANGE_OK=NO` | Do not edit product/runtime/test code in this block. |
| `SYNC_OK=NO` | Do not fetch or pull in this block. |
| `COMMIT_OK=NO` | Do not create a local commit in this block. |
| `PUSH_OK=NO` | Do not publish commits in this block. |

Do not infer `NO` from a missing flag. Destructive history edits, force-push,
cross-repository publication, and the red-band changes in `DECISION_GATES.md`
still require explicit approval.

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
from local readback only. Otherwise, an explicit request to update from remote
authorizes a normal fetch and fast-forward-only pull.

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
commit-only block, `1 0` is usually the expected final state. In ordinary
validated product or maintenance work, follow the repository's default
commit/push policy rather than creating a separate handoff block.

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

When asked for a normal supervisor-to-executor prompt, use
`docs/ai/prompts/supervisor_to_codex.md` and emit one complete code block. State
the outcome, current evidence, bounded outcome slice, autonomy envelope, hard
stops, acceptance evidence, and closeout. Leave route discovery, first commands,
and implementation steps to the executor unless they are themselves a verified
constraint.

Exact first commands, permissions, prohibitions, and output shape belong in a
special operational prompt only when the task is commit-only, push-only,
incident triage, identity remediation, or another operation whose safe boundary
depends on those details. Do not turn a normal product outcome into a chain of
command-sized prompts.

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
