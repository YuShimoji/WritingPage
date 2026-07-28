# Release-candidate identity for `b02ceb1`

Date: 2026-07-28 (JST)

## Outcome

Clean exact-main source
`b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8`
(`fix: remediate markdown linkification DoS`) now has a new one-to-one
release-candidate checkpoint, dist capture, Electron directory package, and
operator sheet. The machine decision is
`HOLD_FOR_ELECTRON_OBSERVATION`: source, local acceptance, capture, and package
identity are verified; Electron behavior remains a human-owned pending gate.

The candidate was generated in the dedicated worktree
`C:\Users\thank\Storage\Media Contents Projects\WritingPage-release-candidate-b02ceb1`
on branch `codex/release-candidate-identity-b02ceb1`. The primary checkout's
tool-owned `.serena/project.yml` was not used as candidate source and was not
restored, stashed, staged, committed, hidden, or overwritten.

## Identity

| Item | Value |
| --- | --- |
| Source commit | `b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8` |
| Source dirty | `false` |
| Node / npm | `v24.13.0` / `11.6.2` |
| Checkpoint | `output/release-readiness/checkpoint-b02ceb1-2026-07-28/checkpoint.json` |
| Checkpoint SHA-256 | `24f69ed13de23322784e84e1ecf67fe76714fd8fabf54545054c8c635c174891` |
| Capture manifest SHA-256 | `a1e6022b5f68d7214007403297f1e0eda095b7a06b9df60a736a40a1664d9c23` |
| Package | `build/win-unpacked/Zen Writer.exe` |
| Package size | `201233408` bytes |
| Package SHA-256 | `3a877a0f912dac6c17352e68d78e53a8eb9c3a59626ad5d3a12e44f1a75bece8` |
| Required Electron identity | `3a877a0f912dac6c17352e68d78e53a8eb9c3a59626ad5d3a12e44f1a75bece8` |
| Decision | `HOLD_FOR_ELECTRON_OBSERVATION` |

The checkpoint, capture manifest, package, and operator sheet were read back
independently. Checkpoint source and capture source both equal the exact source
commit with `dirty=false`; the independently computed executable SHA equals
both `checkpoint.package.sha256` and the operator gate's required identity.

## Machine validation

| Gate | Result |
| --- | --- |
| Independent `npm ci --no-audit --no-fund` | pass; 504 packages installed |
| `npm ls --depth=0` | pass |
| Exact-main remote CI | run `30200150522`, job `89788577424`, exact `b02ceb1`, success |
| Smoke | `ALL TESTS PASSED` |
| Node unit suite | 36/36 pass |
| Full JavaScript lint | pass |
| Dist build | pass |
| Dist capture | pass; 7 PNG plus manifest/readback |
| Electron directory build | pass |
| Checkpoint synthesis | `HOLD_FOR_ELECTRON_OBSERVATION` |

The invalid-JSON and forced-storage-failure stderr emitted during the unit suite
belongs to expected negative-path coverage. The suite result is 36/36 pass.

The main desktop and Design Cockpit captures were visually inspected. The main
Rich editing surface rendered the representative fixture normally; Design
Cockpit showed saved state, 83-character count, Rich editing identity, and no
fixture-manuscript leakage in its review summary.

## Evidence boundary

- Verified: Git/source identity, clean-source flag, dependency tree, local
  bounded gates, exact-main CI readback, capture manifest/readback, package
  existence/size/SHA, and generated operator sheet identity.
- Observed: the generated dist screenshots were visually inspected.
- Unverified: launch, input, save, exit, restart, and recovery behavior of the
  exact new package.
- Unknown: findings from the future Electron observation.

The generator's `webAcceptance.remoteFull` field still records the older
repository-wide baseline run `29198025986` / `cf4b432`. Exact current-main CI
`30200150522` / `b02ceb1` was independently verified for this candidate and is
recorded above. Static remote-CI metadata in the generator is nonblocking tool
debt; it must not be represented as exact-current evidence without this
separate readback.

## Next gate and preservation

The next gate belongs to the package observer:

1. use the exact executable identified above;
2. follow `ELECTRON_OPERATOR_REVIEW.md`;
3. record PASS, FAIL, or HOLD against the exact package SHA;
4. return the observation through `npm run release:observe` into a new sibling
   derivative without editing this checkpoint or package.

Previous `889a642` observation evidence is not a fresh replay of this package
and is not inherited automatically. No package was launched in this slice. No
observation input or derivative was fabricated. No tag, signing, publication,
upload, distribution, PR, main integration, dependency update, package-version
change, or release approval was performed.
