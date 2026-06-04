# Issue #118 / PR #119 meta-review gate

Date: 2026-06-05

## Decision

Category after correction: non-blocking stale/reference context; continue from current-main priorities unless embed security is explicitly selected.

Do not proceed from PR #119 as an implementation artifact. PR #119 is reference-only, and Issue #118 should not start a new branch from the old PR branch. However, PR #119 / Issue #118 close state is bookkeeping, not a product-work blocker in this repo. If cleanup can be done safely by an agent, it may be done; if not, this note is enough to demote the stale artifacts and return to current-main work.

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

PR #119 should be treated as reference-only. Its branch name, title/body, and `Closes #118` claim point to embed security, but the tree payload is PathText Phase 4 and the same payload is already on `main` as `49c3c2f`.

Issue #118 should be treated as stale bookkeeping or, only when selected, a current-main missing-DoD audit. Open state alone is not implementation approval and does not block `Rich Editing Heading Shortcut Decision`, stale spec reconciliation, or other current-main work.

## Non-blocking GitHub cleanup and product priority

GitHub cleanup:

- PR #119 may be closed/commented as reference-only if the agent can safely do it.
- Issue #118 may be closed if the current-main evidence is sufficient and the agent can safely do it.
- If cleanup is not safe or not worth the slice, leave GitHub as-is; this repo does not treat open PR / Issue state as active artifact authority.

Human input, if needed, should be product priority only:

- Whether embed security should become the next selected product slice.
- Or whether to continue the current mainline candidates: `Rich Editing Heading Shortcut Decision` or stale spec reconciliation.

If embed security is selected, start from current `main` and audit only missing DoD. Do not reuse `feature/ISSUE-118-postmessage-security`.

## What can proceed next

- Current-main product work: `Rich Editing Heading Shortcut Decision` first, stale spec reconciliation second.
- Optional safe GitHub cleanup, if it is cheap and agent-side.
- A narrow embed-security missing-DoD audit only if the user selects embed security as current priority.

## What must not proceed

- Do not merge, rebase, force-push, or cherry-pick PR #119.
- Do not start Issue #118 implementation from `feature/ISSUE-118-postmessage-security`.
- Do not revive `docs/EMBED_TESTING.md` just because the old issue body names it; if embed test docs are needed, decide the current doc owner first.
- Do not treat GitHub close/comment bookkeeping or docs/readback growth as product progress. The active product path remains current-main writing trust unless a real embed-security gap is selected.

## Validation

- `node --check js/embed/child-bridge.js`
- `node scripts/dev-check.js`
- `git diff --check`
- `git diff --cached --check`
