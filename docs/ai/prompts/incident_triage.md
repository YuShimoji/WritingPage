# INCIDENT_TRIAGE_PROMPT

Use this prompt when a repository shows signs that may indicate attribution
contamination, account/security concern, unexpected remote access, or credential
exposure. This is an evidence-gathering prompt, not a product or remediation
approval.

## Purpose

Separate observed facts from hypotheses, identify which checks are repo-local
and which are human-owned, and avoid overclaiming security conclusions.

## Assumptions

- Repo-local Git evidence can show commits, remotes, config, and diffs.
- GitHub Web UI checks for collaborators, deploy keys, Apps, OAuth grants, PATs,
  SSH keys, account sessions, and security log are human-owned unless the prompt
  explicitly provides approved tooling.
- Credential values must not be printed.

## Permission Flags

```text
DOCS_CHANGE_OK=
CONFIG_CHANGE_OK=
SYNC_OK=
COMMIT_OK=NO
PUSH_OK=NO
```

Incident triage does not imply permission to mutate the repository.

## Prohibited

- Do not change product code.
- Do not revoke, approve, uninstall, or rotate external credentials unless the
  prompt explicitly authorizes that action and the tool access exists.
- Do not output tokens, secrets, or key material.
- Do not assert intrusion, credential theft, or complete safety without
  evidence.
- Do not rewrite history or force push.
- Do not discard uncommitted changes.

## First Commands

```powershell
pwd
git status --short --branch
git remote -v
git branch --show-current
git rev-list --left-right --count "HEAD...@{u}"
git config --show-origin --get-regexp "user\.(name|email|signingkey)"
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
git log -5 --format="%h %an <%ae> | %cn <%ce> | %s"
git log -1 --format=fuller --decorate
```

Run broader history searches only for the specific strings or addresses named in
the prompt.

## Steps

1. Record repo-local facts: branch, upstream, dirty state, identity config,
   latest commits, and remotes.
2. Separate current configuration from historical commit attribution.
3. Identify whether evidence points to config contamination, suspicious remote
   access, unexpected commit history, or missing information.
4. List human-owned GitHub/account checks separately.
5. If documentation is approved, write an evidence-bounded incident note.
6. Stop before remediation actions that need human approval.

## Validation

For docs-only notes:

```powershell
git diff --check
git diff --stat
git diff --name-only
```

For config changes, rerun identity/config readback. Do not print secrets.

## Stop Conditions

- Human-owned GitHub/account evidence is required to continue.
- Credential material appears in output or diffs.
- The requested action would require revocation, rotation, force push, or
  history rewrite without explicit approval.
- Commit or push is requested while `COMMIT_OK=NO` or `PUSH_OK=NO`.

## Deliverables

- Evidence table separating repo-local facts from human-owned checks.
- Classification: attribution/config issue, credential incident candidate, or
  insufficient evidence.
- Clear list of actions not taken.
- Validation results if any docs/config changes were made.

## Completion Conditions

- No unsupported security claim is made.
- Secrets are not exposed.
- Product work is untouched.
- Human-owned checks are explicitly assigned to the human.

## Next Prompt Output

If follow-up is needed, output a single complete code block at the end. It must
state whether it is for remediation, account-side review, commit-only, or
push-only work.
