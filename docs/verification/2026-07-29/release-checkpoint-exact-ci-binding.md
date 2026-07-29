# Release checkpoint exact-CI binding

Date: 2026-07-29 (JST)

## Outcome

`release:checkpoint` can now bind a supplied GitHub Actions run to the exact
checkpoint source before smoke, unit, lint, build, capture, or Electron package
work starts:

```powershell
npm run release:checkpoint -- --remote-full-run-id <run-id>
```

The generator reads the run with `gh run view` and requires all of the
following:

- the returned database ID equals the requested run ID;
- status is `completed`;
- conclusion is `success`;
- `headSha` exactly equals the checkpoint source commit.

Any mismatch fails closed before output creation and before the expensive
machine gates. A run ID may optionally be paired with
`--remote-full-repo owner/repository`; otherwise the GitHub repository is
derived from `origin`.

## Baseline compatibility

Calling `release:checkpoint` without a run ID still preserves the accepted
repository baseline run `29198025986` / `cf4b432`, but records it as
`evidenceScope=repository_baseline` plus an explicit `sourceMatched` value.
Generated Markdown says that this baseline is not exact-current acceptance.
It is no longer possible for the default path to describe the historic run as
if it were bound to a different current source.

The existing `b02ceb1` candidate checkpoint remains immutable. It still
contains the historic baseline and is accompanied by the already-verified
exact-current run `30200150522`. This tooling slice does not rewrite that
checkpoint, regenerate the package, or change its release decision.

## Validation

| Gate | Result |
| --- | --- |
| Syntax checks for generator, library, and focused test | pass |
| Focused checkpoint/readiness tests | 10/10 pass |
| Complete Node unit suite | 41/41 pass |
| JavaScript lint | pass |
| Live `gh run view` binding for run `30200150522` | `completed/success`, head SHA exactly `b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8` |
| `npm ls --depth=0` | pass |
| New verification-note Markdown lint / `git diff --check` | pass |

The focused tests cover argument parsing, HTTPS/SSH origin normalization,
historic baseline classification, exact-source success, and fail-closed source
mismatch.

The existing authority files retain their historical Markdown lint warnings;
this slice did not widen those lines.

## Preservation and remaining gate

The candidate package remains:

- `build/win-unpacked/Zen Writer.exe`;
- 201233408 bytes;
- SHA-256
  `3a877a0f912dac6c17352e68d78e53a8eb9c3a59626ad5d3a12e44f1a75bece8`.

This change does not observe Electron behavior. The candidate remains
`HOLD_FOR_ELECTRON_OBSERVATION` until a human launches this exact package,
enters test-only text, saves, exits, restarts, and confirms recovery. No
observation derivative, internal review approval, main integration, tag,
signing, publication, upload, or distribution was performed.
