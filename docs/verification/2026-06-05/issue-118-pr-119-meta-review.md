# Issue #118 / PR #119 meta-review gate

Date: 2026-06-05

## Decision

Category: `request authority`.

Do not proceed from PR #119 as an implementation artifact. PR #119 is a reference-only / close candidate, and Issue #118 should not start a new branch until a human confirms whether the already-present embed security work on current `main` is enough to close the issue or whether a new narrow audit issue is needed.

## Authority docs read

- `AGENTS.md`
- `docs/CURRENT_STATE.md`
- `docs/INVARIANTS.md`
- `docs/INTERACTION_NOTES.md`
- `docs/ai/STATUS_AND_HANDOFF.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/ROADMAP.md`
- `docs/BRANCHING.md`
- `docs/TESTING.md`
- `docs/EMBED_SDK.md`

`docs/EMBED_TESTING.md` is referenced by Issue #118 but is missing in current `main`; this is stale authority, not a blocker.

## Readback

- `git fetch --prune origin` completed.
- `git status --short --branch` showed synchronized `main...origin/main` with staged docs-only handoff changes already present from the 2026-06-04 cross-terminal handoff.
- `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- `git branch --all --contains HEAD` showed `main`, `origin/main`, and `origin/HEAD`.
- Issue #118 is open. Its body targets child iframe postMessage security: strict parent source, strict origin, no `*` send, two-port cross-origin demo, embed docs, and `scripts/dev-check.js` pattern checks.
- PR #119 is open from `feature/ISSUE-118-postmessage-security` to `main`, with merge state `DIRTY`.
- PR #119 changed files are `css/style.css`, PathText docs/spec-index/roadmap context, `e2e/pathtext-handles.spec.js`, `e2e/dock-preset.spec.js`, `js/editor-wysiwyg.js`, and `js/modules/editor/PathHandleOverlay.js`; they are not the embed security files named by Issue #118.
- PR #119 head commit `4f620e9` has the same tree as current-main ancestor `49c3c2f`. The payload is SP-073 PathText freehand drawing and is already present on `main` under the correct commit.
- `origin/main..origin/feature/ISSUE-118-postmessage-security` is not a narrow embed diff. It is a large stale-branch reverse diff that would delete current authority docs, recent verification notes, current E2E, Local Gadget Mod work, and writing-trust/import-trust artifacts.
- Current `main` source readback shows `js/embed/child-bridge.js` requires `event.source === window.parent`, requires `event.origin === allowedOrigin`, avoids sending when `allowedOrigin` is missing, and uses `window.parent.postMessage(msg, allowedOrigin)`.
- Current `main` also has `js/embed/zen-writer-embed.js` targetOrigin handling, `embed-xorigin-demo.html`, `docs/EMBED_SDK.md` cross-origin notes, and `scripts/dev-check.js` bridge security pattern checks.

## Handling of old artifacts

PR #119 should be treated as reference-only / close candidate. Its branch name, title/body, and `Closes #118` claim point to embed security, but the tree payload is PathText Phase 4 and the same payload is already on `main` as `49c3c2f`.

Issue #118 should be treated as an audit / close decision, not as implementation approval. If current `main` satisfies the intended postMessage security DoD, close it with a note that the implemented source is already on `main`; if more work is needed, open a new narrow issue from current `main` with only the missing embed-security deltas.

## Human authority decision needed

Target artifact: GitHub PR #119.

Human decision: whether to close PR #119 as reference-only because it does not implement Issue #118 and its payload is already present on `main`.

Operation: comment on PR #119 that the branch title/body claim Issue #118, but the diff is SP-073 PathText freehand drawing already present on `main` as `49c3c2f`; then close the PR without merge.

OK condition: PR #119 is closed, and future work does not use `feature/ISSUE-118-postmessage-security` as an implementation branch.

NG return information: GitHub permission error, unexpected required review policy, or any new comment proving PR #119 intentionally carries a different active artifact.

Target artifact: GitHub Issue #118.

Human decision: whether to close Issue #118 as satisfied by current `main`, or request a new narrow audit issue that only checks missing embed-security acceptance criteria.

Operation: if satisfied, close Issue #118 with references to current `main` source readback (`js/embed/child-bridge.js`, `js/embed/zen-writer-embed.js`, `scripts/dev-check.js`, `embed-xorigin-demo.html`, `docs/EMBED_SDK.md`). If not satisfied, create a new issue that states only the missing acceptance checks from current `main`.

OK condition: Issue #118 is either closed with a current-main rationale or replaced by a narrow current-main audit issue.

NG return information: which exact DoD item is still missing from current `main`, and the file / command evidence.

## What can proceed next

- Close or comment on PR #119 after human approval.
- Decide Issue #118 closure versus a new current-main audit issue.
- If a new audit issue is requested, run a narrow embed-security verification slice from current `main`; do not reuse PR #119.

## What must not proceed

- Do not merge, rebase, force-push, or cherry-pick PR #119.
- Do not start Issue #118 implementation from `feature/ISSUE-118-postmessage-security`.
- Do not revive `docs/EMBED_TESTING.md` just because the old issue body names it; if embed test docs are needed, decide the current doc owner first.
- Do not treat docs/readback growth as product progress. The active product path remains current-main writing trust unless a real embed-security gap is selected.

## Validation

- `node --check js/embed/child-bridge.js`
- `node scripts/dev-check.js`
- `git diff --check`
- `git diff --cached --check`
