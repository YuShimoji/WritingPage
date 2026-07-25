# G3 H2 main integration

Date: 2026-07-25 (JST)

## Outcome

Authority `AUTH-WP-H2-MAIN-INTEGRATE-20260725` approved integration of exact H2
head `c37c8aecb6b2ef3d8ce0470f36b403ab3c6b6457`. A unique clean sibling
worktree started from exact `origin/main`
`889a6427f3c9ec39b7e39d90e956ff528ec7f75e` and fast-forwarded to the
accepted head without squash, cherry-pick rewriting, rebase, force, or a merge
commit.

The documentation-only commit containing this note is the final integration
closeout commit. Its exact SHA is the final `origin/main` value reported in the
AGENT_REPORT. The accepted H2 head must remain its ancestor.

## Before and after

| Surface | Before | After |
| --- | --- | --- |
| Main authority | `origin/main` at `889a642` | accepted H2 history plus one documentation-only closeout commit |
| H2 delivery | isolated remote feature branch at `c37c8ae` | full accepted history contained by main; feature branch retained |
| Release tooling | validated on H2 branch | available from main without post-acceptance implementation edits |
| Next critical Outcome | H2 integration decision | release-candidate identity on clean integrated main |

Preflight `origin/main...origin/H2` was `0 6`, and
`git merge-base --is-ancestor origin/main origin/H2` exited 0. After the
ff-only update, `c37c8ae` was HEAD and its ancestor check against integration
HEAD exited 0.

## Scope and preservation

The six accepted H2 commits were integrated unchanged. The only post-H2 write
is the bounded authority closeout across:

- the `CURRENT_STATE` live block;
- current/immediate sections of `ROADMAP` and `USER_REQUEST_LEDGER`;
- the `PROJECT_COCKPIT` evidence route;
- this dated verification note.

No post-acceptance changes were made to JavaScript, CSS, HTML, Electron,
storage/autosave/document behavior, release-observation implementation,
focused tests, dependencies, lockfile, package version, package contents, or
workflows.

The primary checkout's `.serena/project.yml` remained user/tool-owned. Its
preflight SHA-256 was
`2d5a5c4c592efb60dfc2e5319a1ab1f7b87ae24c862f7c6dbcf9a2226653d00d`.
It was not restored, stashed, staged, committed, hidden, or overwritten.

## Validation

The clean integration worktree used Node `v24.13.0` and npm `11.6.2`.

| Gate | Result |
| --- | --- |
| Syntax checks for the two release-observation scripts and focused test | pass |
| `npm ls --depth=0` | pass |
| Focused observation ingestion | 12/12 pass |
| Complete Node unit suite | 33/33 pass |
| Smoke | `ALL TESTS PASSED` |
| JavaScript lint | pass |
| Targeted Markdown lint and `git diff --check` | pass |
| Final main remote CI | required on the exact closeout commit; exact run ID and result are fixed in AGENT_REPORT |

The intentional invalid-JSON and forced-storage-failure stderr belongs to
negative-path unit coverage; the suite result was 33/33 pass.

Local full Playwright, SP-071, package build, checkpoint generation, package
launch, and `release:observe` were not run. No checkpoint, package,
observation input, or derivative was regenerated or committed.

## Identity and claim boundary

The observed executable remains bound to base product commit `889a642`:

- checkpoint SHA-256:
  `7b06d1d5ad2e146d218fca08cb0dc72e60285f3b91cfae2b7b389dccc5824f77`;
- package SHA-256:
  `063a785693a5dc781459176f9a1a2cf01bb1483b34a464039e5febbad06d93c6`.

Its package launch and aggregate major operations are user-reported. Save and
restart persistence is inherited prior repeated verification. A fresh
exact-package persistence replay was not performed.

`READY_FOR_INTERNAL_RELEASE_REVIEW` does not approve a post-integration release
candidate, signing, tagging, publication, upload, external beta, or
distribution. A future candidate must be created as a separate identity from
clean integrated main under separate authority.

## Successor candidates

| Candidate | State | Owner / trigger |
| --- | --- | --- |
| Release-candidate identity on integrated main | proposed / critical | assistant after a separate candidate-generation Mission |
| Documents tactile review | hold / nonblocking | user freeform review at normal working size |
| Dependency and CI-runtime maintenance audit | proposed / nonblocking | read-only audit before any dependency/workflow change |
| WP-004 / WP-001 narrow product slice | hold / evidence-triggered | fresh preview/Reader difference or tactile failure |

Cloud sync, public docs, product polish, signing, tagging, publication, and
distribution remain outside this integration Outcome.
