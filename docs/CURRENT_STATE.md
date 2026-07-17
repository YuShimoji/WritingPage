# Current State

<!-- CURRENT_STATE_LIVE_START -->

更新: 2026-07-17 / cross-terminal handoff after dev-ready supervisor report

## いまいる場所

| 観点 | 現在地 |
|---|---|
| Git / remote | 2026-07-17 handoff開始HEADは `d910f9c docs: refresh dev-ready supervisor report`。`origin` は `https://github.com/YuShimoji/WritingPage.git` に設定済み。`git fetch --prune origin` 後も `HEAD...origin/main = 0 0`、`git pull --ff-only origin main` は `Already up to date`、開始時worktreeはclean。 |
| 開発環境 | 2026-07-17に Codex bundled Node `v24.14.0` / Corepack npm `11.6.2` routeと `npm ls --depth=0` を再readbackしてpass。project contract は Node `>=22.12.0 <25` / npm `>=11 <12`。system default の Node `v22.19.0` / npm `10.9.3` はproject commandに使わない。 |
| G3 command | `npm run release:checkpoint` が ignored の `output/release-readiness/checkpoint-*` に `checkpoint.json`、`RELEASE_READINESS.md`、`ELECTRON_OPERATOR_REVIEW.md`、commit紐付きUI captureを生成し、Electron directory packageをbuild/hashする。 |
| Web evidence | 2026-07-15にclean `a939577` でfresh checkpointを実行済み。smoke、unit 21/21、JS lint、dist build、capture 7枚＋readback、Electron directory buildがpass。今回product code変更はなく、full Playwright / SP-071 / checkpoint全体は再実行しない。run `29198025986` / commit `cf4b432` の 594 passed / 4 skipped はobserved remote evidenceとして分離維持する。 |
| Capture / package | この端末では `checkpoint-2026-07-15T04-55-55-427Z`、operator sheet、packageが残存し、2026-07-17の独立hash readbackも SHA-256 `6253997b504407f4148f7396812409a628381664027c52d9c04796204b494779` と一致。`output/` / `build/` はignoredで別端末へ移らず、Electron behavior observedとも扱わない。 |
| 現在の判断 | clean HEADで Web / capture / package がpassしても、Electron人手観察は `pending` のため `HOLD_FOR_ELECTRON_OBSERVATION`。H0はcheckpoint生成まで、H1はuser-owned package観察。 |
| 今回の変更境界 | maintenance / cross-terminal handoffのみ。remote/parity、runtime/dependency、local-only evidenceをreadbackし、canonical handoffを更新する。UI、runtime code、storage/autosave/document model、Reader/export、package内容、依存契約、signing/publicationは変更しない。 |

## 現行の開発契約

- `checkpoint.json` のstable statusは `pass / fail / pending / stale / blocked / not_run`、overallは `HOLD_FOR_ELECTRON_OBSERVATION / READY_FOR_INTERNAL_RELEASE_REVIEW / BLOCKED`。
- dirty sourceは、他の機械gateがpassでも `BLOCKED`。final evidenceはclean committed HEADから生成する。
- captureとpackageはsource commit / dirty stateへ結び付ける。exe存在、build成功、screenshot存在をElectron観察の代用にしない。
- 日本語Markdownはoperator判断面、JSONはstable English schema。いずれにも原稿本文を入れない。
- G1 remote acceptanceはrepository verification anchorをobserved evidenceとして再利用し、今回実行したローカル検証と混ぜない。

## 次に推奨する作業

| 方向 | 目的 | 効果 | 次の動き |
|---|---|---|---|
| Verify | H1 Electron package観察を行う | Web自動化では見えない起動・保存・再起動復帰をexact hashのpackageで閉じられる | userが `ELECTRON_OPERATOR_REVIEW.md` に observer/time/result/findingsを記録し、次のassistantがgateへ取り込む |
| Advance | internal release reviewへ進む | 全必須gateが揃った後、検索せずgo/hold判断できる | Electron gateがpassになった時だけ `READY_FOR_INTERNAL_RELEASE_REVIEW` を再生成する |
| Review | Documents tactile debtを独立確認する | release evidenceと好みの評価を混同せず、日常執筆の違和感を閉じられる | userが実使用サイズでempty hint、`現在` marker、focus returnを自由文reviewする |
| Audit | `npm ci` のdeprecated dependency warningを別スライスで棚卸しする | 現在のdev-ready判定を依存更新判断と混ぜず、更新範囲と回帰コストを先に見積もれる | H1を妨げないread-only auditから始め、依存変更が必要ならred-band gateで別途決める |

## 別端末への handoff

1. `git pull --ff-only origin main` の後、2026-07-17 cross-terminal handoffを含むlatest mainを取得し、`git rev-list --left-right --count "HEAD...origin/main"` が `0 0` であることを確認する。
2. この live block、`docs/INVARIANTS.md`、`docs/INTERACTION_NOTES.md` を読む。workflow / decision / handoff を扱う時だけ `docs/ai/*.md` と `docs/OPERATOR_WORKFLOW.md` を追加する。
3. G1 は `cf4b432` / run `29198025986` で閉鎖済み。full PlaywrightやSP-071を新しいfailureなしで再実行しない。
4. Node 24.x / npm 11.6.2 routeを使う。`node_modules` がなければ `npm ci`、続けて `npm ls --depth=0` と `npm run test:smoke` で開発入口を確認する。system default npm 10.xでproject commandを進めない。
5. H1を別端末で行う場合はignoredの `output/` / `build/` が移らないため、clean latest HEADから `npm run release:checkpoint` を再生成し、その端末の `ELECTRON_OPERATOR_REVIEW.md` と同じSHA-256のpackageを `npm run app:open:package` で人間が観察する。未観察をWeb証拠で完了扱いにしない。
6. `.serena/project.yml` に端末ローカル設定差分が現れた場合は、product / handoff commit に含めない。
7. 今回のremote readback・保持した文脈・再開順序は `docs/verification/2026-07-17/cross-terminal-handoff-after-dev-ready-supervisor-report.md`。7月15日の環境・証拠詳細は `docs/verification/2026-07-15/latest-main-dev-ready-supervisor-report.md`、G3実装の正本は `docs/verification/2026-07-13/g3-release-readiness-checkpoint.md`。timestamped outputはignored local evidenceのままdocsへ複製しない。

<!-- CURRENT_STATE_LIVE_END -->

## Historical Snapshot Log (reference only)

### 2026-07-08 Operator tactile review launch prep

- User request: pull the latest remote state into this terminal, prepare the workspace for development, continue from the attached supervisor prompt, and explain the user-side review. The prompt's old host path was translated to this terminal as `C:\Users\PLANNER007\WritingPage`.
- Supervisor prompt classification: `pass / OPERATOR_FIRST`. The accepted implementation remains Documents Selection-to-Writing Focus Return + Marker Width Evidence; the next gate is human tactile review in a real app window, not another autonomous polish slice.
- Sync state: `git fetch --prune origin` completed; `git pull --ff-only origin main` reported `Already up to date`; `git rev-list --left-right --count HEAD...origin/main` reported `0 0`; latest accepted commit before this local launcher-prep fix was `54bf4f4 docs: hand off dev-ready sync`.
- Development readiness in this terminal: `package-lock.json` and `node_modules` were present; `node --version` was `v22.19.0`; `npm --version` was `10.9.3`; `npm ls --depth=0`, `npm run test:smoke`, `npm run test:unit`, `npm run lint:js:check`, and `npm run build` exited 0. Unit-test stderr included intentional invalid-JSON / forced-storage-failure logs from negative-path tests while the TAP result was `14 passed`.
- Launcher fix: `npm run app:update:open` initially stopped with `spawnSync npm ENOENT` while `scripts/update-build-open.js` used `spawnSync('npm', ..., shell: false)` on Windows. The script now uses `shell: true` only for Windows `npm` subprocesses so the prompt launcher can run on this host.
- Launcher-prep verification before commit: `node --check scripts/update-build-open.js`, `npm run app:update:dry-run`, `npm run lint:js:check`, `git diff --check`, and `npm run test:smoke` exited 0.
- User-side gate remains open: launch the app with `npm run app:update:open` and review three tactile points: empty Rich editing hint, Documents `現在` marker density, and whether Documents tree selection returning focus to the editor feels natural or too forceful.
- Verification anchor: `docs/verification/2026-07-08/operator-tactile-review-launch-prep.md`.

### 2026-07-07 Cross-terminal handoff after dev-ready sync

- User request: preserve the full working context in project-local docs, reflect local tracked state to the remote, and leave the project immediately restartable from another terminal.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI behavior, storage schema, autosave semantics, document model, import/export format, cloud/account/public sharing, Electron packaging, First Writing Comfort hint, Design Cockpit behavior, text expression preset semantics, or Reader rendering changed in this pass.
- Sync state before this handoff docs update: `git status --short --branch` reported clean `main...origin/main`; `git fetch --prune origin` and `git pull --ff-only origin main` had just reported `Already up to date`; `git rev-list --left-right --count HEAD...origin/main` reported `0 0`.
- Latest accepted tracked context before this handoff docs update was `4af6c94 docs: hand off documents focus context`.
- Development readiness checked in this terminal: `package-lock.json` and `node_modules` were present; `node --version` was `v22.19.0`; `npm --version` was `10.9.3`; `npm ls --depth=0`, `npm run test:smoke`, `npm run test:unit`, `npm run lint:js:check`, and `npm run build` all exited 0. Unit-test stderr included intentional invalid-JSON / forced-storage-failure logs from negative-path tests, while the TAP result was `14 passed`.
- Handoff-doc verification after this docs update: `git diff --check` exited 0 and `npm run test:smoke` passed with `ALL TESTS PASSED`.
- Active accepted slice remains Documents Selection-to-Writing Focus Return + Marker Width Evidence. Durable anchors are `docs/verification/2026-07-07/documents-selection-focus-return.md`, `e2e/daily-document-lifecycle.spec.js`, and `docs/PROJECT_COCKPIT.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm tracked parity with `git rev-list --left-right --count "HEAD...origin/main" = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` -> `docs/PROJECT_COCKPIT.md`.
- Verification anchor: `docs/verification/2026-07-07/cross-terminal-handoff-after-dev-ready-sync.md`.
- Expected next move after restart: choose a new implementation or audit slice from `docs/PROJECT_COCKPIT.md`; no assistant-owned product change is open from this maintenance pass.

### 2026-07-07 Cross-terminal handoff after Documents focus return

- User request: keep all current context in project-local docs, reflect local tracked state to remote, and leave the project restartable from another terminal.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI behavior, storage schema, autosave semantics, document model, import/export format, cloud/account/public sharing, Electron packaging, First Writing Comfort hint, Design Cockpit behavior, text expression preset semantics, or Reader rendering changed in this pass.
- Sync state before this handoff docs update: `git status --short --branch` reported `main...origin/main` with only `.serena/project.yml` dirty; `git fetch --prune origin` completed; `git pull --ff-only origin main` reported `Already up to date`; `HEAD...origin/main = 0 0`.
- Latest accepted tracked context before this handoff docs update was `944cf59 feat: return focus after document selection`.
- Active accepted slice remains Documents Selection-to-Writing Focus Return + Marker Width Evidence. Durable anchors are `docs/verification/2026-07-07/documents-selection-focus-return.md`, `e2e/daily-document-lifecycle.spec.js`, and `docs/PROJECT_COCKPIT.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm tracked parity with `git rev-list --left-right --count "HEAD...origin/main" = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` -> `docs/PROJECT_COCKPIT.md`.
- Verification anchor: `docs/verification/2026-07-07/cross-terminal-handoff-after-documents-focus-return.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this handoff.

### 2026-07-07 Documents selection focus return checkpoint

- Active slice: Documents Selection-to-Writing Focus Return + Marker Width Evidence from the attached next-worker prompt.
- Product-facing change: ordinary Documents tree document selection now returns focus to the visible editor surface on the next frame, so the daily path becomes select manuscript shelf item -> resume writing without an extra editor click.
- Scope boundary: the focus return is only wired through `onSelectDocument` ordinary document row selection. JSON import, create document, multi-select Ctrl/Shift selection, context menu, storage schema, autosave semantics, document model, import/export format, cloud/account/public sharing, Electron packaging, First Writing Comfort hint, Design Cockpit behavior, text expression preset semantics, and Reader rendering are unchanged.
- Focused proof: `e2e/daily-document-lifecycle.spec.js` now also asserts `#wysiwyg-editor` focus after switching back through the Documents tree and verifies the `現在` marker at normal width and a 240px constrained sidebar readback without marker/label overlap or row overflow.
- Verification replay passed node syntax checks for the edited JS/test files, the focused daily document lifecycle E2E, First Writing Comfort E2E, UI capture, full showcase capture, Design Cockpit E2E, smoke, JS lint, and build. `reader-wysiwyg-distinction` was not rerun because the editor rendering path did not change.
- Latest local ignored evidence from this slice is `output/playwright/manual-verification-2026-07-06T17-22-39-216Z` and `output/showcase/full-2026-07-06T17-22-52`.
- Verification anchor: `docs/verification/2026-07-07/documents-selection-focus-return.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-07 Daily Document Lifecycle Comfort checkpoint

- Active slice: Daily Document Lifecycle Comfort / Documents Save-Export Path from the attached next-worker prompt.
- Product-facing change: Documents tree の current document row now carries `aria-current="page"` and a short `現在` marker, so the active manuscript shelf item is readable as the current document rather than only inferred from background color.
- Focused proof: `e2e/daily-document-lifecycle.spec.js` covers fresh/reset launch, opening Documents through the current structure sidebar route, current document identity, Japanese writing in document 1, creating document 2 from `+ 文書`, writing different Japanese text in document 2, switching back to document 1, reload recovery, and locating `TXT書き出し` / `JSON書き出し` / `JSON読み込み` as the external retreat route.
- Implementation boundary: no storage schema, autosave semantics, document model, import/export format, cloud/account/public sharing, Electron packaging, First Writing Comfort hint, Design Cockpit behavior, text expression preset semantics, or Reader rendering changed.
- Verification replay passed node syntax checks for the edited JS/test files, the focused daily document lifecycle E2E, First Writing Comfort E2E, UI capture, full showcase capture, Design Cockpit E2E, smoke, JS lint, and build. `reader-wysiwyg-distinction` was not rerun because the editor rendering path did not change.
- Latest local ignored evidence from this slice is `output/playwright/manual-verification-2026-07-06T16-12-19-646Z` and `output/showcase/full-2026-07-06T16-12-38`.
- Verification anchor: `docs/verification/2026-07-07/daily-document-lifecycle-comfort.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 First Writing Comfort checkpoint

- Active slice: First Writing Comfort / Launch-to-Writing UX checkpoint from the attached next-worker prompt.
- Product-facing change: empty Rich editing now shows a short non-persistent hint, `ここから書き始められます。本文はこの端末に自動保存されます。`, so a fresh or reset launch makes the writing surface and local autosave premise visible before source/docs inspection.
- Implementation boundary: the hint is driven by `#wysiwyg-editor[data-empty]` and CSS pseudo-content. It is not manuscript content and does not change storage schema, autosave semantics, document model, import/export behavior, cloud/account/public sharing, Electron packaging, Design Cockpit behavior, textbox preset semantics, or Reader rendering.
- Focused proof: `e2e/first-writing-comfort.spec.js` covers fresh/reset launch, empty Rich editing hint, Japanese typing, writing status chip transition, command-palette manual save, reload/resume, Design Cockpit privacy summary, and `書き始める` focus return.
- Verification replay passed the focused first-writing E2E, UI capture, full showcase capture, Design Cockpit E2E, Reader/WYSIWYG distinction E2E, smoke, JS lint, build, and `git diff --check`.
- Latest local ignored evidence from this slice is `output/playwright/manual-verification-2026-07-06T13-25-36-581Z` and `output/showcase/full-2026-07-06T13-25-52`.
- Verification anchor: `docs/verification/2026-07-06/first-writing-comfort-checkpoint.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 Cross-terminal handoff after catalog field completion

- User request: keep all current context in project-local docs, reflect local tracked state to remote, and leave the project restartable from another terminal.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI behavior, storage schema, autosave semantics, cloud/account/public sharing, document model, Design Cockpit behavior, package config, or generated showcase artifacts changed in this pass.
- Sync state before this handoff docs update: `git status --short --branch` reported clean `main...origin/main`; `git rev-list --left-right --count HEAD...origin/main` reported `0 0`; `git fetch --prune origin` completed; `git pull --ff-only origin main` reported `Already up to date`.
- Latest accepted tracked context before this handoff docs update was `fbc1949 docs: complete text expression preset catalog fields`.
- Active accepted slice remains `Text expression preset governance`: built-in `monologue` is the upright standard inner-description preset, explicit `tilted-monologue` carries the opt-in slanted behavior, and Reader / Editor parity still uses the shared textbox DSL projection path.
- Durable anchors for the next terminal: `docs/TEXT_EXPRESSION_PRESETS.md`, `docs/PROJECT_COCKPIT.md`, `docs/verification/2026-07-06/text-expression-preset-governance.md`, and this handoff note.
- Latest local ignored evidence from the accepted slice remains `output/showcase/full-2026-07-06T02-30-01` and `output/playwright/manual-verification-2026-07-06T02-30-21-860Z`; rerun captures if those artifacts are unavailable in another session.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm tracked parity with `git rev-list --left-right --count HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` -> `docs/PROJECT_COCKPIT.md`.
- Restartability check for this handoff: `npm run test:smoke` passed with `ALL TESTS PASSED`.
- Verification anchor: `docs/verification/2026-07-06/cross-terminal-handoff-after-catalog-field-completion.md`.

### 2026-07-06 Text expression preset catalog field completion

- Followed up the accepted Text expression preset governance slice after the next-worker prompt was replayed in a fresh terminal.
- Product/runtime behavior remains unchanged: built-in `monologue` stays upright, `tilted-monologue` remains the opt-in slanted preset, and Reader / Editor parity still uses the shared textbox DSL projection path.
- Docs-facing change: `docs/TEXT_EXPRESSION_PRESETS.md` now records surface, status, and risk-note fields for textbox presets, inline decorations, animations, ornaments, and the exceptional `zw-typing` / `zw-dialog` / `zw-scroll` / `zw-pathtext` / ruby / kenten displays.
- Project cockpit now names that catalog as the review surface for default tilt, animation, and exceptional display classification before new preset work.
- Follow-up verification replay passed the focused Reader/WYSIWYG parity E2E, full showcase capture, UI capture, Design Cockpit E2E, smoke, JS lint, build, and `git diff --check`.
- Latest local evidence from this follow-up is `output/showcase/full-2026-07-06T02-30-01` and `output/playwright/manual-verification-2026-07-06T02-30-21-860Z`.
- Verification anchor remains `docs/verification/2026-07-06/text-expression-preset-governance.md`, now with the catalog field-completion note and replayed evidence paths.

### 2026-07-06 Cross-terminal handoff after text expression preset governance

- User request: keep the current project context in repo-local docs, reflect local tracked state to remote, and leave the project restartable from another terminal.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI behavior, storage schema, autosave semantics, cloud/account/public sharing, document model, Design Cockpit behavior, package config, or generated showcase artifacts changed in this pass.
- Sync state before this handoff docs update: `git status --short --branch` reported `main...origin/main` with only `.serena/project.yml` dirty; `git fetch --prune origin` completed; `HEAD...origin/main = 0 0`; latest accepted commit was `ad04ee9 fix: govern text expression presets`.
- Active accepted slice remains `Text expression preset governance`: built-in `monologue` is the upright standard inner-description preset, explicit `tilted-monologue` carries the opt-in slanted behavior, and Reader / Editor parity still uses the shared textbox DSL projection path.
- Durable anchors for the next terminal: `docs/TEXT_EXPRESSION_PRESETS.md`, `docs/verification/2026-07-06/text-expression-preset-governance.md`, and this handoff note. Local ignored visual evidence from the accepted slice is `output/showcase/full-2026-07-05T20-43-23` and `output/playwright/manual-verification-2026-07-05T20-46-28-951Z`; rerun captures if those ignored artifacts are unavailable on the other machine/session.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm tracked parity with `git rev-list --left-right --count "HEAD...origin/main" = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` -> `docs/PROJECT_COCKPIT.md`.
- Verification anchor: `docs/verification/2026-07-06/cross-terminal-handoff-after-text-expression-preset-governance.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this handoff.

### 2026-07-06 Text expression preset governance

- Active slice: created a review-facing catalog for special text displays and reclassified default inner-description tilt semantics.
- Product-facing change: built-in `monologue` is now the upright standard inner-description preset (`rotate(0deg)`, italic, fade-in, soft ornament, `scale(0.98)`); the slanted version is explicit opt-in `tilted-monologue` (`rotate(-2deg)`).
- Legacy boundary: `inner-voice` remains valid legacy/strong inner voice behavior (`rotate(-4deg)`), but it is not the canonical current monologue sample.
- Reader / Editor parity classification: no Reader-only rendering fork was added. Editor, Markdown preview, and Reader still share the same textbox DSL projection path; the remaining issue was preset governance and review evidence, not a Reader-only bug.
- Review catalog: `docs/TEXT_EXPRESSION_PRESETS.md` now lists textbox presets, inline effects, animations, ornaments, status, transform defaults, and review notes.
- Latest local showcase artifact: `output/showcase/full-2026-07-05T20-43-23` with `manifest.json`, `readback.json`, and 19 PNG screenshots. `16-editor-normal.png` and `19-reader-preview.png` show `dialogue`, `monologue`, and `tilted-monologue` in-frame; readback reports `dialogue=rotate(0deg)`, `monologue=rotate(0deg)`, and `tiltedMonologue=rotate(-2deg)` on both surfaces.
- 14 / 15 / 16 evidence quality: `14-focus-compat.png` remains focus compatibility with a state label, `15-normal-shell.png` exposes normal shell + structure sidebar open, and `16-editor-normal.png` centers the preset/strike fixture rather than another near-identical clean canvas.
- Verification anchor: `docs/verification/2026-07-06/text-expression-preset-governance.md`.
- Product behavior boundary: no storage schema, autosave semantics, cloud/account/public sharing, Design Cockpit behavior, document model, or Reader-only renderer fork changed.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 Reader preview preset parity audit

- Superseded classification: the parity finding remains valid, but the later Text expression preset governance slice moved default `monologue` tilt into explicit `tilted-monologue`.
- Active slice: audited and tightened Reader preview vs Editor rendering parity for strikethrough and `dialogue` / `monologue` textbox presets, while improving full-showcase evidence for `14` / `15` / `16` / `19`.
- Product-facing fix: WYSIWYG serialization now preserves native `<s>` / `<del>` / `<strike>` as Markdown strike and maps `.decor-strikethrough` back to `[strike]`, so Reader preview no longer loses strike semantics after opening from WYSIWYG.
- Intentional-difference classification: `monologue` / inner-description tilt is current preset semantics (`rotate(-2deg)`, italic, fade-in, soft ornament), not a Reader-only bug. Editor and Reader are now verified to show the same meaning.
- Full showcase route now seeds one Markdown fixture through the product renderer, records strike/preset readbacks without manuscript body text, labels `14` focus compatibility, shows `15` normal shell with structure sidebar open, and uses `16` / `19` as Editor/Reader parity evidence.
- Latest local showcase artifact: `output/showcase/full-2026-07-05T18-56-08` with `manifest.json`, `readback.json`, and 19 PNG screenshots. These generated artifacts remain local verification output and are not committed.
- Verification anchor: `docs/verification/2026-07-06/reader-preview-preset-parity-audit.md`.
- Product behavior boundary: no storage schema, autosave semantics, cloud/account/public sharing, Design Cockpit behavior, or broad UI redesign changed.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 Full showcase capture route alignment

- Active slice: aligned `scripts/capture-full-showcase.js` with the current left nav / advanced settings / Design Cockpit architecture.
- Product behavior boundary: no visual redesign, storage schema change, autosave change, Design Cockpit behavior change, or Electron packaging change.
- Full showcase route now uses `sidebarManager.activateSidebarGroup(...)` instead of brittle sidebar clicks, captures current settings entry as advanced sidebar (`legacySettingsModalVisible=false`), includes Design Cockpit with privacy-marker readback, removes the obsolete blank-mode capture, and opens mobile sidebar through the current left-nav category route.
- Latest local showcase artifact: `output/showcase/full-2026-07-05T18-27-48` with `manifest.json`, `readback.json`, and 19 PNG screenshots. These generated artifacts remain local verification output and are not committed.
- Verification anchor: `docs/verification/2026-07-06/full-showcase-capture-alignment.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 UI capture verification recovery

- Active slice: recovered `npm run test:ui:capture` so it follows the current left nav / advanced settings / Design Cockpit surfaces instead of waiting for obsolete `#settings-modal` visibility.
- Product behavior boundary: no visual redesign, storage schema change, autosave change, Design Cockpit behavior change, or Electron packaging change.
- Capture route now verifies launch/readback state, current advanced settings sidebar (`leftNavActive=advanced`, `legacySettingsModalVisible=false`), Design Cockpit privacy marker/readback, help modal, edit sidebar, command palette, and mobile sidebar via current APIs.
- Latest local capture artifact: `output/playwright/manual-verification-2026-07-05T18-07-23-020Z` with `manifest.json`, `readback.json`, and seven PNG screenshots. These generated artifacts remain local verification output and are not committed.
- Verification anchor: `docs/verification/2026-07-06/capture-verification-recovery.md`.
- `.serena/project.yml` remains pre-existing local dirt and is not part of this slice.

### 2026-07-06 Design Cockpit writing trust dashboard

- Active slice: app-local / non-public Design Cockpit dashboard plus a minimal writing UX trust checkpoint.
- Product-facing change: `Design Cockpit` is reachable from command palette and from `?designCockpit=1`, showing save state, character count, document identity, editor surface, autosave/manual-save routes, theme, shell state, typography density, sidebar state, and a copyable review summary.
- Save trust boundary: dashboard `保存` calls existing `ZenWriterEditor.saveContent()` only. Autosave, writing status chip semantics, storage schema, Documents, import/export, cloud/account/public sharing, and Electron packaging were not changed.
- Manuscript privacy boundary: the dashboard and copied summary do not include editor body text; the summary records `manuscript_content=copied_never`.
- Review path: use `F2` -> `Design Cockpit`, or open `http://127.0.0.1:9080/index.html?designCockpit=1` during local Web review. `書き始める` closes the dashboard and returns focus to the active editor surface.
- Project cockpit anchor: `docs/PROJECT_COCKPIT.md`.
- Verification anchor: `docs/verification/2026-07-06/design-cockpit-writing-trust.md`.
- Closed lanes remain closed unless new evidence appears: fresh-launch observation remains a user-side visual gate; do not reopen IME underline, heading shortcut, launcher, effect settings, Markdown source gate, WP-005, Project import recovery, or rich text block alignment from this dashboard work alone.

### 2026-06-30 Cross-terminal handoff after fresh launch gate

- User requested that all current context be kept in the project, local state be reflected to remote, and another terminal be able to resume immediately.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI copy, launcher script, package config, roadmap status, or fresh-launch observation result changed in this pass.
- Sync state at start: clean `main`, `git fetch --prune origin`, `git pull --ff-only origin main` -> `Already up to date`, and `HEAD...origin/main = 0 0`. Latest incoming context was `2284944 docs: record fresh launch observation gate`.
- Restartability check: `npm run test:smoke` passed with `ALL TESTS PASSED`.
- Active slice remains `fresh-launch-observation-gate`: agent implementation and artifact freshness were accepted; the only remaining gate is user-side fresh launch visual observation. No user observation result has been recorded in this handoff pass.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`. Use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when selecting a new product slice.
- If the next terminal needs to inspect the current UI rather than only resume docs, use `npm run app:update:open` for Web confirmation. Electron packaged confirmation remains separate: run `npm run electron:build` if needed, then open `build\win-unpacked\Zen Writer.exe`.
- Verification anchor: `docs/verification/2026-06-30/cross-terminal-handoff-after-fresh-launch-gate.md`.

### 2026-06-29 Fresh launch observation gate

- Synced `main` from `origin/main`; `git fetch --prune origin` and `git pull --ff-only origin main` reported `Already up to date`, and `HEAD...origin/main = 0 0` before this docs update.
- Supervisor review for `runtime-freshness-and-heading-shortcut-repro` accepted the stale artifact diagnosis. The implementation does not need additional source changes: `42299f9` remains the product fix anchor, while `dee4221` was only the later cross-terminal handoff commit.
- Agent-side freshness was rechecked in this terminal: `npm run app:update:dry-run` passed as a no-mutation route check, `npm run build` refreshed `dist/`, and `npm run electron:build` refreshed `build/win-unpacked`. Fresh `dist/js/editor-wysiwyg.js` contains both the spellcheck guard and root `replaceChildren` first-line shortcut path.
- Automated proof still passes: focused WYSIWYG shortcut/spellcheck Playwright coverage is 7 passed, and direct `dist/index.html` readback for first-line `#` + Space produced `<h1><br></h1>`, one H1, `spellcheck="false"`, and H1 border `1px solid rgb(0, 0, 0)`.
- Completion state: agent implementation / artifact freshness is acceptable. The remaining gate is only user-side fresh launch visual observation: close stale Zen Writer browser/Electron windows, use `Zen Writer Update and Launch` for Web confirmation, and use refreshed `build\win-unpacked\Zen Writer.exe` only if Electron packaged confirmation is needed.
- Verification anchor: `docs/verification/2026-06-29/fresh-launch-observation-gate.md`.
- Do not reopen IME underline, heading shortcut, launcher, effect settings, Markdown source gate, WP-005, Project import recovery, or rich text block alignment unless the fresh-launch observation reports new evidence.

### 2026-06-29 Cross-terminal handoff and remote parity

- User requested that all current context be kept in the project and the local state be reflected to remote so another terminal can resume immediately.
- Scope: maintenance / handoff only. No product source, runtime behavior, UI copy, tests, launcher behavior, package config, or roadmap status was changed in this pass.
- Sync state before this handoff entry: `git fetch --prune origin` and `git pull --ff-only origin main` reported `Already up to date`; `HEAD...origin/main = 0 0`; latest project context was `2e68c0e docs: record heading shortcut runtime freshness`.
- Active trust state: the latest product slice remains the 2026-06-28 runtime freshness / first-line heading shortcut repro. Source already contained the fix, stale `dist/` and `build/win-unpacked` were refreshed locally in that pass, and the direct `dist/index.html` readback produced one H1 with `spellcheck="false"`. Do not treat the black H1 border as a native underline regression without new evidence.
- Remote handoff artifact: `docs/verification/2026-06-29/cross-terminal-handoff-remote-parity.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`. Use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing a next product slice.
- If the next terminal needs to run the app instead of only inspect docs, use `npm run app:update:open` for the normal clean-worktree update/build/open route. Generated `dist/` and `build/win-unpacked` remain local ignored artifacts, so remote parity is source/docs parity, not transfer of ignored build output.

### 2026-06-28 Runtime freshness and heading shortcut repro

- Reopened the heading shortcut first-line report after user observation said Web and Electron still reproduced the issue after `42299f9`. The prior source fix was not treated as accepted during this pass.
- Finding: source `js/editor-wysiwyg.js` was current, but `dist/js/editor-wysiwyg.js` was stale relative to `42299f9`; it contained the spellcheck fix but not the root `replaceChildren` first-line shortcut path. `build/win-unpacked` was also refreshed in this pass.
- Action: rebuilt `dist/` with `npm run build` and refreshed the Electron dir package with `npm run electron:build`. Extracted package asar content now contains the first-line shortcut fix and spellcheck guard.
- Real-path readback: direct `dist/index.html` startup began with an empty Rich editing root; typing `#` + Space produced `<h1><br></h1>`, one H1, `spellcheck="false"`, and the expected H1 `1px solid rgb(0, 0, 0)` border. The horizontal line is therefore app-owned H1 styling, not a failed conversion or native IME/spellcheck residual.
- Focused WYSIWYG shortcut/spellcheck Playwright coverage was rerun after the artifact refresh: 7 tests passed.
- Verification anchor: `docs/verification/2026-06-28/runtime-freshness-and-heading-shortcut-repro.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-28 Heading shortcut first-line boundary fix

- Followed up the Rich editing typed heading shortcut after user observation separated the now-fixed Electron IME underline residual from a first-line `#` + Space shortcut gap.
- Product-facing change: typed heading shortcut detection now accepts a direct root text node in the freshly opened empty Rich editing surface, so first-line `#` + Space converts to an empty H1 just like the paragraph/div-backed later-line path. Existing `P` / `DIV` block handling remains unchanged.
- Visual classification: the black horizontal line after successful `#` + Space conversion is app-owned H1 CSS (`#wysiwyg-editor h1` border-bottom via `--heading-h1-border-bottom`), not native IME or spellcheck underline.
- Focused proof in `e2e/wysiwyg-editor.spec.js` adds the initial empty first-line scenario while preserving existing heading shortcut positive/negative, IME composition guard, native spellcheck-off, and Undo coverage.
- Verification anchor: `docs/verification/2026-06-28/heading-shortcut-first-line-boundary.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-28 Electron IME underline persistence fix

- Followed up the Rich editing IME repaint slice after the browser path was covered but Electron could still leave a thin native underline after Japanese IME confirmation.
- Product-facing change: `#wysiwyg-editor` now has native spellcheck disabled at the HTML surface and in `RichTextEditor.init()`, and `compositionend` re-applies that guard before the existing paint-only repaint tick. This targets the Electron contenteditable native decoration cache without rewriting editor HTML, Markdown, selection, storage, Undo state, typed heading shortcut behavior, or rich text decoration persistence.
- Focused proof in `e2e/wysiwyg-editor.spec.js` keeps the prior synthetic IME repaint test and adds a Rich editing native spellcheck-off assertion for the contenteditable surface.
- Verification anchor: `docs/verification/2026-06-28/electron-ime-underline-persistence-fix.md`.
- Native OS IME painting remains a manual Electron visual remainder if final packaged confirmation is needed; BrowserWindow/package settings and the textarea spell checker were not changed.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-28 IME underline repaint fix

- Returned to Rich editing input UX after a user-observed Japanese IME visual artifact: after IME confirmation, a thin composition underline could remain until another app repaint such as click/sidebar refresh.
- Product-facing change: `compositionend` now schedules a paint-only repaint tick on `#wysiwyg-editor` through a temporary `data-ime-repaint` attribute. This is intentionally non-data: it does not rewrite editor HTML, Markdown, selection, storage, Undo state, typed heading shortcut behavior, or rich text decoration persistence.
- Focused proof in `e2e/wysiwyg-editor.spec.js` covers synthetic IME composition end, verifies the repaint hook runs, and asserts content/selection/composition state remain intact. Native OS IME painting remains a manual visual remainder if final confirmation is needed.
- Verification anchor: `docs/verification/2026-06-28/ime-underline-repaint-fix.md`.
- Closed lanes remain closed unless new evidence appears: launcher, effect settings wording, Markdown source dev gate, WP-005, Project import recovery, Rich heading, and Rich text block align persistence.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-26 One-click update launcher

- Added a Windows-friendly normal confirmation route after the effect settings wording slice: `ZenWriter-UpdateAndLaunch.cmd` and `npm run app:update:open` update the current branch with fast-forward only, rebuild `dist/`, and open `dist/index.html` through the existing dist launcher.
- Added `npm run app:install:update`, which creates a Start Menu shortcut named `Zen Writer Update and Launch` without replacing the existing `Zen Writer.url` quick-open shortcut.
- Safety boundary: the update path checks for a clean worktree before pulling, uses `git pull --ff-only`, stops on local changes / detached HEAD / non-fast-forward update, and does not discard work.
- Launch boundary: normal confirmation remains `dist/` / default app open, dev server stays explicit development/localhost, and Electron packaged verification remains separate.
- Verification anchor: `docs/verification/2026-06-26/one-click-update-launcher.md`.
- Closed lanes remain closed unless new evidence appears: WP-005, Project import recovery, Rich heading, Rich text block align, Markdown source dev gate, and effect settings wording.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-26 Effect settings writer-facing wording audit

- Returned to the command palette / settings clarity lane after the dead-entry sweep produced no code changes. Scope stayed only on `effectBreakAtNewline` / `effectPersistDecorAcrossNewline` visible wording.
- Product-facing change: command palette and UI Settings now describe the two newline effect toggles as writer actions: `改行後の装飾を切る` and `改行後も装飾を続ける`. Visible descriptions explain whether Enter carries current decoration into the next line instead of exposing `decor`, `BL-002`, or storage key names.
- Storage keys, command ids, defaults, settings persistence, and rich editing Enter behavior are unchanged.
- Focused proof in `e2e/command-palette.spec.js` and `e2e/editor-settings.spec.js` asserts the writer-facing labels and verifies the visible text no longer includes the internal implementation terms.
- Verification anchor: `docs/verification/2026-06-26/effect-settings-writer-facing-wording-audit.md`.
- Closed lanes remain closed unless new evidence appears: command palette dead-entry sweep, Markdown source dev gate, WP-005 preview/comparison, Project import recovery, Rich heading, and Rich text block align persistence.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 Remote sync after Markdown source authority reconciliation

- Local `main` was checked against `origin/main` after `git fetch origin`; before this handoff commit the tree was clean, `HEAD...origin/main = 0 0`, and the latest pushed context was `8db12aa docs: reconcile markdown source authority`.
- This handoff preserves the current restart context in project files only. Product/runtime behavior remains the command palette Markdown source dev gate from `210246c`, with the active authority reconciliation from `8db12aa`.
- Current restart anchor: `docs/verification/2026-06-25/remote-sync-after-markdown-source-authority.md`.
- Closed lanes remain closed unless new evidence appears: WP-005 preview/comparison, Project import recovery, Rich heading, Rich text block align persistence, and Markdown source dev gate implementation.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 Active authority Markdown source dev gate reconciliation

- Followed the `210246c fix: gate markdown source command` product proof with a bounded active-authority residue audit. No runtime behavior changed.
- Reconciled current UI authority wording so normal writing routes point to Rich editing / MD preview / Reader, while Markdown source is named as a developer-mode escape hatch.
- Updated the active UI model / surface docs only: `docs/INTERACTION_NOTES.md`, `docs/UI_SURFACE_AND_CONTROLS.md`, `docs/GADGETS.md`, `docs/USER_REQUEST_LEDGER.md`, and `docs/ROADMAP.md`. Historical dated logs and superseded specs were left intact.
- Verification anchor remains `docs/verification/2026-06-25/command-palette-markdown-source-dev-gate.md`, now including the authority reconciliation notes.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 Command palette Markdown source dev gate

- After Rich text block align persistence, selected a fresh one-topic product slice from editor surface / command palette clarity rather than reopening WP-005, Project import recovery, Rich heading, or paragraph alignment.
- Product-facing change: `editor-surface-markdown` is now a developer-mode command. Normal command palette search no longer offers a Markdown source switch that the app then refuses; developer mode still exposes the escape hatch with wording that names the developer-mode boundary.
- Focused proof in `e2e/command-palette.spec.js` stubs the developer-mode check false, searches `Markdown ソース`, verifies the command is absent, then stubs developer mode true and verifies the command returns with the developer-mode description.
- Verification anchor: `docs/verification/2026-06-25/command-palette-markdown-source-dev-gate.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 Rich text block align persistence

- After WP-005 A/B/C closed, selected a fresh one-topic product slice from the rich editing / save-resume trust lane rather than reopening preview/comparison, Project import recovery, or Rich heading.
- Product-facing change: Rich editing CommandAdapter edits now commit through the editor change path after successful commands, so paragraph alignment syncs to Markdown, saves, updates word count, and refreshes MD preview instead of remaining a visual-only DOM edit.
- `ZWMdItBody` now preserves the narrow `data-zw-align="start|center|end"` block fragments used by P2 paragraph alignment without enabling arbitrary raw HTML. The aligned block body is rendered through the existing inline Markdown renderer before restoration.
- Focused proof in `e2e/rich-text-block-align.spec.js` now aligns a paragraph, verifies saved Markdown content, checks MD preview and Reader `text-align`, reloads, and confirms the aligned paragraph returns in Rich editing.
- Verification anchor: `docs/verification/2026-06-25/rich-text-block-align-persistence.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 WP-005 comparison isolation Slice C

- Completed WP-005 Slice C after Slice A entry cleanup and Slice B MD preview activation. Scope stayed on comparison isolation, not a new comparison UI.
- Product-facing boundary: command palette no longer carries hidden executable `compare-chapter` / `compare-snapshot` routes, structure sidebar wording no longer promises comparison, and MD preview / Reader do not open SplitView.
- `js/split-view.js` remains as future comparison-surface material, explicitly marked as out of public MD preview / Reader / command flows. Future comparison work should start as a dedicated comparison/file-comparison surface rather than reusing preview or Reader.
- Focused proof in `e2e/ui-mode-consistency.spec.js` now searches `compare`, `比較`, and `差分`, verifies no comparison commands/categories appear, and checks that opening MD preview / Reader leaves `#split-view-container` hidden.
- Verification anchor: `docs/verification/2026-06-25/wp005-comparison-isolation-slice-c.md`.
- WP-005 readiness is now closed for the A/B/C cleanup lane. The next product slice should be chosen from a fresh bottleneck; do not reopen comparison unless a dedicated comparison-surface brief or new failure appears.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 WP-005 MD preview rich-preview activation

- Continued WP-005 after Slice A without reopening Project import recovery or Rich heading. Scope stayed on Slice B: MD preview visibility / rich-preview activation proof, not comparison redesign.
- Product-visible change: `#editor-preview` is no longer caught by the generic offscreen `[aria-live]` CSS rule. The panel had been opening and rendering, but could be positioned as an accessibility-only live region instead of a visible editor-adjacent preview.
- Existing preview controller path in `js/editor-preview.js` remains the runtime authority: opening/rendering MD preview calls `TypingEffectController.activate()` and `ScrollTriggerController.activate()` for `#markdown-preview-panel`.
- Added focused proof in `e2e/wp005-md-preview-rich-preview.spec.js`: command palette opens MD preview, rich Markdown/DSL output renders, content updates refresh the preview while open, typing/scroll controllers activate, Reader overlay stays closed, and SplitView stays hidden.
- Verification anchor: `docs/verification/2026-06-25/wp005-md-preview-rich-preview-activation.md`.
- At the time, the next WP-005 candidate was Slice C. Slice C is now closed by the current snapshot above; do not fold chapter compare or snapshot diff back into the MD preview surface.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 WP-005 preview entry Slice A

- Started WP-005 after closing Project import recovery continuation. Scope stayed on Slice A only: preview/comparison entry cleanup, not full preview redesign.
- Product-visible change: stale public split-view comparison entry points were removed from the structure sidebar and Electron menu, while command palette comparison commands were hidden. `js/split-view.js` remains available as future comparison implementation material, not a current public writing workflow entry.
- Current entry model: MD preview is still the editor-adjacent rendering panel, Reader is still the read-only review overlay, and comparison is deferred to a future WP-005 Slice C instead of sharing public preview entry space.
- Verification anchor: `docs/verification/2026-06-25/wp005-preview-entry-slice-a.md`.
- At the time, the next WP-005 candidate was Slice B. Slice B is now closed by the current snapshot above; Slice C remains comparison isolation and should not be folded into MD preview work.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-25 Project import recovery continuation proof

- Returned to the Editor Trust / Project Recovery follow-up requested after `0c21466 feat: clarify failed project import recovery`.
- Product implementation did not need a fix. The focused proof in `e2e/editor-trust-workflow.spec.js` now covers invalid JSON import on the normal document path, safe-failure notification, unchanged current doc id / raw id / docs snapshot, continuation writing, saved state, reload, and restored continuation text.
- The chapter-mode part of the same E2E still keeps invalid import scoped to non-mutation of chapter parent/raw id/docs before the JSON import roundtrip proof. This avoids treating assembled chapter display as a single freeform save surface.
- Verification anchor: `docs/verification/2026-06-25/project-import-recovery-continuation-proof.md`.
- Current next work is no longer `project-import-recovery-continuation-proof`; choose a fresh one-topic bottleneck from the ledger/roadmap instead of reopening Project import recovery or Rich heading without new evidence.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-24 Remote sync after project import safe failure

- Local `main` was checked against `origin/main` after `git fetch --prune origin`; `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Current product proof before this docs-only handoff is `0c21466 feat: clarify failed project import recovery`.
- Supervisor review accepted `project-import-safe-failure-signal`: failed JSON project import now tells the writer that the current document is retained, while the focused E2E still proves invalid import does not mutate current doc id / raw id / docs snapshot.
- This handoff preserves restart context in project files only: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, and `docs/verification/2026-06-24/remote-sync-after-project-import-safe-failure.md`.
- Next bounded product entry: `project-import-recovery-continuation-proof` — after invalid JSON import failure, prove the current editor remains usable, a continuation text can be written, and reload/resume preserves that continuation.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-06-24 Project import safe failure signal

- Returned to an Editor Trust product slice after Rich heading closure. Selected axis: Project Recovery / failed JSON import recovery signal.
- Product-visible change: failed JSON project imports now notify `JSON読み込みに失敗しました。現在の文書は保持されています。` through the Documents import path, drag/drop JSON import path, and Electron menu import path.
- Existing storage behavior is unchanged: invalid JSON import still returns `null` without mutating the current document set. The focused E2E now checks the retained-document message and continues to assert current doc id / raw id / docs snapshot invariance.
- Verification anchor: `docs/verification/2026-06-24/project-import-safe-failure-signal.md`.
- Non-targets preserved: Rich heading, import/export schema, cloud sync, external DB/auth/API, Electron packaging behavior, broad docs cleanup, GitHub cleanup, and AGENTS rules.

### 2026-06-24 Rich heading active docs reconciliation

- Local `main` was checked against `origin/main`; `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0` before this docs-only reconciliation.
- Verification anchor: `docs/verification/2026-06-24/rich-heading-active-docs-reconciliation.md`.
- `docs/ROADMAP.md` now points to the Rich heading closure checklist and placeholder/caret polish proof in its active header / writing trust lane, so the next agent should not return to the older IME / direct shortcut / placeholder review loop.
- Product/runtime state is unchanged. No implementation, E2E, dependencies, storage/import/export, Electron/package, GitHub cleanup, DB/auth/API, or AGENTS behavior changed.
- Next practical entry: choose one current product slice from `docs/USER_REQUEST_LEDGER.md`, audit active-doc drift only where it can mislead the next owner, or run an optional release-wide visual check as confidence work rather than a blocker for Rich heading.

### 2026-06-22 Remote sync after Rich heading closure

- Local `main` was checked against `origin/main` after `git fetch --prune origin`; there were no new remote commits to pull, `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Pre-handoff baseline commit before this docs-only note was `24ca99e docs: add rich heading closure checklist`. This handoff records the current restart context without changing product/runtime behavior.
- This pass preserves restart context in project files only: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, and `docs/verification/2026-06-22/remote-sync-after-rich-heading-closure.md`.
- Current handoff anchor: `docs/verification/2026-06-22/remote-sync-after-rich-heading-closure.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Rich heading context is closed enough to avoid repeat review: use `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md` before asking about IME / direct shortcut / placeholder again. Current classification remains functionality accepted, placeholder UX debt resolved, optional release visual check not blocking.
- Product/runtime state is unchanged by this handoff. Latest editor product proof remains WP-SAVELOAD-001 / `writing-trust-workflow-001`; the next practical entry is stale spec reconciliation or another explicitly selected one-topic slice.

### 2026-06-22 Rich heading closure checklist

- Added a docs-only closure checklist for the Rich editing typed heading shortcut: `docs/verification/2026-06-22/rich-heading-feature-closure-checklist.md`.
- Purpose: prevent repeat review loops around the same IME / direct shortcut / placeholder axis after `75726f9 fix: polish empty rich heading placeholder`.
- Current classification is now explicit: functionality accepted, placeholder UX debt resolved, optional release visual check not blocking.
- Review memory in the checklist records `prior_review_count=1`, `accepted_scope=IME_and_shortcut_functional_path`, `resolved_scope=placeholder_caret_visual_debt_by_css_first_fix`, `not_accepted_scope=release_wide_visual_acceptance`, and `repeated_general_review=false`.
- This slice changed documentation only. No implementation, E2E body, AGENTS, GitHub cleanup, storage/import/export, Electron/package, dependency, DB/auth/API, or embed security behavior changed.
- Future Review Card rule: do not ask the user to re-review the same IME / shortcut / placeholder basics unless a new target, new evidence, changed axis, suspected regression, or user-requested recheck appears.

### 2026-06-22 Rich heading placeholder polish

- Local `main` was first updated from `origin/main`: `git fetch --prune origin` showed `origin/main` ahead, `git pull --ff-only origin main` fast-forwarded from `b56e925` to `05c3379`, and post-pull checks returned clean `## main...origin/main` plus `HEAD...origin/main = 0 0`.
- Consumed the attached review intake for the Rich editing typed heading shortcut. The user-side Microsoft IME / direct `#` / `##` / `###` + Space behavior was treated as functionally OK; the remaining issue was a narrow UX debt where the empty heading placeholder `章タイトルを入力` could visually compete with the caret immediately after conversion.
- Implemented a CSS-first polish: empty heading placeholders are now absolutely positioned out of text flow, and the pseudo-element is not generated while `#wysiwyg-editor` has focus. The hint remains available when the empty heading is not actively being edited.
- Added focused E2E coverage in `e2e/wysiwyg-editor.spec.js` for the active empty heading placeholder state. Existing heading shortcut behavior, Undo, negative cases, paste handling, Markdown source round-trip, and synthetic IME guard remain covered by the same focused grep.
- Verification anchor: `docs/verification/2026-06-22/rich-heading-placeholder-polish.md`. Validation for this slice: `node --check e2e/wysiwyg-editor.spec.js`, `git diff --check`, `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"` -> 11 passed, and `npm run lint:js:check`.
- Non-targets preserved: `js/editor-wysiwyg.js`, shortcut semantics, IME composition gate, storage/import/export, Electron/package behavior, dependencies, DB/auth/API contracts, GitHub cleanup, embed security, and AGENTS rules were not changed.
- Review state: required user-side work is none. A later human visual feel check is optional before release, but the submitted review debt is resolved for this slice.

### 2026-06-22 Remote sync / cross-terminal context handoff

- Local `main` was checked against `origin/main` after `git fetch --prune origin`; there were no new remote commits to pull, `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count "HEAD...origin/main"` returned `0 0`.
- Pre-handoff baseline commit before this docs-only note was `d9198b5 docs: align ime spotcheck handoff head`. This handoff records the current restart context without changing product/runtime behavior.
- This pass preserves restart context in project files only: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, and `docs/verification/2026-06-22/remote-sync-context-handoff.md`.
- Current handoff anchor: `docs/verification/2026-06-22/remote-sync-context-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Active residue is unchanged: the Rich heading shortcut is implemented and agent-verified, but native Japanese IME candidate-window behavior remains `USER_RUN_REQUIRED` via `docs/verification/2026-06-18/rich-heading-ime-spotcheck.md`. If that comes back OK, the shortcut can be treated as screen-checked; if NG, keep the next slice narrow around `js/editor-wysiwyg.js` composition gating and typed heading shortcut handling.
- Product/runtime state is unchanged by this handoff. Latest editor product proof remains WP-SAVELOAD-001 / `writing-trust-workflow-001`; the next product entry remains stale spec reconciliation unless the user selects a different one-topic slice or returns an IME NG report.

### 2026-06-18 Rich heading IME spot-check

- Local `main` was fast-forwarded to `origin/main` after `git fetch --prune origin` showed one remote commit ahead. Post-pull checks returned clean `## main...origin/main` and `HEAD...origin/main = 0 0`; current `HEAD` after the IME spot-check handoff is `b56e925 docs: record rich heading ime spotcheck`.
- Added verification anchor: `docs/verification/2026-06-18/rich-heading-ime-spotcheck.md`. This is a docs/verification-only slice; product code, E2E bodies, storage/import/export behavior, Electron/package behavior, dependencies, DB/auth/API contracts, GitHub cleanup, and AGENTS rules were not changed.
- Local app launch succeeded at `http://127.0.0.1:8080/index.html` with HTTP 200. Agent-side browser verification passed for line-start `#` / `##` / `###` + Space conversion to H1/H2/H3, one-step Undo back to the typed marker, and synthetic `compositionstart` / `compositionend` suppression. Focused E2E also passed: `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"` -> 10 passed.
- Native Japanese IME operation remains `USER_RUN_REQUIRED`: Windows Japanese language/culture is present, but the available automation path cannot honestly operate the Microsoft IME candidate window. The Review Card in the verification note asks the user to check IME composition misfire, intended shortcut conversion, and immediate Undo on the local Rich editing screen.
- Continuation state: if the user replies OK, the shortcut can be treated as screen-checked except for any later release/platform pass. If the user replies NG, keep the next slice narrow around `js/editor-wysiwyg.js` composition gating and typed heading shortcut handling; do not broaden into a general Markdown shortcut or editor redesign.

### 2026-06-18 Remote sync / cross-terminal context handoff

- Local `main` was first fast-forwarded from `89548fd` to `5bd3f71` with `git pull --ff-only origin main`; the post-pull upstream comparison returned `0 0` for `git rev-list --left-right --count "HEAD...origin/main"` before this docs handoff was written.
- The only pre-existing local worktree change was the thin `AGENTS.md` footer `## Imported Claude Cowork project instructions`; it was preserved with the current remote `AGENTS.md` review/autonomy pointer and included in this handoff rather than discarded.
- This pass preserves restart context in project files only: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, `AGENTS.md`, and `docs/verification/2026-06-18/remote-sync-context-handoff.md`.
- Current handoff anchor: `docs/verification/2026-06-18/remote-sync-context-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; when the work touches review/autonomy or handoff behavior, also read `docs/OPERATOR_REVIEW_UX.md`, `docs/ai/STATUS_AND_HANDOFF.md`, `docs/ai/WORKFLOWS_AND_PHASES.md`, and `docs/OPERATOR_WORKFLOW.md`.
- Product/runtime state is unchanged by this handoff. The latest editor product proof remains WP-SAVELOAD-001 / `writing-trust-workflow-001`; the active next product entry remains stale spec reconciliation unless the user selects a different one-topic slice.

### 2026-06-17 Remote sync handoff after v1.8 review/autonomy docs

- Local `main` was checked clean against `origin/main` after `d4de62d docs: add freeform review autonomy guidance`; `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count 'HEAD...@{u}'` returned `0 0`.
- This pass preserves the restart context in project files only: `docs/CURRENT_STATE.md` and `docs/verification/2026-06-17/freeform-review-autonomy-remote-handoff.md`.
- Current handoff anchor: `docs/verification/2026-06-17/freeform-review-autonomy-remote-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; for review/autonomy context also read `docs/OPERATOR_REVIEW_UX.md`, `docs/ai/STATUS_AND_HANDOFF.md`, `docs/ai/WORKFLOWS_AND_PHASES.md`, and `docs/OPERATOR_WORKFLOW.md`.
- Next practical entry points: use Review Card / Freeform Review Intake in the next reviewable artifact, audit remaining MkDocs warning noise, or return to product work selected from `docs/ROADMAP.md` / `docs/USER_REQUEST_LEDGER.md`.

### 2026-06-17 v1.8 Freeform Review / Long-Run Autonomy docs

- Maintenance slice for agent reporting and review UX. Added `docs/OPERATOR_REVIEW_UX.md` as the review/autonomy entry point and connected it from `AGENTS.md`, `docs/ai/STATUS_AND_HANDOFF.md`, `docs/ai/WORKFLOWS_AND_PHASES.md`, `docs/INTERACTION_NOTES.md`, `docs/OPERATOR_WORKFLOW.md`, README surfaces, `docs/PROJECT_OVERVIEW.md`, `docs/index.md`, and `mkdocs.yml`.
- Review guidance now forbids fixed review phrases for user-facing artifact judgment, requires a Review Card when user review is actually needed, and treats freeform review as valid input parsed internally into target / intent / constraints / confidence.
- Operation Cockpit checkpoint reports now include Review Card / Review Debt, optional Freeform Review Intake Result, explicit User-Side Work, and Handoff Gate result. A next-agent prompt is not emitted unless the handoff gate is actually satisfied.
- Long-run autonomy is now explicit: when the next 1-3 actions are clear, reversible, and scoped, the assistant should execute them before reporting rather than merely listing them.
- `docs/RUNTIME_STATE.md` was not recreated. Current restart/runtime facts remain anchored in `docs/CURRENT_STATE.md`; Operation Cockpit is a report shape, not a persistent runtime-state file.

### 2026-06-15 Local docs overview and remote handoff

- Local documentation browser context is now preserved in project files. The latest docs-view proof before this handoff is `6add8c4 docs: add project overview map`, building on `5b60db7 docs: add local mkdocs browser view`.
- Added overview entry points: `docs/PROJECT_OVERVIEW.md`, `docs/VISUAL_EVIDENCE_INDEX.md`, and `docs/TURN_PLAN.md`. These pages point reviewers to the existing source documents; they do not replace, translate, or summarize specifications as a new authority.
- MkDocs Material remains the local-only browser view. `docs/index.md`, `mkdocs.yml`, and `tools/generate-doc-nav.ps1` include the overview pages under the Overview tree.
- Verification before the handoff: `python -m mkdocs build --clean` succeeded; the remaining warnings are existing links from source docs to excluded code/E2E/generated paths or wrapper-relative targets. The local server at `http://127.0.0.1:8005/` returned HTTP 200 for `/PROJECT_OVERVIEW/`, `/VISUAL_EVIDENCE_INDEX/`, and `/TURN_PLAN/`.
- Current handoff anchor: `docs/verification/2026-06-15/local-docs-overview-remote-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`. For this docs-browser context, then read `docs/PROJECT_OVERVIEW.md`, `docs/VISUAL_EVIDENCE_INDEX.md`, `docs/TURN_PLAN.md`, and `docs/index.md`.
- Next practical entry points: generate/curate a small visual evidence set, audit `FEATURE_REGISTRY` coverage gaps, separate stale references from active next-slice instructions, or return to product work selected from `docs/ROADMAP.md` / `docs/USER_REQUEST_LEDGER.md`.

### 2026-06-15 WP-SAVELOAD-001 Editor Trust Vertical Slice

- Active Artifact `writing-trust-workflow-001`。Zen Writer を「原稿を預けられる Editor」として再評価し、新規文書作成、Rich editing 本文入力、Documents 明示保存、自動保存後 reload、chapterMode 親 document 対象、TXT / Markdown / JSON export、JSON import roundtrip、不正 JSON import 非破壊失敗、保存失敗表示を 1 本の workflow として確認した。
- Product fixes: `beforeunload` が chapterMode 章 0 件 document を空 assembled text で上書きしないよう修正。非同期 IDB 初期化が runtime docs cache を古い IDB docs で上書きしないよう修正。raw current id が章 ID の場合も保存・書き出し対象を親 document へ正規化。
- Save-state visibility: `#writing-status-chip` は `編集中` / `保存済み` に加え、保存失敗時に `data-save-state="failed"` と `保存失敗` を表示。Documents 明示保存も失敗時に `保存失敗` を通知する。
- Import/export proof: 新規 `e2e/editor-trust-workflow.spec.js` は TXT / Markdown / JSON の実 download file を読み取り、JSON import roundtrip と破損 JSON import の非破壊失敗を確認。既存 `export-trust` / `import-roundtrip-hardening` / `chapter-creation-daily-flow` も再実行して green。
- Unit proof: 新規 `test/storage-roundtrip.test.js` は `ZenWriterStorage.importProjectJSON()` の duplicate suffix、新規 ID、invalid JSON 非破壊、保存失敗時 import 非破壊を確認。
- Manual screen proof: Browser で `http://127.0.0.1:8080/index.html` を開き、status chip の `編集中` -> `保存済み HH:mm`、Documents help の「この端末に自動保存」「外部退避」、`入出力` menu の TXT / JSON / JSON読み込みを確認。
- Verification anchor: `docs/verification/2026-06-15/editor-trust-vertical-slice.md`。保存モデルの短い入口は `docs/EDITOR_TRUST_WORKFLOW.md`。
- Non-targets preserved: Rich Editing 新機能、Reader 表現拡張、ガジェット追加、テーマ刷新、Electron package 配布整備、Cloud sync、外部 DB / auth / API、Google Drive / Keep 連携、大規模リファクタ、GitHub Issue / PR cleanup、AGENTS.md 肥大化は未実施。

### 2026-06-08 Remote sync context handoff after ledger anchor

- Docs-only handoff for cross-terminal restart. Before editing docs, `git fetch --prune origin` completed, `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Current editor product proof remains `1e33e38 feat: add rich editing heading shortcut`. Latest docs reconciliation proof before this handoff is `4cb49ee docs: reconcile ledger handoff anchor`.
- This pass preserves context in project files only: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, and `docs/verification/2026-06-08/remote-sync-context-handoff-after-ledger-anchor.md`.
- Current handoff anchor: `docs/verification/2026-06-08/remote-sync-context-handoff-after-ledger-anchor.md`.
- No product code, E2E, storage/import/export behavior, Electron/package behavior, dependencies, DB/auth/API behavior, GitHub Issue / PR cleanup, embed security audit, or AGENTS.md changes.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next recommended entry point: a real screen/feel verification such as the Japanese IME spot-check for the Rich editing typed heading shortcut. Avoid another docs-only/readback pass unless the user explicitly asks for one.

### 2026-06-08 Ledger handoff anchor reconciliation

- Docs-only follow-through for stale spec reconciliation. Product proof remains `1e33e38 feat: add rich editing heading shortcut`; docs reconciliation proof before this pass is `a7b90e6 docs: reconcile heading shortcut stale specs`.
- Reconciled one active owner-doc cluster: `docs/USER_REQUEST_LEDGER.md` still pointed the current cross-terminal handoff at the Rich editing shortcut handoff instead of the latest docs reconciliation handoff. It now names `docs/verification/2026-06-08/stale-spec-reconciliation-after-heading-shortcut.md` and records `a7b90e6` as the docs reconciliation proof.
- Added a boundary note before dated ledger history so older next-candidate lines that mention Rich Editing Heading Shortcut Decision are read as historical references. The active next-slice table remains the current authority.
- Current handoff anchor: `docs/verification/2026-06-08/ledger-handoff-anchor-reconciliation.md`.
- No implementation code, E2E, storage, Electron, GitHub Issue / PR cleanup, embed security audit, or AGENTS.md changes.

### 2026-06-08 Stale spec reconciliation after heading shortcut

- Docs-only reconciliation after `1982228 docs: hand off rich editing heading shortcut`. Product proof remains `1e33e38 feat: add rich editing heading shortcut`; no runtime code, UI contract, storage behavior, dependency, DB/auth/API, or Electron/package behavior changed.
- Current authority now treats Rich Editing Heading Shortcut Decision as done everywhere it is used for active slice selection. `Current Priorities` no longer lists it as the next decision, and stale spec reconciliation is the active next candidate.
- `docs/FEATURE_REGISTRY.md` now includes the typed heading shortcut as a user-facing Rich editing feature, pointing to the current handoff, implementation file, and focused E2E coverage.
- `docs/ROADMAP.md` now names `FEATURE_REGISTRY` alongside `CURRENT_STATE` / `USER_REQUEST_LEDGER` for the shortcut authority. Historical verification notes that describe older next-candidate order remain historical references, not active restart instructions.
- Current handoff anchor: `docs/verification/2026-06-08/stale-spec-reconciliation-after-heading-shortcut.md`.
- Validation for this docs-only slice: `git diff --check` and `git diff --cached --check` passed.
- Next candidates remain stale spec reconciliation follow-through first, optional Japanese IME spot-check before release, and GitHub cleanup only as non-blocking bookkeeping.

### 2026-06-08 Rich editing typed heading shortcut

- Product proof anchor for the current editor slice is `1e33e38 feat: add rich editing heading shortcut`. The previous import-trust proof `a56671b test: harden import roundtrip` remains the baseline for JSON import behavior, not the current editor shortcut proof.
- Rich editing now adopts the heading shortcut as a **limited typed trigger**: in the normal contenteditable surface, line-start `# ` / `## ` / `### ` confirmed by Space converts the current paragraph/div to H1/H2/H3. It does not add a general Markdown shortcut engine.
- Boundaries preserved: `#hashtag`, inline `# `, and `#### ` stay literal; paste, import, Markdown source round-trip, `markdownToHtml`, and `htmlToMarkdown` stay on the existing conversion paths; IME composition is gated; Undo immediately after conversion restores the typed marker.
- Sections / chapterMode boundary is unchanged. The shortcut only creates real heading blocks in the editor surface and does not replace `+ 新しい章`, ChapterStore creation, or the Markdown source escape hatch.
- Validation for the product slice: `node --check js/editor-wysiwyg.js`, `npx playwright test e2e/wysiwyg-editor.spec.js --workers=1 --reporter=line --grep "heading shortcut"` (10 passed), `npm run test:smoke`, `npm run lint:js:check`, and `git diff --check` all passed before the product commit.
- Current handoff anchor: `docs/verification/2026-06-08/rich-editing-heading-shortcut-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next candidates shift to stale spec reconciliation first. Optional follow-up before a release cut: manual Japanese IME spot-check for the typed shortcut. GitHub Issue / PR cleanup remains non-blocking bookkeeping and is not product progress.

### 2026-06-05 Remote sync after GitHub artifact authority correction

- Local `main` was checked after `git fetch --prune origin` and `git pull --ff-only origin main`; remote was already up to date at `c272503 docs: downgrade stale github artifacts`.
- Product proof anchor remains `a56671b test: harden import roundtrip`. This handoff changes only project docs so another terminal can resume from current `main` without chat history.
- Pre-handoff sync checks: `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Current handoff anchor: `docs/verification/2026-06-05/remote-sync-after-github-artifact-authority-correction.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next candidates remain current-main product work: `Rich Editing Heading Shortcut Decision` first, stale spec reconciliation second. GitHub Issue / PR cleanup remains non-blocking bookkeeping and is not product progress.

### 2026-06-05 GitHub artifact authority correction

- Correction to the Issue #118 / PR #119 meta-review: GitHub Issue / PR cleanup is not a human-side blocker and must not block current-main product work in this repo.
- Authority order: current `main`, `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/INVARIANTS.md`, implementation diffs, verification results, and explicit user-selected work outrank open GitHub Issues / PRs. Open Issue / open PR state alone is weak management information, not an active artifact.
- Keep the previous evidence: PR #119 is stale / reference-only, must not be merged / rebased / cherry-picked, and `feature/ISSUE-118-postmessage-security` must not be reused as an implementation branch. Issue #118, if revisited, is a current-main missing-DoD narrow audit only.
- Withdraw the previous blocker framing: PR #119 close / Issue #118 close is bookkeeping, not product progress and not a prerequisite for resuming current-main development. If an agent can safely do cleanup, it may; otherwise record stale / reference-only status in docs and return to the mainline.
- Human input should be requested only for product priority: whether embed security should become the next selected product slice, or whether to continue with `Rich Editing Heading Shortcut Decision` / stale spec reconciliation.

### 2026-06-05 Issue #118 / PR #119 meta-review gate

- Corrected gate result: GitHub artifacts are non-blocking stale/reference context. Do not implement Issue #118 from PR #119, and do not merge / rebase / cherry-pick PR #119. The next product move should return to current-main priorities unless the user explicitly selects embed security.
- Active artifact remains the current `main` writing-trust state. Product proof anchor remains `a56671b test: harden import roundtrip`; next product candidates remain `Rich Editing Heading Shortcut Decision` first and stale spec reconciliation second.
- Git readback after `git fetch --prune origin`: local `HEAD` and `origin/main` are synchronized (`HEAD...origin/main = 0 0`), and `HEAD` is contained by `main` / `origin/main`. The working tree already had staged docs-only cross-terminal handoff changes from 2026-06-04.
- Issue #118 is still open and describes postMessage security / child-bridge strict parent+origin checks / cross-origin demos / docs / dev-check. `docs/EMBED_TESTING.md` referenced by the issue does not exist in current `main`; treat that path as stale and use `docs/EMBED_SDK.md` plus source readback instead.
- PR #119 is open from `feature/ISSUE-118-postmessage-security` to `main`, but its changed files are SP-073 PathText freehand drawing files, not embed/security files. Its head commit `4f620e9` has the same tree as current-main ancestor `49c3c2f feat: SP-073 Phase 4 フリーハンド描画...`, so that payload is already present on `main` under the correct PathText commit.
- The PR branch is stale and dangerous as a merge source: `origin/main..origin/feature/ISSUE-118-postmessage-security` shows a broad reverse diff that would delete current authority docs, modern E2E, Local Gadget Mod work, writing-trust proofs, and other current surfaces.
- Current `main` already contains strict `child-bridge.js` parent-source/origin checks, `allowedOrigin` target sends, SDK targetOrigin handling, cross-origin demo, and `scripts/dev-check.js` security pattern checks. Treat Issue #118 as a close / audit candidate, not as approval to start a new branch automatically.
- Verification anchor: `docs/verification/2026-06-05/issue-118-pr-119-meta-review.md`.

### 2026-06-04 Remote sync and cross-terminal handoff

- Local `main` was fast-forwarded from `4aa2f62 docs: record restart roadmap handoff` to `d007bf0 docs: hand off current sync context` after `git fetch origin` showed new remote work. The pulled remote work includes Import Roundtrip Hardening and the 2026-06-03 current-context handoff.
- Product proof anchor remains `a56671b test: harden import roundtrip`; this 2026-06-04 handoff changes only project docs so another terminal can restart without chat history.
- Before this docs update, `git status --short --branch` showed clean `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Current handoff anchor: `docs/verification/2026-06-04/remote-sync-cross-terminal-handoff.md`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next candidates remain unchanged after the pull: `Rich Editing Heading Shortcut Decision` first, `Docs Hygiene: stale spec reconciliation` second. WP-004 parity pack remains a user-actor release gate only when a fresh preview / Reader difference appears.

### 2026-06-03 Remote sync and current-context handoff

- Product proof anchor は引き続き `a56671b test: harden import roundtrip`。今回の handoff は product code / UI 契約 / storage 契約 / dependency / DB / auth / API behavior を変えず、再開文脈を project docs に固定する docs-only slice。
- Pre-handoff context anchor: `b9948fb docs: hand off import roundtrip sync`。`git fetch --prune origin` 後、docs 編集前の `git rev-list --left-right --count HEAD...origin/main` は `0 0`、`git status --short --branch` は clean `## main...origin/main`。docs validation は `git diff --cached --check` と `npm run test:smoke` が PASS。
- Remote handoff anchor: `docs/verification/2026-06-03/remote-sync-current-context-handoff.md`。
- 別端末では `git pull --ff-only origin main` 後、clean `main...origin/main` と `HEAD...origin/main = 0 0` を確認し、`docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` を読む。次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。
- 次候補は変えない。`Rich Editing Heading Shortcut Decision` が第一候補、`Docs Hygiene: stale spec reconciliation` が第二候補。WP-004 parity pack は新しい preview / Reader 差分が出た時の user-actor release gate として残す。

### 2026-05-25 Remote sync handoff after Import Roundtrip Hardening

- Product proof anchor: `a56671b test: harden import roundtrip`。Import Roundtrip Hardening は `origin/main` へ push 済み。
- Remote handoff anchor: `docs/verification/2026-05-25/remote-sync-import-roundtrip-handoff.md`。
- 同期確認: handoff note 作成前の `git status --short --branch` は `## main...origin/main`、`git rev-list --left-right --count HEAD...origin/main` は `0 0`。
- 再開手順: 別端末では `git pull --ff-only origin main` 後、clean `main...origin/main` と `HEAD...origin/main = 0 0` を確認し、`docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` を読む。次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。
- 次候補は `Rich Editing Heading Shortcut Decision` が第一候補、`Docs Hygiene: stale spec reconciliation` が第二候補。WP-004 parity pack は新しい preview / Reader 差分が出た時の user-actor release gate として残す。

### 2026-05-25 Import Roundtrip Hardening

- JSON 読み込みは `ZenWriterStorage.importProjectJSON(jsonString)` の公開形を変えず、保存前に parse / format / pages 正規化を済ませる。失敗時は既存 docs を変更せず `null` を返す。
- 明示 `format` は従来どおり `zenwriter-` 系だけ許可。`format` なし legacy pages-only JSON は、有効な page がある時だけ `読み込みドキュメント` として戻せる。
- import は常に新規 document / chapter ID を作る。同名 document は `元タイトル (読み込み 2)` から決定的に suffix を付け、章タイトルの重複は創作上の意図として保持する。
- pages は `order` 昇順、同値は元配列順で並べ、保存時 order を `0..n-1` に正規化。level / visibility / blank title / non-string content を安全側へ丸め、document.content が空なら pages から Markdown 本文を再構成する。
- Verification anchor: `docs/verification/2026-05-25/import-roundtrip-hardening.md`。新規 E2E は `e2e/import-roundtrip-hardening.spec.js`。
- 次候補は `Rich Editing Heading Shortcut Decision` を第一候補、stale spec reconciliation を第二候補に移す。WP-004 parity pack は新しい preview / Reader 差分が出た時の user-actor release gate のまま。

### 2026-05-15 Remote sync and restart roadmap handoff

- Current docs handoff is recorded in `docs/verification/2026-05-15/remote-sync-restart-roadmap-handoff.md`.
- Before this docs update, local `main` was clean and synchronized with `origin/main`: `git status --short --branch` showed `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Product proof remains `8770edd feat: clarify first-use save help`; this handoff preserves restart context and roadmap analysis only.
- Local readiness checked in this block: `npm run test:smoke`, `npm run lint:js:check`, `npm run test:unit`, `npm run build`, and `git diff --check` passed. `npx playwright test --list` reported 66 spec files and 588 tests.
- Not run in this block: full monolithic E2E and Electron package build. Continue to prefer focused Playwright specs / shards or targeted Electron checks when a slice touches those surfaces.
- Next-slice priority remains: `Import Roundtrip Hardening` first, `Rich Editing Heading Shortcut Decision` second, stale spec reconciliation third. WP-004 parity pack remains a user-actor release gate unless a new preview / Reader difference appears.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main` and `HEAD...origin/main = 0 0`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-05-14 Remote sync handoff after First-use Save Help

- Remote handoff after First-use Save Help is recorded in `docs/verification/2026-05-14/remote-sync-first-use-save-help-handoff.md`.
- Product proof before handoff: `8770edd feat: clarify first-use save help`.
- Local `main` was pulled with `git pull --ff-only origin main`; it was already up to date with `origin/main`.
- Pre-handoff sync check: `git status --short --branch` showed `## main...origin/main`, and `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- Restart from another terminal: run `git pull --ff-only origin main`, confirm clean `main...origin/main`, then read `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`. Use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.

### 2026-05-14 First-use Save Help restart anchor

- First-use Save Help is now the latest writing-trust slice. It does not add a new save model; it makes the existing local autosave / Documents / TXT/JSON takeout model readable to first-time or returning users.
- Product help: `#writing-status-chip` now exposes an aria/title explanation that body text is auto-saved on this device and the chip shows save state. Documents shows a short helper line for local autosave, status location, TXT/JSON external takeout, JSON import, and chapter structure. The empty Documents state points `+ 文書` users toward local autosave. The `入出力` menu adds a short external-takeout hint and clearer item titles for TXT export, JSON export, and JSON import.
- E2E anchor: `e2e/first-use-save-help.spec.js` covers first-use empty Documents, document creation, Rich editing body entry, saved status chip, Documents discovery, import/export wording, no `JSON保存` regression, and a chapter-mode document retaining two chapter records while the same help remains visible.
- Not included: Cloud sync, EPUB/DOCX, floating memo persistence, top chrome/toolbar revival, export UI redesign, chapter template/outline features, or broad stale-doc cleanup.

### 2026-05-13 Chapter Creation Daily Flow restart anchor

- Chapter Creation Daily Flow is now the latest writing-trust proof. The verified user path is: new document -> Rich editing -> `+ 新しい章` -> two chapter titles/bodies -> chapter switching -> save/reload resume -> Reader round trip -> TXT/JSON export -> JSON import roundtrip.
- Product fix: chapterMode `+ 新しい章` now stays on the `ZWChapterStore.createChapter()` route even when the document has zero existing chapter records. Existing editor text is split into the first chapter before appending a new chapter, so adding a chapter no longer risks turning the current body into an unstructured heading insert.
- Product fix: chapter slice editing in the normal Rich editing surface now flushes to the chapter store, and TXT/Markdown export uses `ZWChapterStore.assembleFullText()` when chapter pages exist. This keeps TXT export from accidentally exporting only the active chapter slice.
- E2E anchor: `e2e/chapter-creation-daily-flow.spec.js` covers chapter creation, body isolation, save/reload, Reader, TXT/JSON export, and JSON import roundtrip. `e2e/sections-nav.spec.js` daily writing expectations were updated to match the chapterMode Store route.
- Not included: Cloud sync, EPUB/DOCX, floating memo persistence, top chrome/toolbar revival, chapter templates, outline editor, drag/drop chapter reorder, and broad stale-doc cleanup.

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.38 |
| ブランチ | `main` / `origin/main` は同期運用。最新 product proof は `command-palette-markdown-source-dev-gate`、直前の rich editing trust proof は `rich-text-block-align-persistence`。最新 preview/comparison proof は WP-005 Slice C `wp005-comparison-isolation-slice-c` |
| 現在の主軸 | **Editor surface / command palette clarity**: `Editor` は唯一の執筆面、`Rich editing` は通常の編集表示、`Markdown source` は開発者向け escape hatch、`Reader` は編集不可の読者確認 surface |
| 直近の実装スライス | `js/command-palette.js` の `editor-surface-markdown` を `devOnly` にし、通常ユーザーの command palette から Markdown source 切替を隠す。開発者モードでは同じ command が残り、説明文が開発者モード境界を明示する |
| 最新ビルド・検証 | 2026-06-25 command palette slice: `node --check js/command-palette.js`、`node --check e2e/command-palette.spec.js`、`npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "Markdown source command"` PASS。追加の lint / diff checks は本スライスの final validation を正とする |
| 隔離サイドクエスト | 無重力メモ / Floating memo lab。command palette 限定の dev-only / experimental overlay。既存 editor data model / autosave 契約、正式 Gadget、loadout には接続しない |
| 今回の docs sync | `CURRENT_STATE` / `USER_REQUEST_LEDGER` / `ROADMAP` / `FEATURE_REGISTRY` と `docs/verification/2026-06-25/command-palette-markdown-source-dev-gate.md` に、command palette の Markdown source dev gate と再開文脈を固定 |

## Historical Handoff Digest (reference only)

- New: Remote sync after Markdown source authority reconciliation を docs-only で追加。`git fetch origin` 後の `main...origin/main` は clean、`HEAD...origin/main = 0 0`、最新反映済み文脈は `8db12aa docs: reconcile markdown source authority`。別端末では `git pull --ff-only origin main` 後に `CURRENT_STATE` -> `INVARIANTS` -> `INTERACTION_NOTES` を読み、次スライス選定時だけ `USER_REQUEST_LEDGER` / `ROADMAP` を読む。Runtime / E2E body / storage / Electron / AGENTS は未変更。
- New: Active authority Markdown source dev gate reconciliation を docs-only で実施。通常導線は Rich editing / MD プレビュー / Reader として読み、Markdown source は開発者モードの escape hatch としてだけ扱うよう `INTERACTION_NOTES`、`UI_SURFACE_AND_CONTROLS`、`GADGETS`、`USER_REQUEST_LEDGER`、`ROADMAP` を最小更新した。Runtime / E2E body / command palette implementation / storage / Electron / AGENTS は未変更。歴史ログと superseded specs は active authority ではないため書き換えていない。
- New: Command palette Markdown source dev gate を実施。`editor-surface-markdown` は開発者モード限定の command になり、通常配布相当の command palette では `Markdown ソース` 検索に出ない。開発者モードでは escape hatch として残り、説明文も開発者モード境界を明示する。別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` を読み、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。WP-005、Project import recovery、Rich heading、Rich text block align は新規 failure なしに reopen しない。
- New: Remote sync context handoff を docs-only で追加。`git fetch --prune origin` 後の `main...origin/main` は clean、`HEAD...origin/main = 0 0`。最新 editor product proof は `1e33e38 feat: add rich editing heading shortcut`、最新 docs reconciliation proof は `4cb49ee docs: reconcile ledger handoff anchor`。次端末は `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` を読み、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。Product code / E2E / storage / Electron / GitHub cleanup / embed security / AGENTS.md は未変更。次は docs-only 連続ではなく、Rich editing typed heading shortcut の日本語 IME spot-check など実画面確認を優先候補に戻す。
- New: `USER_REQUEST_LEDGER` の current handoff anchor を docs reconciliation proof まで進め、dated history が current next-candidate order と誤読されないように境界文を追加した。Rich Editing Heading Shortcut Decision は引き続き Done、stale spec reconciliation follow-through が第一候補。Product code / E2E / storage / Electron / GitHub cleanup / embed security / AGENTS.md は未変更。
- New: stale spec reconciliation after heading shortcut を docs-only で実施。Rich Editing Heading Shortcut Decision は完了済みとして `Current Priorities` を更新し、typed heading shortcut を `FEATURE_REGISTRY` に登録した。`ROADMAP` の authority 説明も `FEATURE_REGISTRY` を含む形へ寄せた。Product proof は `1e33e38 feat: add rich editing heading shortcut` のまま。次候補は stale spec reconciliation follow-through first、任意の日本語 IME spot-check は release 前確認、GitHub Issue / PR cleanup は non-blocking bookkeeping。
- New: Rich editing typed heading shortcut を限定採用として実装。`1e33e38 feat: add rich editing heading shortcut` が product proof。Rich editing 通常入力の行頭 `# ` / `## ` / `### ` だけを H1/H2/H3 へ変換し、`#hashtag`、行中 `# `、`#### `、paste、import、Markdown source round-trip、`markdownToHtml` / `htmlToMarkdown` は既存挙動に残す。別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。次候補は stale spec reconciliation first、任意の手動 IME spot-check は release 前確認として扱う。
- New: Remote sync after GitHub artifact authority correction を追加。`main` / `origin/main` は `c272503 docs: downgrade stale github artifacts` で同期済み。別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。その時点の次候補は `Rich Editing Heading Shortcut Decision` first、stale spec reconciliation second。
- New: GitHub artifact authority correction を追加。PR #119 は Issue #118 の実装 PR として信用せず、SP-073 PathText freehand drawing の重複 artifact / stale branch として reference-only に下げる判断は維持する。一方で、PR #119 / Issue #118 の GitHub close は人間側 blocker ではなく帳簿整理に降格する。Issue #118 を扱う必要が出た場合だけ current `main` から missing DoD の narrow audit とし、その時点の通常候補は `Rich Editing Heading Shortcut Decision` / stale spec reconciliation だった。
- New: 2026-06-04 Remote sync and cross-terminal handoff を追加。local `main` は `d007bf0 docs: hand off current sync context` まで fast-forward 済みで、product proof は `a56671b test: harden import roundtrip` のまま。別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。その時点の次候補は `Rich Editing Heading Shortcut Decision` first、stale spec reconciliation second。
- New: Remote sync and current-context handoff を追加。product proof は `a56671b test: harden import roundtrip` のまま、pre-handoff context は `b9948fb docs: hand off import roundtrip sync`。別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。その時点の次候補は `Rich Editing Heading Shortcut Decision` first、stale spec reconciliation second。
- New: Remote sync handoff after Import Roundtrip Hardening を追加。`a56671b test: harden import roundtrip` を product proof anchor とし、別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。
- New: Import Roundtrip Hardening を実施。`importProjectJSON` は保存前正規化に移し、不正 JSON / unsupported format / empty JSON / invalid legacy pages-only は docs を変更せず `null`。format-less pages-only は有効 page がある時だけ受け入れ、同名 document は `読み込み N` suffix、新規章 ID、正規化 order / level / visibility / blank title / content fallback で復元する。Export schema、Documents UI 文言、Electron menu、Cloud sync / EPUB / DOCX / Rich editing shortcut / Floating memo 保存モデルは未変更。

- Shared focus: session 127〜129 の unified shell foundation、daily writing narrow fix、writing workflow friction sweep を、現行判断の起点にする。
- Trusted: Story Wiki / Link Graph / Compare の shell token 寄せ、gadget collapse 契約、left nav label/icon/panel/gadget 対応、package safe launcher。
- Closed: visible top chrome surface は廃止。旧 `ZenWriterTopChrome` / `menu:toggle-toolbar` 互換経路は command palette へ誘導し、F2 / Electron menu も command palette を開く。
- New: Editor surface は「Editor = 唯一の執筆面」「Rich editing = 既定のリッチ編集表示」「Markdown source = 開発者向け escape hatch」「Reader = 編集不可の読者確認 surface」で整理済み。Documents は作成・保存・入出力・管理を分け、`JSON保存` ではなく `JSON書き出し` と呼ぶ。周辺 gadget も `+ Wikiページ`、`+ 構成プリセット`、`TXT書き出し`、`プロファイル保存`、`ロードアウト適用` のように対象つき label へ寄せる。
- New: `#writing-status-chip` は Reader / Floating memo lab 非表示時だけ文字数と `編集中` / `保存済み` を非操作型で表示する。`GadgetPrefs` も `LoadoutManager` と同じ hide-by-default に移した。
- New: `main-hub-panel` の active source refs は削除済み。legacy command compatibility (`toggle-fullscreen` / `ui-mode-*`) は hidden 互換として維持する。
- New: Electron window drag はユーザー確認で安定。今後の主軸は 2 レーンに分ける。Lane A は無重力メモ / Floating memo lab の visual iteration と productization gate、Lane B はガジェット再整理の usefulness audit と default loadout cleanup。どちらも現行 Editor / Reader / left nav 契約を壊さず、実装スライスは 1 トピックに限定する。
- New: Gadget cleanup は削除ではなく標準導線から下げる方針。`UISettings` は日常表示・文字サイズ・placeholder・自動保存だけ、`EditorAdvancedSettings` はリッチ編集改行 / Textbox / 浮遊パネル / gadget 表示を持つ。`MarkdownPreview` は標準 preset から外し、`FontDecoration` / `TextAnimation` は `TextEffects` へ統合して VN preset だけ残す。
- New: Phase 1 既知 regression は解消済み。left nav category の root 戻りは sidebar 左列の空白クリックだけで発火し、button / input / link / tree item / gadget controls は奪わない。Story Wiki full mode は containing gadget の collapsed/hidden 状態を解除し、full pane を viewport 幅で表示して backlinks detail を見せる。
- New: B3 初回候補として `FontDecoration` / `TextAnimation` を `TextEffects` へ統合。旧 loadout 名は normalization で `TextEffects` へ移行し、custom loadout の明示利用は保つ。テキストアニメーション gadget 経路は `applyTextAnimation` を呼ぶ。
- New: Writing UX map の優先順位は **Editor canvas > 保存/文字数 status > Documents/Sections > on-demand Gadgets > experimental memo**。Floating memo は本流保存・正式 Gadget・loadout へ接続せず、執筆面の外縁に出る experimental fragment として扱う。次の設計候補は「保存安心感」または「Gadget 情報設計」だが、実装は別スライスに分ける。
- New: A1 Floating memo reframe は完了。背景 memo は visible title / state / `DRAG` / textarea 枠を持たず、短い read-only fragment として漂う。foreground だけ borderless textarea を表示し、既定サンプルで明示 scrollbar を出さない。既存の memo identity / despawn-respawn / touch slop / focus restore / reduced-motion 契約は維持する。
- New: Build output の正本は `dist/`（`npm run build` / `app:open:dist`）と `build/`（Electron builder / `build/win-unpacked/Zen Writer.exe`）だけ。旧 `build-new/` / `build-session*/` / `build-friction/` はロック回避の一時退避物で、`npm run clean:builds` で削除する。
- New: A2 daily writing proof は E2E 化済み。Rich editing で短い原稿を入れ、Sections 表示、`#writing-status-chip` の `編集中`→`保存済み`、Reader 往復、Floating memo lab 開閉後の editor focus 復帰を 1 本の flow で確認する。保存モデルや正式 Gadget 化は A3 まで保留。
- New: Closeout 整理では `.serena/project.yml` のテンプレ差分を tool noise として HEAD へ戻し、`.playwright-mcp/` と root の確認用 PNG を ignore。`scripts/clean-build-outputs.js` は `package.json` から参照される正式差分として残す。
- New: A3 productization gate は **command palette 限定の実験導線** で確定。`浮遊メモ実験` は保存されない隔離実験 overlay を開閉する正規入口で、`?memoLab=1` は E2E / developer 用の直接起動 hook としてのみ残す。保存モデル、設定、正式 Gadget 化、loadout preset、Documents / Sections / autosave 接続は追加しない。
- New: 2026-05-08 restart consolidation で、A3 closeout は未コミット差分ではなく `db3b3df` として remote 反映済みであることを確認。`.serena/project.yml` の Serena template churn は tool noise として HEAD へ戻し、次スライスは C2 Gadget information design の read-only audit から 1 トピックに絞る。B3 merge / delete は audit で候補が出るまで始めない。
- New: Local Gadget Mod MVP を追加。`PluginManager` は設定モーダル内の `ローカルMod` として manifest 上の Mod を表示し、enable/disable を `zw_plugin_manager_enabled` に保存する。`api.gadgets.register()` 経由の gadget は `source: 'plugin'` と `pluginId` を持ち、enabled Mod は loadout に明示列挙されていなくても指定 group へ表示される。反映は reload 後でよい。
- New: Local Gadget Mod 開発ワークフローを整理。`docs/PLUGIN_GUIDE.md` は候補判定→folder entry→manifest→`window.ZWPlugin.register()`→`ローカルMod` enable→reload→検証の正本、`docs/specs/spec-local-gadget-mods.md` は判断ゲート、`docs/GADGETS.md` は built-in 例外ルート、`docs/design/PLUGIN_SYSTEM.md` は背景設計 / deferred を担当する。
- New: C2 Gadget Mod boundary audit を実施。`MarkdownPreview` は標準 preset から除外済みで developer/audit 用入口に近いため、最初の Local Gadget Mod migration 候補に固定。StoryWiki / LinkGraph / Images は preserve / contextual、LoadoutManager / GadgetPrefs は admin hide 維持。
- New: B3 follow-up として `MarkdownPreview` の built-in gadget wrapper を `markdown-preview-gadget` Local Mod へ移動。manifest 既定は disabled、設定モーダル `ローカルMod` で enable し reload 後に edit group へ出る。preview pipeline 本体と既存 preview 導線は変更しない。
- New: 次の高優先候補として `HUDSettings` の built-in gadget wrapper を `hud-settings-gadget` Local Mod へ移動。manifest 既定は disabled、設定モーダル `ローカルMod` で enable し reload 後に advanced group へ出る。HUD 本体 / `ZenWriterHUD` / autosave HUD / command palette HUD 表示は変更しない。
- New: `PomodoroTimer` Mod feasibility audit を実施。wrapper は `js/gadgets-pomodoro.js`、engine は `js/pomodoro-timer.js`、標準 assist preset と `e2e/pomodoro.spec.js` は built-in visible 前提。さらに settings UI が `ZWGadgets.registerSettings('PomodoroTimer', ...)` を使う一方、現行 Plugin API は `api.gadgets.registerSettings()` を公開していないため、次判断は API 追加込みの完全 Mod 化か built-in retain の 2 択に絞る。
- New: ユーザー判断により `PomodoroTimer` は小説執筆自体には不要な補助と確定。`api.gadgets.registerSettings()` を追加し、timer UI と settings UI を `pomodoro-timer-gadget` Local Mod へ移動。manifest 既定は disabled、enable + reload 後だけ assist group に表示される。`window.ZenWriterPomodoro`、Pomodoro storage、HUD notification は built-in のまま維持する。
- New: Local Gadget Mod migration lane を closeout。`MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件は externalized set として固定し、`choice` は command plugin 維持、StoryWiki / LinkGraph / Images は preserve / contextual、LoadoutManager / GadgetPrefs は admin hide 維持。追加 migration は standing next action にしない。
- New: active help / shortcut resources に残っていた旧 `Normal / Focus / 表示モード切替` 語彙を cleanup。`docs/EDITOR_HELP.md`、in-app help、MarkdownReference shortcuts は `F2 = command palette` と command palette / left nav / Reader surface モデルへ同期済み。
- New: Docs authority hygiene after active help cleanup を実施。`ROADMAP` の直近 done と `FEATURE_REGISTRY` FR-009 を現行ヘルプ / shortcut / Local Mod 境界へ同期し、旧 Focus panel 由来の設定導線、旧ガジェット件数表記、古い help authority 日付を現行正本から外した。
- New: Writing status visibility follow-up として `#writing-status-chip` に最終保存時刻を追加。保存済み時は `文字数: N · 保存済み HH:mm` を表示し、`data-last-saved-at` / `ZWWritingStatusChip.getState().lastSavedAt` で保存時刻を確認できる。非操作型・Reader / Floating memo lab 非表示契約は維持する。
- New: `docs/EDITOR_HELP.md` の stale settings route cleanup を実施。設定入口は `Ctrl+,` と command palette `open-settings`、操作場所は left nav の「詳細設定」カテゴリとして説明し、旧 Focus panel 由来の設定導線と旧 three-route framing を削除した。
- New: `docs/VISUAL_PROFILE.md` の stale UI-state wording cleanup を実施。Visual Profile は公開 UI 状態切替ではなく、テーマ・背景・フォント・余白・本文表示・作業シーンの一括適用として再同期。`profile.uiMode` は legacy/internal compatibility field として残し、runtime API / profile schema / UI / storage は未変更。
- New: Remote sync handoff を実施。`main` / `origin/main` は同期済み、ローカル作業ツリーは clean。別端末では `git pull --ff-only origin main` 後、`docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。
- New: Save / Resume Trust Audit を実施。起動、新規文書、Rich editing 入力、`#writing-status-chip` の `編集中`→`保存済み HH:mm`、Documents での現在文書発見、TXT / JSON 書き出し、閉じて再起動後の同一文書・本文復帰、Reader 往復後の本文と editor focus 復帰を確認。修正は Sections 空状態の実導線案内と Documents menu 一意化に限定し、Floating memo 保存モデル化、top chrome / toolbar 復活、Cloud sync、EPUB / DOCX、Gadget 追加には進んでいない。
- New: Export Trust Proof を実施。TXT download は `ZenWriterEditor.getEditorValue()` の canonical な現在文書状態と一致することを実ファイル読取で確認。JSON download は `zenwriter-v1`、`document.id`、`document.name`、`document.content`、`pages` を JSON.parse で確認し、JSON 読み込み UI roundtrip と explicit chapter `pages` roundtrip も確認。Reader 往復後の TXT / JSON 再書き出しも同内容を保持する。
- New: Remote sync handoff after Chapter Creation Daily Flow を実施。`a024340` 時点の product proof を restart anchor とし、別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。次候補は `First-use Save Help`、`Import Roundtrip Hardening`、`Rich Editing Heading Shortcut Decision`、stale spec reconciliation。
- New: First-use Save Help を実施。初回空状態 / Documents / writing status chip / 入出力 menu の短い補助だけで、本文と章構造はこの端末に自動保存され、保存状態は画面下、TXT/JSON 書き出しは外部退避、JSON 読み込みは戻す導線と読めるようにした。`JSON保存` は復活させず、Cloud sync / EPUB / DOCX / top chrome / export UI redesign へは進んでいない。
- New: Remote sync handoff after First-use Save Help を実施。`8770edd` 時点の product proof を restart anchor とし、別端末では `git pull --ff-only origin main` 後に `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。次候補は `Import Roundtrip Hardening`、`Rich Editing Heading Shortcut Decision`、stale spec reconciliation。
- Do not reopen: 旧 mode button 群、常用 top toolbar、上端 hover reveal、legacy handoff/runtime/health 文書。

## Historical Restart Route (superseded by the live block)

1. このファイルの **Snapshot**、**Latest Handoff**、**Document Map** を読む。
2. 挙動の境界は `docs/INVARIANTS.md`、UI 用語と手動確認形式は `docs/INTERACTION_NOTES.md` を読む。
3. 次スライスを選ぶときだけ `docs/USER_REQUEST_LEDGER.md` と `docs/ROADMAP.md` を読む。

## Historical Document Map

| 読みたいもの | ファイル |
|-------------|----------|
| 現在地・直近検証・再開方向 | `docs/CURRENT_STATE.md` |
| 不変条件・責務境界・テスト作法 | `docs/INVARIANTS.md` |
| UI 状態モデル・手動確認・報告形式 | `docs/INTERACTION_NOTES.md` |
| 現在有効な要求・次スライス候補 | `docs/USER_REQUEST_LEDGER.md` |
| 機能ロードマップ | `docs/ROADMAP.md` |
| ユーザー向け機能台帳 | `docs/FEATURE_REGISTRY.md` |
| 自動化責務境界 | `docs/AUTOMATION_BOUNDARY.md` |
| 起動手順 | `docs/APP_LAUNCH_GUIDE.md` |
| UI 表面・コントロール台帳 | `docs/UI_SURFACE_AND_CONTROLS.md` |
| WP-004 手動パック・監査 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

削除済みの旧再開・健康・カウンター文書は再開判断に使わない。

## Historical Verification Digest

### Command palette Markdown source dev gate

- Scope: Editor surface / command palette clarity. Markdown source remains an escape hatch for developer mode, but no longer appears as a normal command palette result for writers who cannot use it.
- Product behavior: `editor-surface-markdown` now uses the existing `devOnly` command gate and describes itself as a developer-mode source switch. `editor-surface-wysiwyg` remains the public Rich editing surface command.
- E2E proof: `e2e/command-palette.spec.js` verifies `Markdown ソース` search yields no Markdown source command when the developer-mode check is false, then verifies the command appears again when developer mode is true.
- Validation: `node --check js/command-palette.js`, `node --check e2e/command-palette.spec.js`, `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "Markdown source command"`.

### First-use Save Help

- Scope: 機能追加ではなく、初回または久しぶりのユーザーが保存モデルを短時間で理解できる補助文・aria・title を追加。
- Product help: status chip は `文字数: N · 編集中/保存済み` を保ちつつ aria/title で「本文はこの端末に自動保存」「保存状態はこの表示で確認」を補助。Documents は「本文と章構造はこの端末に自動保存」「保存状態は画面下」「TXT/JSON書き出しは外部退避」「JSON読み込みで戻せる」を 1 つの短文に集約。空状態は `+ 文書` から始めると自動保存されることを示す。
- Import/export wording: `入出力` menu は「書き出しは外部退避。JSON読み込みで戻せます。」を表示し、TXT / JSON export の title も外部退避として明記。`JSON保存` は使わない。
- E2E proof: `e2e/first-use-save-help.spec.js` で first-use empty state、document creation、Rich editing body、saved chip aria、Documents discovery、import/export wording、chapter-mode 2 章保持を確認。
- Validation: `node --check js/writing-status-chip.js`, `node --check js/gadgets-documents-hierarchy.js`, `node --check js/gadgets-documents-tree.js`, `node --check e2e/first-use-save-help.spec.js`, `npx playwright test e2e/first-use-save-help.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/export-trust.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/daily-writing-proof.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`, `npm run test:smoke`, `npm run lint:js:check`, `npm run build`, `npm run test:unit`, `git diff --check`, `git diff --cached --check`。
- Full E2E note: monolithic full E2E remains avoided because of known timeout history; use focused specs or shard/suite runs for total inspection.

### Remote sync handoff after First-use Save Help

- Product proof: `8770edd feat: clarify first-use save help`.
- Handoff docs: `docs/CURRENT_STATE.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/ROADMAP.md`, `docs/verification/2026-05-14/remote-sync-first-use-save-help-handoff.md`.
- Pre-handoff sync: `git pull --ff-only origin main` -> already up to date; `git status --short --branch` -> `## main...origin/main`; `git rev-list --left-right --count HEAD...origin/main` -> `0 0`.
- Restart route: `git pull --ff-only origin main` -> `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`. Use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only for next-slice selection.
- Next candidates: `Import Roundtrip Hardening`, `Rich Editing Heading Shortcut Decision`, stale spec reconciliation. First-use Save Help itself should not reopen unless a new failure appears.

### Chapter Creation Daily Flow

- Scope: prove the everyday long-form route, not just the presence of a chapter button. The covered path is `+ 新しい章` from Rich editing, chapter title/body separation, chapter switching, save/reload resume, Reader round trip, TXT/JSON export, and JSON import roundtrip.
- Chapter proof: `+ 新しい章` creates ChapterStore records from the public Sections route. Two chapters keep isolated bodies with Japanese text, symbols, blank lines, and unique tokens; switching through Sections restores the correct body and focus.
- Persistence proof: after explicit save and page reload, the same document name, two chapter records, chapter order, titles, and canonical Rich editing bodies are restored.
- Reader/export proof: Reader shows both chapter titles/bodies in order and returns focus to the editor. TXT export contains both chapter titles/bodies in order. JSON export parses as `zenwriter-v1`, keeps `document.name/content`, and has two `pages` entries with title/content/order/level/visibility. UI JSON import restores the two-chapter structure.
- Validation: `node --check js/chapter-list.js`, `node --check js/gadgets-sections-nav.js`, `node --check js/content-guard.js`, `node --check js/gadgets-documents-hierarchy.js`, `node --check js/modules/editor/EditorCore.js`, `node --check e2e/chapter-creation-daily-flow.spec.js`, `node --check e2e/sections-nav.spec.js`, `npx playwright test e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/sections-nav.spec.js -g "daily writing" --workers=1 --reporter=line`, `npx playwright test e2e/export-trust.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`.
- Full E2E note: monolithic full E2E remains avoided because of known timeout history; use focused specs or shard/suite runs for total inspection.

### Export Trust Proof

- Scope: Save / Resume Trust Audit の延長として、TXT / JSON download event だけでなく、実ファイル内容を読み取って現在文書状態との一致を確認。
- TXT proof: daily Rich editing 原稿の download file を `fs.readFile` し、`ZenWriterEditor.getEditorValue()` の canonical 値と一致すること、日本語・記号・改行を含む一意文字列が欠落しないことを確認。
- JSON proof: `.zwp.json` を `JSON.parse` し、`format: zenwriter-v1`、`document.id`、`document.name`、`document.content`、`pages` を確認。章あり文書では `pages[0..]` の title / content / order / level / visibility と、assembled `document.content` を確認。
- Import / Reader proof: JSON 読み込み UI で daily 原稿が復帰。explicit chapter JSON は `importProjectJSON` で 2 章が復元。Reader 往復後の TXT / JSON 再書き出しも current editor value と一致。
- Validation: `node --check js/storage.js`, `node --check e2e/export-trust.spec.js`, `npx playwright test e2e/export-trust.spec.js --workers=1 --reporter=line`, `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`, `npx playwright test e2e/daily-writing-proof.spec.js --workers=1 --reporter=line`, `npm run test:smoke`, `git diff --check`, in-app browser launch at `http://127.0.0.1:18080/index.html`。

### Save / Resume Trust Audit

- Remote prep: `git fetch --prune origin`, `git pull --ff-only origin main`, `git rev-list --left-right --count HEAD...origin/main` = `0 0` から開始。
- Observed flow: 起動 → `+ 文書` → Rich editing 入力 → `文字数: 146 · 編集中` → `文字数: 146 · 保存済み 05:09` → Documents で文書発見 → TXT / JSON 書き出し → page close/reopen → same `docId` / `Save Resume Audit 2026-05-13` / 本文復帰 → Reader 往復後 `#wysiwyg-editor` focus 復帰。
- Fixed: Sections 空状態は、Rich editing では `+ 新しい章`、Markdown ソース / 読み込み原稿では `# 見出し` が表示対象になることを明示。Documents の `入出力` / `管理` menu は category 往復後も 1 セットだけ残る。
- Validation: `node --check js/gadgets-sections-nav.js`, `node --check js/gadgets-documents-hierarchy.js`, `npx playwright test e2e/sections-nav.spec.js -g "見出しがない" --workers=1 --reporter=line`, `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`, `npm run test:smoke`, `git diff --check`。

### Historical remote sync handoff after Export Trust Proof

- Historical product proof: `372be1b test: prove export file contents`。現在の最新 product proof は `a024340 test: prove chapter creation daily flow`。
- Handoff docs: `docs/CURRENT_STATE.md`、`docs/USER_REQUEST_LEDGER.md`、`docs/ROADMAP.md`、`docs/verification/2026-05-13/remote-sync-export-trust-handoff.md`
- 再開手順: `git pull --ff-only origin main` → `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`。次スライス選定時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`。
- 当時の次候補だった `Chapter Creation Daily Flow` は `a024340` で完了済み。`First-use Save Help` も 2026-05-14 に完了済み。現在の次候補は `Import Roundtrip Hardening`、`Rich Editing Heading Shortcut Decision`、stale spec reconciliation。
- `git status --short --branch` → `## main...origin/main`
- `git rev-list --left-right --count HEAD...origin/main` → `0 0`

### Remote sync handoff after Chapter Creation Daily Flow

- 直近 product proof: `a024340 test: prove chapter creation daily flow`
- Local sync: `git fetch --prune origin` で `f1bdc8f..a024340` を取得し、`git pull --ff-only origin main` で fast-forward。
- 再開手順: `git pull --ff-only origin main` → `docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md`。次スライス選定時のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`。
- 当時の次候補だった `First-use Save Help` は 2026-05-14 に完了済み。現在の次候補は `Import Roundtrip Hardening`、`Rich Editing Heading Shortcut Decision`、stale spec reconciliation。章作成そのものは新規 FAIL がない限り reopen しない。
- `git status --short --branch` → `## main...origin/main`
- `git rev-list --left-right --count HEAD...origin/main` → `0 0`
- `npm run test:smoke` → pass
- `git diff --check` → pass

### VisualProfile stale UI-state wording cleanup

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `docs/VISUAL_PROFILE.md` から公開概念としての旧 UI-state wording を削除し、テーマ・背景・フォント・余白・本文表示・作業シーンの一括適用へ同期。
- `profile.uiMode` は legacy/internal compatibility field として文書上だけ再位置づけ。runtime API、profile schema、built-in profile、ユーザー保存導線、storage は未変更。
- `js/visual-profile.js` は comment / JSDoc のみ同期。
- `docs/verification/2026-05-11/visual-profile-ui-mode-wording-cleanup.md` を追加。
- `node --check js/visual-profile.js` → pass
- `docs/spec-index.json` JSON parse → pass
- VisualProfile stale wording guard → no matches
- `git diff --check` → pass

### EDITOR_HELP stale settings route cleanup

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `docs/EDITOR_HELP.md` の設定案内から旧 Focus panel 由来の設定導線と旧 three-route framing を削除。
- 設定入口は `Ctrl+,` と command palette `open-settings`、設定項目の操作場所は left nav の「詳細設定」カテゴリとして記述。
- Runtime、in-app help modal、MarkdownReference shortcuts、keybinding、settings modal、command palette、`docs/VISUAL_PROFILE.md` は未変更。
- `docs/verification/2026-05-10/editor-help-stale-settings-route-cleanup.md` を追加。
- `docs/spec-index.json` JSON parse → pass
- `docs/EDITOR_HELP.md` stale route guard → no matches
- `npm run test:smoke` → pass
- `git diff --check` → pass

### Writing status saved-time visibility

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `#writing-status-chip` は保存済み時に `文字数: N · 保存済み HH:mm` を表示する。
- `data-last-saved-at` と `ZWWritingStatusChip.getState().lastSavedAt` で最後に保存済みへ遷移した ISO 時刻を確認できる。
- Reader / Floating memo lab 表示中は引き続き hidden。chip は非操作型で、設定 UI / storage schema / loadout / Local Mod は未変更。
- `docs/verification/2026-05-10/writing-status-saved-time-visibility.md` を追加。
- `node --check js/writing-status-chip.js` → pass
- `npx playwright test e2e/accessibility.spec.js e2e/daily-writing-proof.spec.js --workers=1 --reporter=line --grep "writing status|daily writing"` → pass
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `docs/spec-index.json` JSON parse → pass
- `git diff --check` → pass

### Docs authority hygiene after active help cleanup

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰済み。
- `docs/ROADMAP.md` の header / 直近 done / docs authority note を active help cleanup 後の状態へ同期。
- `docs/FEATURE_REGISTRY.md` FR-009 を `F1 = help`、`F2 = command palette`、command palette / left nav / Reader surface / Local Gadget 語彙へ同期。
- 旧 Focus panel 由来の設定入口、旧 `docs/GADGETS.md` 件数表記、古い help authority 日付は現行 FR-009 から除外。
- Runtime、keybinding、Local Mod、loadout、manifest schema は未変更。
- `docs/verification/2026-05-10/docs-authority-hygiene-after-active-help-cleanup.md` を追加。
- `docs/spec-index.json` JSON parse → pass
- active authority stale wording guard → no matches
- `git diff --check` → pass

### Active help mode wording cleanup

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `docs/EDITOR_HELP.md` の `表示モード（UIモード）` / `Normal/Focus` 誘導を、command palette / left nav / Reader surface / Local Gadget の説明へ置換。
- `js/gadgets-help.js` の in-app help は `F2 = command palette` と画面導線 section へ同期。
- `js/gadgets-markdown-ref.js` の shortcut description から `UIモード切替` / `通常モードに戻る` を削除。
- UI 挙動、keybindings、Local Mod、loadout、runtime API は未変更。
- `docs/verification/2026-05-10/active-help-mode-wording-cleanup.md` を追加。
- `node --check js/gadgets-help.js js/gadgets-markdown-ref.js` → pass
- `docs/spec-index.json` JSON parse → pass
- active help stale wording guard → no matches
- `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line --grep "F2"` → pass
- `git diff --check` → pass

### Local Gadget Mod boundary closeout

- `MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件を Local Gadget Mod migration 済み set として固定。
- `choice` は command plugin のまま維持し、gadget migration target ではない。
- StoryWiki / LinkGraph / Images は preserve / contextual。LoadoutManager / GadgetPrefs は admin hide。TextEffects は contextual merged gadget。
- 追加 migration は standing next action にしない。新規候補は体感摩擦、静的監査で見つかった単一候補、または Mod-first gate を満たす明確な理由がある時だけ別スライスで扱う。
- Runtime API / manifest schema / loadout schema / gadget wrappers は未変更。
- `docs/verification/2026-05-10/local-gadget-mod-boundary-closeout.md` を追加。
- `docs/spec-index.json` JSON parse → pass
- `git diff --check` → pass

### PomodoroTimer Local Gadget Mod migration

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `api.gadgets.registerSettings()` を追加し、Local Gadget Mod が main gadget と settings UI を同じ Mod 境界へ登録できるようにした。
- `PomodoroTimer` の built-in wrapper / settings UI を `js/plugins/pomodoro-timer-gadget/index.js` へ移動し、`js/gadgets-pomodoro.js` は script order 互換の no-op にした。
- `js/plugins/manifest.json` に disabled `pomodoro-timer-gadget` entry を追加。
- built-in loadout presets と legacy normalization から `PomodoroTimer` を default 除外へ更新。
- timer engine、`window.ZenWriterPomodoro`、Pomodoro storage、HUD notification、Local Mod enable storage、loadout schema は未変更。
- `docs/GADGETS.md` の built-in 一覧を 25 件へ更新し、`PomodoroTimer` を Local Gadget Mod migration 済みとして別記。
- `node --check js/plugin-api.js js/gadgets-pomodoro.js js/gadgets-loadouts.js js/gadgets-utils.js js/loadouts-presets.js js/command-palette.js js/plugins/pomodoro-timer-gadget/index.js` → pass
- `js/plugins/manifest.json` / `docs/spec-index.json` JSON parse → pass
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js e2e/pomodoro.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → pass
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `git diff --check` → pass

### PomodoroTimer Mod feasibility audit

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- この監査は `PomodoroTimer` Local Gadget Mod migration により superseded。
- wrapper は `js/gadgets-pomodoro.js`、engine / storage / HUD notification は `js/pomodoro-timer.js`。
- current default placement は built-in preset の assist group。`e2e/pomodoro.spec.js` も default visible 前提。
- blocking point: 現行 `api.gadgets` は `registerSettings` を公開していない。settings UI なしの partial migration は採用しない。
- 後続実装で `api.gadgets.registerSettings(name, renderSettings)` を Plugin API に追加し、`PomodoroTimer` は完全 Mod 化した。
- `docs/spec-index.json` JSON parse → pass
- `git diff --check` → pass

### HUDSettings Local Gadget Mod migration

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `HUDSettings` の built-in wrapper を `js/gadgets-hud.js` から外し、`js/plugins/hud-settings-gadget/index.js` へ移動。
- `js/plugins/manifest.json` に disabled `hud-settings-gadget` entry を追加。
- built-in loadout presets と legacy normalization から `HUDSettings` を hide-by-default / default 除外へ更新。
- HUD 本体、`ZenWriterHUD`、autosave HUD、command palette HUD 表示、Local Mod runtime API、loadout schema は未変更。
- `docs/GADGETS.md` の built-in 一覧を 26 件へ更新し、`HUDSettings` を Local Gadget Mod migration 済みとして別記。
- `node --check js/gadgets-hud.js js/gadgets-loadouts.js js/gadgets-utils.js js/loadouts-presets.js js/plugin-manager.js js/plugin-api.js js/gadgets-plugin-manager.js js/plugins/sample-word-count-gadget/index.js js/plugins/markdown-preview-gadget/index.js js/plugins/hud-settings-gadget/index.js` → pass
- `js/plugins/manifest.json` / `docs/spec-index.json` JSON parse → pass
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js e2e/decorations.spec.js --workers=1 --reporter=line` → 35 passed
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `git diff --check` → pass

### MarkdownPreview Local Gadget Mod migration

- `.serena/project.yml` の Serena template churn は tool noise として HEAD へ復帰。
- `MarkdownPreview` の built-in wrapper を `js/gadgets-editor-extras.js` から外し、`js/plugins/markdown-preview-gadget/index.js` へ移動。
- `js/plugins/manifest.json` に disabled `markdown-preview-gadget` entry を追加。
- preview engine、`ZenWriterEditor.togglePreview()`、command palette、Reader、Markdown source、loadout schema、Local Mod runtime API は未変更。
- `docs/GADGETS.md` の built-in 一覧を 27 件へ更新し、`MarkdownPreview` を Local Gadget Mod migration 済みとして別記。
- `node --check js/gadgets-editor-extras.js js/plugin-manager.js js/plugin-api.js js/gadgets-plugin-manager.js js/plugins/sample-word-count-gadget/index.js js/plugins/markdown-preview-gadget/index.js` → pass
- `js/plugins/manifest.json` / `docs/spec-index.json` JSON parse → pass
- `npx playwright test e2e/plugin-manager.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` → 20 passed
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `git diff --check` → pass

### C2 Gadget Mod boundary audit

- `docs/verification/2026-05-09/gadget-mod-boundary-audit.md` を追加。
- 28 gadget を `built-in retain` / `mod candidate` / `preserve / quarantine` / `admin hide` で分類。
- 次実装候補は `MarkdownPreview` の Local Gadget Mod migration に固定。
- runtime API、`js/plugins/manifest.json`、sample Mod、loadout、既存 gadget registration は未変更。
- `git diff --check` → pass
- `docs/spec-index.json` JSON parse → pass

### Local Gadget Mod workflow 整理

- `docs/PLUGIN_GUIDE.md` を Local Gadget Mod 開発ワークフローの正本に整理。
- `docs/specs/spec-local-gadget-mods.md` に判断ゲートと正式開発インターフェースを追記。
- `docs/GADGETS.md` の追加手順を Mod-first に変更し、built-in は例外ルートとして明記。
- `docs/design/PLUGIN_SYSTEM.md` は背景設計 / deferred の位置付けへ整理。
- runtime API、`js/plugins/manifest.json`、sample Mod、既存 28 gadget 配置は未変更。
- `git diff --check` → pass
- `docs/spec-index.json` JSON parse → pass

### Local Gadget Mod MVP

- `js/plugins/manifest.json` は `choice` と disabled sample `sample-word-count-gadget` を持つ。
- `PluginManager` gadget は settings modal の `ローカルMod` で manifest plugin を一覧し、`ZWPluginManager.setEnabled(id, bool)` で enable map を保存する。
- `api.gadgets.register()` で登録された Mod gadget は `source: 'plugin'` / `pluginId` を付与される。
- enabled Mod gadget は current built-in loadout に列挙されていなくても、指定 group の候補として表示される。
- 正本仕様: `docs/specs/spec-local-gadget-mods.md`
- `node --check`（`js/plugin-manager.js` / `js/plugin-api.js` / `js/gadgets-core.js` / `js/gadgets-plugin-manager.js` / `js/plugins/sample-word-count-gadget/index.js`）→ pass
- `js/plugins/manifest.json` / `docs/spec-index.json` JSON parse → pass
- `npm run test:smoke` → pass
- `npx playwright test e2e/plugin-manager.spec.js --workers=1 --reporter=line` → 3 passed
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `git diff --check` → pass

### post-A3 restart consolidation

- `git fetch --prune origin` → pass
- `git rev-list --left-right --count HEAD...origin/main` → `0 0`
- `git log -1 --oneline --decorate` → `db3b3df (HEAD -> main, origin/main, origin/HEAD) feat: fix floating memo as palette experiment`
- 旧 start report の `236b59c feat: prove floating memo daily flow` は A2 proof commit であり、A3 closeout 前の状態。
- `git diff --name-status` は `.serena/project.yml` のみ。差分は Serena 設定テンプレコメント更新で製品挙動に無関係なため HEAD へ復帰。
- `npm run test:smoke` → pass

### A3 Floating memo command palette限定実験

- `浮遊メモ実験` command は command palette からだけ開ける A3 正規入口。説明は「保存されない隔離実験 overlay を開閉」に固定。
- `?memoLab=1` は E2E / developer 用の直接起動 hook として維持し、ユーザー向け導線とは扱わない。
- 保存モデル、設定、正式 Gadget 化、loadout preset、Documents / Sections / autosave 接続は追加しない。
- `node --check js/floating-memo-field.js` / `node --check js/command-palette.js` → pass
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npx playwright test e2e/daily-writing-proof.spec.js e2e/floating-memo-lab.spec.js --workers=1 --reporter=line` → 9 passed
- `npx playwright test e2e/command-palette.spec.js --workers=1 --reporter=line` → 17 passed

### A2 保存安心感 / daily writing proof

- `e2e/daily-writing-proof.spec.js` を追加。起動→Rich editing→Sections→writing status→Reader→Floating memo lab→editor focus 復帰を 1 flow で確認する。
- status chip は通常執筆中に visible、入力後 `編集中`、idle 後 `保存済み`。Reader / Floating memo lab 表示中は hidden。
- Reader 終了後と Floating memo lab 終了後は `#wysiwyg-editor` または `#editor` へ focus 復帰する。
- Floating memo lab は引き続き dev-only / experimental overlay。editor / chapter / autosave 本流、正式 Gadget、loadout には接続しない。
- `node --check js/floating-memo-field.js` / `node --check scripts/clean-build-outputs.js` → pass
- `git diff --check` → pass（`.gitignore` LF/CRLF warning のみ）
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npx playwright test e2e/daily-writing-proof.spec.js e2e/floating-memo-lab.spec.js --workers=1 --reporter=line` → 9 passed
- Closeout: `.serena/project.yml` は HEAD へ復帰。`.playwright-mcp/` と root の visual review PNG は `.gitignore` で除外。`scripts/clean-build-outputs.js` は正式追加対象として維持。

### Build output hygiene

- `dist/` は `npm run build` の Web / HTML 直接起動用出力、`build/` は Electron builder の正規出力として整理。
- 旧 lock workaround の `build-new/` / `build-session103`〜`build-session109` を削除。`build-friction/` は現在存在しないが、一時退避物として `npm run clean:builds` の対象にした。
- `scripts/clean-build-outputs.js` を追加し、`npm run clean:builds` は legacy workaround output だけ、`npm run clean:builds:all` は `dist/` / `build/` も含む生成物を削除する。

### A1 Writing UX map + Floating memo reframe

- Floating memo lab は dev-only / experimental overlay のまま維持。保存モデル、正式機能化、gadget registration、loadout、command palette 導線は未変更。
- Writing UX 階層は Editor canvas を最上位に置き、保存/文字数 status、Documents/Sections、on-demand Gadgets、experimental memo の順で主従を整理した。
- 背景 memo は z に応じて `--memo-visual-scale` / `--memo-depth-blur` / `--memo-shell-shadow` を更新しつつ、visible title / state / `DRAG` / textarea 枠を持たない read-only fragment として表示する。
- foreground / dragging memo は scale 1.08 / 1.10、blur なし、強め shadow。foreground だけ borderless textarea を表示し、既定サンプルでは明示 scrollbar を出さない。
- returning は吸着を少し強め、z 方向の戻りを滑らかにした。flutter 最大振幅は抑え、`prefers-reduced-motion` では flutter と blur を無効のまま維持。
- `node --check js/floating-memo-field.js` → pass
- `npx playwright test e2e/floating-memo-lab.spec.js --workers=1 --reporter=line` → 8 passed
- Visual check: desktop / mobile `/index.html?memoLab=1` で memo のカード型 chrome が消え、通常 `/index.html` の Editor canvas は現行の静かな初期表示を維持
- `git diff --check` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass

### B3 TextEffects merge

- `FontDecoration` / `TextAnimation` は `TextEffects` へ統合。登録 gadget は 29 → 28。
- 旧 loadout の `FontDecoration` / `TextAnimation` は `TextEffects` へ migration し、重複は 1 件へ畳む。
- VN loadout では `TextEffects` を維持し、通常 preset では `MarkdownPreview` と同じく標準導線から下げる。
- `git diff --check` → pass
- `node --check js/gadgets-editor-extras.js js/gadgets-loadouts.js js/gadgets-utils.js js/loadouts-presets.js js/gadgets-core.js` → pass
- `npx playwright test e2e/gadgets.spec.js --grep "loadout normalization migrates legacy text effect gadgets|built-in loadouts keep stable gadget placement|built-in loadouts hide low-frequency admin gadgets by default" --workers=1 --reporter=line` → 3 passed
- `npx playwright test e2e/gadgets.spec.js --workers=1 --reporter=line` → 15 passed
- `npm run lint:js:check` → pass
- `npm run build` → pass

### Phase 1 Story Wiki / left nav regression fix

- `.serena/project.yml` は Serena テンプレコメント更新のみの tool noise として HEAD へ戻し、製品差分から外した。
- left nav category の root 戻りは、visual `#sidebar-nav-back-rail` の pointer capture ではなく sidebar 左列の非操作領域クリックで扱う。button / input / link / tree item / gadget controls は `event.composedPath()` で守る。
- Story Wiki full mode は `data-swiki-full-open` を設定し、sidebar を viewport 幅へ広げる。full render 時は containing gadget の collapsed / hidden 状態も解除する。
- `git diff --check` → pass
- `node --check js/electron-bridge.js js/gadgets-editor-extras.js js/gadgets-loadouts.js js/loadouts-presets.js js/settings-manager.js js/sidebar-manager.js js/story-wiki.js` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npx playwright test e2e/wiki.spec.js --grep "create new wiki entry via dialog" --workers=1 --reporter=line` → pass
- `npx playwright test e2e/wiki-graph.spec.js --grep "display backlinks in entry detail pane" --workers=1 --reporter=line` → pass
- `npx playwright test e2e/wiki.spec.js e2e/wiki-graph.spec.js e2e/pomodoro.spec.js --workers=1 --reporter=line` → 36 passed
- `npx playwright test e2e/gadgets.spec.js e2e/editor-settings.spec.js e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 68 passed

### Phase 0 closeout / docs drift cleanup

- `.serena/project.yml` 差分は製品挙動に無関係な Serena 設定テンプレート更新として revert 済み。
- `docs/verification/2026-04-29/electron-manual-confirmation-prep.md` は package 手動確認の準備記録として追加。
- `git diff --check` → pass
- `node --check js/electron-bridge.js js/gadgets-editor-extras.js js/gadgets-loadouts.js js/loadouts-presets.js js/settings-manager.js js/sidebar-manager.js` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npx playwright test e2e/gadgets.spec.js e2e/editor-settings.spec.js e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 68 passed
- `npx playwright test e2e/wiki.spec.js e2e/wiki-graph.spec.js e2e/pomodoro.spec.js --workers=1 --reporter=line` → 34 passed / 2 failed
  - `wiki.spec.js` create dialog: `#sidebar-nav-back-rail` intercepts `.swiki-btn-new` click
  - `wiki-graph.spec.js` backlinks detail: `.swiki-detail-backlinks` remains hidden
  - Pomodoro tests passed. The two failures were resolved by Phase 1 above.

### gadget mainstream protection cleanup

- `node --check js/gadgets-editor-extras.js js/gadgets-loadouts.js js/loadouts-presets.js js/gadgets-core.js` → pass
- loadout normalization smoke → `novel-standard` edit は `ChoiceTools` のみ、`vn-layout` edit は `Images` / `ChoiceTools` / `TextAnimation`（B3 後は `TextEffects` へ移行）
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npx playwright test e2e/gadgets.spec.js e2e/editor-settings.spec.js --workers=1 --reporter=line` → 33 passed
- `npx playwright test e2e/wiki.spec.js e2e/wiki-graph.spec.js e2e/pomodoro.spec.js --workers=1 --reporter=line` → 34 passed / 2 failed
  - `wiki.spec.js` create dialog: `#sidebar-nav-back-rail` intercepts `.swiki-btn-new` click
  - `wiki-graph.spec.js` backlinks detail: `.swiki-detail-backlinks` remains hidden
  - Pomodoro tests in the suite passed. The two failures were outside the loadout cleanup files and were handled as a separate Phase 1 left-nav / Story Wiki regression slice.

### right window drag handle invisible-drag fix

- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "drag handle|right window controls"` → 2 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 35 passed
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run electron:build` → 既存 `Zen Writer` process を停止して DLL lock を回避 → pass
- `npm run app:open:package` → pass

### right window controls / top chrome retirement

- 詳細: `docs/verification/2026-04-28/right-window-controls-top-chrome-retirement.md`
- static active source check (`top-chrome-trigger` / `top-chrome-handle` / `show-top-chrome` / visible top chrome CSS / legacy top buttons) → no active source refs
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "right window controls|F2 shortcut|retired top chrome|command palette hides"` → 4 passed
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run test:unit` → 11 passed
- `npm run test:e2e:ui -- --workers=1 --reporter=line` → 49 passed
- `git diff --check` → pass（既存 `e2e/ruby-text.spec.js` CRLF warning のみ）
- `npm run electron:build` → pass（直前に開いていた packaged app の DLL lock は停止後に再実行して解消）
- `npm run app:open:package` → pass

### left chrome / left nav refinement

- 詳細: `docs/verification/2026-04-28/left-chrome-left-nav-refinement.md`
- static selector check (`sidebar-nav-back-rail` / `move-diagonal-2` / `LEFT_ROOT_RAIL_CLOSE_BUFFER_PX`) → pass
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "frameless Electron window grip|Electron top chrome owns|left nav category back rail|root left nav is hidden"` → 4 passed
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run test:unit` → 11 passed
- `npm run test:e2e:ui -- --workers=1 --reporter=line` → 49 passed
- `git diff --check` → pass（既存 CRLF/LF warning のみ）
- `npm run electron:build` → first run は実行中 packaged app の DLL lock で fail。既存 `Zen Writer` process を停止して再実行 → pass
- `npm run app:open:package` → pass

### main-hub-panel dead code cleanup

- 詳細: `docs/verification/2026-04-28/main-hub-panel-dead-code-cleanup.md`
- `rg -n "#main-hub-panel|\\.main-hub-panel" css js index.html` → no active source refs
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run test:unit` → 11 passed
- `npm run test:e2e:ui -- --workers=1 --reporter=line` → 49 passed
- `git diff --check` → pass
- Active source comments no longer imply `MainHubPanel` exists. Historical docs/spec mentions remain as prior audit context.

### comprehensive inspection

- 詳細: `docs/verification/2026-04-28/comprehensive-inspection.md`
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run test:unit` → 11 passed
- `npm run test:e2e:ui -- --workers=1 --reporter=line` → 49 passed
- `npm run test:e2e:stable -- --workers=1 --reporter=line` → 33 passed
- `npx playwright test e2e/accessibility.spec.js e2e/ui-mode-consistency.spec.js e2e/floating-memo-lab.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` → 65 passed
- `git diff --check` → pass
- `#main-hub-panel` / `.main-hub-panel` は DOM 実体なし。CSS と UI editor selector の orphan 参照は後続の cleanup で解消済み
- `LoadoutManager` / `GadgetPrefs` は削除ではなく hide-by-default 維持が妥当。今回の点検で即削除できる参照ゼロ gadget は見つからない
- Daily writing flow / Floating memo lab は targeted E2E green。追加修正ではなく次スライス選定へ進める

### post-push planning prep

- `git push origin main` → `2a322e7..796b8be main -> main`
- `git fetch --all --prune` 後、`main` / `origin/main` は同期
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run test:unit` → 11 passed
- `npm run test:e2e:ui -- --workers=1 --reporter=line` → 49 passed
- `npm run test:e2e:stable -- --workers=1 --reporter=line` → 33 passed
- `git diff --check` → pass
- `npm run test:e2e -- --workers=1 --reporter=line` → 15分 timeout。assertion failure は未取得。総点検時は shard / suite 分割で実行する
- 次プラン作成の現行入力は `Current Priorities` と `USER_REQUEST_LEDGER` の次スライス候補を優先する

### writing status / memo lab / gadget pruning

- `#writing-status-chip` を追加。既存 word count 計算と保存イベントを使い、`文字数: N · 編集中/保存済み` を表示
- Reader / Floating memo lab 表示中は writing status chip を隠す
- Floating memo lab open 時に command palette 互換 surface を hide、Reader overlay を exit。close 後は editor / Rich editing へ focus 復帰
- `GadgetPrefs` を built-in loadout の hide-by-default 対象へ追加。登録と custom loadout 経路は維持
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `git diff --check` → pass
- `npx playwright test e2e/accessibility.spec.js e2e/ui-mode-consistency.spec.js e2e/floating-memo-lab.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` → 65 passed

### local resume prep / smoke hygiene

- `git fetch --all --prune` → `origin/main` を `2a322e7` へ更新
- `git pull --ff-only` → `24b422e..2a322e7` を fast-forward
- `scripts/dev-check.js` の stale `HANDOVER.md` / `main-hub-panel` 前提を現行 `AGENTS.md` / `docs/CURRENT_STATE.md` / floating surfaces へ同期
- `.github/ISSUE_TEMPLATE/config.yml` の `HANDOVER.md` contact link を `docs/CURRENT_STATE.md` へ更新
- `npm run test:smoke` → pass
- `npm run lint:js:check` → pass
- `git diff --check` → pass
- 事前確認: `npm run build` → pass、`npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js --workers=1 --reporter=line` → 42 passed

### frameless window grip narrow fix

- `#electron-window-grip` を Electron-only の通常時 window move affordance として追加
- `npm run lint:js:check` → pass
- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js --workers=1 --reporter=line` → 42 passed
- `npm run build` → pass
- `npm run electron:build` → pass
- packaged/CDP + native mouse proof → PASS: grip center から frameless window が `(79, 80)` → `(185, 120)` へ移動
- `git diff --check` → pass
- 詳細: `docs/verification/2026-04-27/frameless-window-grip-narrow-fix.md`

### UI label consistency sweep

- `npm run lint:js:check` → pass
- `npx playwright test e2e/ui-label-consistency.spec.js e2e/command-palette.spec.js e2e/wiki.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` → 51 passed
- `npm run lint:js:check && npx playwright test e2e/ui-label-consistency.spec.js e2e/editor-settings.spec.js --workers=1 --reporter=line` → 21 passed
- `npm run lint:js:check && git diff --check` → pass（`.gitignore` CRLF warning のみ）
- Documents action lanes は維持しつつ、Outline `+ 構成プリセット`、StoryWiki `+ Wikiページ`、PrintSettings `TXT書き出し`、VisualProfile `プロファイル適用` / `プロファイル保存` / `プロファイル削除`、LoadoutManager `ロードアウト保存` / `ロードアウト適用` / `ロードアウト削除` を E2E で固定
- 詳細: `docs/verification/2026-04-27/ui-label-consistency-sweep.md`

### writing workflow friction sweep

- `npm run lint:js:check` → pass
- `npx playwright test e2e/gadgets.spec.js e2e/sections-nav.spec.js --workers=1 --reporter=line` → 24 passed
- `npx playwright test e2e/sections-nav.spec.js e2e/command-palette.spec.js e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 57 passed
- `npx playwright test e2e/sidebar-layout.spec.js e2e/sidebar-writing-focus.spec.js --workers=1 --reporter=line` → 16 passed
- `npm run build` → pass
- `npx electron-builder --win --dir --config.directories.output=build-friction` → pass（通常 `npm run electron:build` は既存 `build/win-unpacked/resources/app.asar` の外部 lock で上書き不可）
- packaged/CDP friction proof → PASS 12/12: left nav root hidden、left edge hover fade-in、title anchor display-only、back icon root、Rich / Markdown source / ChapterStore の空タイトル章作成、gadget slider/drag handle 分離、`LoadoutManager` built-in default 除外、Reader read-only 表示
- 詳細: `docs/verification/2026-04-27/writing-workflow-friction-sweep.md`

### Documents action lanes

- `npm run lint:js:check` → pass
- `npx playwright test e2e/content-guard.spec.js e2e/editor-settings.spec.js --workers=1 --reporter=line` → 29 passed / 1 skipped
- `#new-document-btn` は `+ 文書`、`#new-folder-btn` は `+ フォルダ`、`#documents-save-current-btn` は現在本文保存、`#documents-io-menu-btn` は `TXT書き出し` / `JSON書き出し` / `JSON読み込み`、`#documents-manage-menu-btn` は `スナップショット復元` / `複数選択` を担当

### daily writing narrow fix / Editor surface 整理

- `npm run lint:js:check` → pass
- `npx playwright test e2e/sections-nav.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → 26 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "session 129"` → 2 passed
- `npm run build` → pass
- `npm run electron:build` → pass
- packaged/CDP phase 1 → PASS: initial Rich editing / visible top surface なし、`sections` の `+ 新しい章`、Rich editing で H2・Markdown 保存値・Sections tree 同期、command palette 保存 HUD `保存しました`、Reader surface、Markdown source escape hatch
- packaged/CDP phase 2 → PASS: app restart 後の proof doc / 本文 / Rich editing 復元、Reader 再表示、proof doc cleanup、前回 current doc restore
- Follow-up: writing workflow friction sweep で `+ 新しい章` は保存値に `新しい章` を入れず、空タイトル + `章タイトル未設定` placeholder で開始する現行仕様へ更新済み
- `git diff --check` → pass
- 詳細: `docs/verification/2026-04-27/daily-writing-workflow-proof.md`

### daily writing workflow proof

- `npm run lint:js:check` → pass
- packaged `build/win-unpacked/Zen Writer.exe --remote-debugging-port=9222` → CDP 補助で日常執筆導線を確認
- PASS: visible top surface なし / Rich editing 初期状態、新規 doc `Workflow Proof 2026-04-27`、H2 2件 + 段落入力、`sections` 表示、セクション移動後の本文保持、再起動後の current doc / 本文復元、Reader 表示、`編集に戻る`
- Initial FAIL → fixed: public `sections` で見える `新しい章` / `追加` affordance がない。Windows Edge + local web でも同じで packaged 固有差分ではない
- Initial FAIL → fixed: command palette の `保存（手動・即時）` は保存されるが `.mini-hud` が表示されない。Windows Edge + local web でも同じで packaged 固有差分ではない
- Resolved: 文字数・保存状態は `#writing-status-chip` が Reader / Floating memo lab 非表示時に担う
- 詳細: `docs/verification/2026-04-27/daily-writing-workflow-proof.md`

### unified shell packaged closeout

- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run electron:build` → first attempt hit a stale packaged DLL lock; after stopping `Zen Writer.exe`, pass
- `npm run app:open:package` → opened packaged `build/win-unpacked/Zen Writer.exe`
- Historical packaged/CDP closeout → PASS: pre-retirement top seam/handle cleanup と left nav root→category→root は確認済み。visible top chrome surface は 2026-04-28 の right window controls slice で廃止済み
- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → 52 passed

### session 129

- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "session 129"` → 2 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 29 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → 52 passed
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run electron:build` → pass after stopping stale packaged process that held DLL locks
- sentinel check / `npm run app:open` → green

### canonical doc cleanup

- `git diff --check` → pass
- `docs/spec-index.json` JSON parse → pass
- `docs/spec-index.json` の `status: done` かつ missing file entry → none
- active docs の stale restart refs scan → none
- active docs の stale UI wording scan → none

### docs hygiene hardening

- `RECOMMENDED_DEVELOPMENT_PLAN.md` / `VERIFICATION_CHECKLIST.md` / `workflow-profile.md` → 削除済み。旧 planning / checklist / profile が報告形式や次作業選定を固定化する経路を断つ。2026-05-04 再確認で `workflow-profile.md` の現行レーンは SP-061/SP-074/SP-079 の旧進捗だったため復元しない。残す価値のある ContentGuard / VisualProfile / E2E 注意は既存 specs・verification・invariants 側を正とする
- `MANUAL_TEST_GUIDE.md` / `EDITOR_HELP.md` / `GADGETS.md` / `ARCHITECTURE.md` / `spec-sections-navigation.md` を統合シェル UI 語彙へ同期
- `git diff --check` → pass（Git が既存 `e2e/ui-mode-consistency.spec.js` の CRLF/LF warning を表示）
- `docs/spec-index.json` JSON parse → pass
- active docs の blocking stale UI wording scan → none（superseded stub / history / explicit “復活させない” 文脈は除外）

## Historical Priorities Snapshot (reference only)

| 優先 | テーマ | 内容 | Actor |
|------|--------|------|-------|
| Done | Right window controls / top chrome retirement | visible top chrome surface を廃止し、F2 / Electron menu は command palette へ再割当。最小化・最大化/復元・閉じるは右上 hover island へ移動 | assistant / Electron shell |
| Done | Left chrome / left nav refinement | Electron grip を初期透明 hover reveal に変更し、category-only back rail と root rail dismiss 同期を追加。packaged build/open まで pass | assistant / affected UI surface |
| Done | `main-hub-panel` dead code cleanup | DOM 実体なしの CSS / UI editor selector / active source comment を削除済み。旧前提の再混入防止チェックも pass | assistant |
| Done | Phase 1 Story Wiki / left nav regression fix | back rail の click interception と Story Wiki backlinks hidden を局所修正。`wiki+wiki-graph+pomodoro` は 36 passed | assistant / Story Wiki + left nav |
| Done | B3 first merge candidate | `FontDecoration` / `TextAnimation` を `TextEffects` へ統合。旧 loadout 名は migration で維持 | assistant / gadget UX |
| Done | 無重力メモ visual iteration | dev-only overlay のまま、状態別 scale / depth blur / shadow、foreground 本文可読性、returning の柔らかい戻りを調整済み | assistant / memo overlay |
| Done | 無重力メモ daily writing proof | 起動→Rich editing→セクション→Reader→memo lab 開閉の短い自動シナリオで、status chip と editor focus 復帰を確認済み | assistant / writing UX |
| Done | 無重力メモ A3 command palette限定実験 | `浮遊メモ実験` は command palette からだけ開ける保存されない隔離実験 overlay として固定。正式化・保存・設定・Gadget・loadout 接続は未実施 | assistant / memo overlay |
| Done | Gadget usefulness audit | 登録 gadget を `core / useful-default / advanced-hide / duplicate / delete-candidate` に分類し、削除ではなく標準導線から下げる方針を採用 | assistant / gadget UX |
| Done | Default loadout cleanup | `MarkdownPreview` / 非VN `TextEffects` を標準 preset から外し、custom loadout の明示利用は維持 | assistant / loadout UX |
| Done | Local Gadget Mod workflow整理 | `PLUGIN_GUIDE` を開発導線の正本にし、`GADGETS` / `spec-local-gadget-mods` / `PLUGIN_SYSTEM` の役割を分離。runtime API と既存 gadget 配置は未変更 | assistant / gadget docs |
| Done | C2 Gadget Mod boundary audit | 28 gadget を read-only で分類し、最初の実装候補を `MarkdownPreview` に固定。コード削除・manifest・loadout 変更は未実施 | assistant / gadget UX |
| Done | `MarkdownPreview` Local Mod migration | preview engine は残し、built-in gadget wrapper だけを `markdown-preview-gadget` Local Mod へ移動。manifest 既定は disabled | assistant / gadget UX |
| Done | `HUDSettings` Local Mod migration | HUD 本体は残し、built-in gadget wrapper だけを `hud-settings-gadget` Local Mod へ移動。manifest 既定は disabled | assistant / gadget UX |
| Done | `PomodoroTimer` Local Mod migration | 小説執筆の基盤ではないため標準 assist から外し、timer UI / settings UI だけを `pomodoro-timer-gadget` Local Mod へ移動。engine / storage / HUD notification は維持 | assistant / gadget UX |
| Done | Gadget Mod migration lane closeout | Local Mod 化済み 3 件と built-in retain / preserve / admin hide 境界を固定。追加候補探索は standing next action にしない | assistant / gadget UX |
| Done | Active help mode wording cleanup | active help / shortcut resources の旧 `Normal / Focus / 表示モード切替` 誘導を、command palette / left nav / Reader surface 語彙へ同期 | assistant / active help |
| Done | Docs authority hygiene after active help cleanup | `ROADMAP` と `FEATURE_REGISTRY` FR-009 を active help cleanup 後の現行 authority へ同期。runtime は未変更 | assistant / docs authority |
| Done | Writing status saved-time visibility | `#writing-status-chip` に `保存済み HH:mm` と `data-last-saved-at` を追加。非操作型・Reader/Floating memo lab 非表示契約は維持 | assistant / writing UX |
| Done | EDITOR_HELP stale settings route cleanup | active help SSOT の旧 Focus panel 由来設定導線を削除し、`Ctrl+,` / command palette / left nav 詳細設定カテゴリへ同期 | assistant / docs authority |
| Done | VisualProfile stale UI-state wording cleanup | `docs/VISUAL_PROFILE.md` を公開 UI 状態切替ではなく、テーマ・背景・フォント・余白・本文表示・作業シーンの一括適用へ同期。runtime は未変更 | assistant / selected docs |
| Done | Save / Resume Trust Audit | 起動→新規文書→Rich editing 入力→保存済み chip→Documents 発見→再起動復帰→TXT / JSON download event→Reader 往復を PASS。修正は Sections 空状態案内と Documents menu 一意化に限定 | assistant / writing trust |
| Done | Export Trust Proof | TXT / JSON download の実ファイル内容を読み取り、TXT は current editor value、JSON は `document.id/name/content/pages` と chapter pages roundtrip を確認。Reader 往復後の再書き出しも PASS | assistant / export trust |
| Done | Chapter Creation Daily Flow | 章作成を含む毎日導線を、`+ 新しい章`→本文入力→保存→再開→Reader→TXT/JSON 書き出し→JSON import roundtrip まで固定済み。新規 FAIL がない限り章作成そのものは reopen しない | assistant / writing trust |
| Done | First-use Save Help | 初回空状態、Documents、status chip、入出力 menu に短い補助を追加し、保存モデルと外部退避導線を初見でも読めるようにした。操作面や保存方式は増やしていない | assistant / first-use UX |
| Done | Import Roundtrip Hardening | JSON 読み込みを保存前正規化へ移し、失敗時不変、既存文書衝突 suffix、legacy pages-only、章順序・level・visibility 正規化を E2E で固定 | assistant / import trust |
| Done | Rich Editing Heading Shortcut Decision | 限定 typed trigger として採用・実装済み。Rich editing 通常入力の行頭 `# ` / `## ` / `### ` だけを H1/H2/H3 へ変換し、paste / import / Markdown source round-trip / 汎用 shortcut は対象外 | assistant / editor UX |
| Done | WP-SAVELOAD-001 Editor Trust Vertical Slice | 新規文書、Rich editing 入力、明示保存、自動保存 reload、chapterMode 親 document 対象、TXT / Markdown / JSON export、JSON import roundtrip、不正 JSON 非破壊失敗、保存失敗表示を 1 本で確認 | assistant / writing trust |
| Done | WP-005 Preview / Comparison cleanup | Slice A/B/C で比較入口を MD preview / Reader / command palette / sidebar から隔離し、MD preview は editor-adjacent rich-preview surface として固定済み | assistant / preview-comparison |
| Done | Rich text block align persistence | Rich editing の段落揃えを Markdown 正本・保存・MD preview・Reader・reload 復帰へ接続し、`data-zw-align` の保存信頼を固定済み | assistant / rich editing trust |
| Done | Command palette Markdown source dev gate | 通常 command palette から `Markdown ソース` 切替を隠し、開発者モードだけで escape hatch として出す。Writer-facing command list の実行不能導線を減らした | assistant / command palette clarity |
| D | Docs hygiene / stale spec reconciliation | 現在の第一候補。current authority を歪める古い仕様表・古い UI 語彙・古い再開誘導だけを owner docs に最小反映する。WP-004 parity pack は preview / Reader 差分が新規に出た時だけ user-actor release gate として扱う | shared |
| Watch | Unified shell narrow fix | window drag / startup structure / left nav は closeout 済み。新規 FAIL 報告時だけ該当 surface を局所修正する | assistant / affected UI surface |

## Historical Notes

- `docs/spec-index.json` の `status: removed` は、参照先ファイルが存在しないことがある。現行仕様の探索は `done` / `partial` を優先する。
- `docs/spec-index.json` の `status: done` は「現行判断の入口」と同義ではない。summary の current pointer と各 doc 冒頭の Status を確認する。
- 旧 planning / checklist / workflow-profile stub は削除済み。再開・次作業・受け入れ確認の正本として復活させない。復元が必要な場合もファイル単位ではなく、現行の該当 specs / invariants / CURRENT_STATE へ最小事実だけ移す。
- セッション変更ログや古い検証ログは履歴参照に限る。現在判断へ持ち込まない。
- 仕様変更・方向転換・暗黙決定は、同一ブロックで役割に合う正本文書へ同期する。
- 2026-04-27 friction sweep では通常 `npm run electron:build` が既存 `build/win-unpacked/resources/app.asar` の Windows 側 file lock で失敗したため、同じソースを `build-friction/win-unpacked/` へ packaged 出力して実機確認した。次回通常 build が必要なら stale packaged process / lock を先に解放する。
