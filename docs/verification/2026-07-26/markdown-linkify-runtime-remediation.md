# Markdown linkification runtime remediation

## Decision scope

This branch updates the runtime Markdown dependency chain from
`markdown-it 14.1.0` / `linkify-it 5.0.0` to
`markdown-it 14.3.0` / `linkify-it 5.0.2`. The change addresses the two
runtime-reachable linkification denial-of-service findings that blocked the
candidate built from `4f21a4237de993a87a5bb7e7297f18f9f146fc15`.

The relevant upstream advisories are:

- [GHSA-22p9-wv53-3rq4](https://github.com/advisories/GHSA-22p9-wv53-3rq4),
  fixed in `linkify-it 5.0.1`.
- [GHSA-v245-v573-v5vm](https://github.com/advisories/GHSA-v245-v573-v5vm),
  fixed in `linkify-it 5.0.2`.

The secure floor for this repository is therefore `linkify-it 5.0.2`.

## Tracked runtime change

| Item | Before | Remediation branch |
| --- | --- | --- |
| Direct `markdown-it` requirement | `^14.1.0` | `^14.3.0` |
| Production `markdown-it` resolution | `14.1.0` | `14.3.0` |
| Production `linkify-it` resolution | `5.0.0` | `5.0.2` |
| Tracked browser bundle banner | `markdown-it 14.1.0` | `markdown-it 14.3.0` |
| Tracked browser bundle SHA-256 | `38c70a1e7ca91ab40e2d9e6e60129851a717ed1c7d4acbbdd41bf9503791cf68` | `70fe17bd06c7fa819f03a1ed10957904318103624198845dc893b309bf495e28` |

The new tracked bundle is byte-identical to
`node_modules/markdown-it/dist/markdown-it.min.js`. A second
`node scripts/copy-vendor.js` run left its hash unchanged.

`markdownlint-cli` retains its own development-only `markdown-it 14.1.0`
installation after npm's lockfile reconciliation. That nested tool copy uses
the patched top-level `linkify-it 5.0.2`; it is not part of the production
Markdown runtime.

## Runtime and compatibility verification

`test/markdown-linkify-security.test.js` loads both the Node package and the
tracked browser bundle. The browser bundle runs in an isolated VM. Every
pathological input runs in a separate child process and is terminated if it
exceeds a 4,000 ms hard timeout.

| Probe | Input | Size | Node package | Tracked vendor |
| --- | --- | ---: | ---: | ---: |
| Fuzzy email | `a@b.com` plus newline, repeated 16,000 times | 128,000 bytes | 8.363 ms | 6.098 ms |
| Contiguous scheme | `mailto:` repeated 64,000 times | 448,000 bytes | 41.302 ms | 61.903 ms |

These are local completion measurements, not performance targets. The hard
timeout is the regression boundary. Runtime identity assertions require
`markdown-it 14.3.0` and `linkify-it 5.0.2` for every probe.

The same test also verifies `linkify: true` behavior for ordinary URLs and
email addresses, plus headings, emphasis, and configured line breaks. Node and
tracked-vendor HTML matched byte for byte. Existing focused browser tests cover
the Rich editor conversion, StoryWiki path, and preview/Reader Markdown path.

Inspection found four production constructors with `linkify: true`:

- Rich editor conversion in `js/editor-wysiwyg.js`.
- Editor/Reader body conversion in `js/zw-markdown-it-body.js`, including its
  shared fallback renderer.
- StoryWiki conversion in `js/story-wiki.js`.

## Audit reconciliation

The accepted baseline contained 25 npm audit package findings in the full
tree and three in the production tree. The production findings were
`linkify-it`, `markdown-it`, and `lodash`.

After the update:

- `npm audit --json` reports 24 package findings:
  three moderate, 20 high, and one critical.
- `npm audit --omit=dev --json` reports one production package finding:
  the previously bounded `lodash 4.17.23` aggregate.
- Neither audit output contains `GHSA-22p9-wv53-3rq4` or
  `GHSA-v245-v573-v5vm`.
- Production `markdown-it` and `linkify-it` no longer appear as audit
  findings.

The remaining production `lodash` result is unchanged from the accepted
baseline. It is present through `kuromoji` and build-tool paths, while prior
package inspection found no import or call of the affected `template`,
`unset`, or `omit` APIs. Revisit that classification if packaged Node
integration, a lodash import, or kuromoji packaging changes.

The full-tree critical/high findings remain bounded development and build-tool
maintenance debt. The nested development-only `markdown-it 14.1.0` finding is
also separate from this production remediation. Updating Electron,
electron-builder, markdownlint, or their transitive dependencies requires an
independent compatibility slice.

## Package evidence boundary

At the time this tracked note was committed, the clean-branch checkpoint and
final package had not yet been generated. Package inclusion, packaged-vendor
probes, executable and `app.asar` hashes, and the final remediation decision
belong to the ignored post-CI evidence set generated from the committed branch
SHA.

This verification does not record a package launch or human observation. It
does not approve integration to `main`, signing, tagging, publication,
distribution, controlled beta, or external release.
