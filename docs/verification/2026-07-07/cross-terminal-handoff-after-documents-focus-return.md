# Cross-terminal handoff after Documents focus return

日付: 2026-07-07
Active Artifact: `cross-terminal-handoff-after-documents-focus-return`

ユーザー要求に合わせ、現在の文脈を project-local docs に固定し、別端末が chat history なしで再開できるようにするための handoff。これは docs-only maintenance であり、新しい product source / runtime behavior / UI behavior は変更しない。

## 現在の accepted anchor

- Latest accepted commit before this handoff docs update: `944cf59 feat: return focus after document selection`.
- Active accepted slice: Documents Selection-to-Writing Focus Return + Marker Width Evidence.
- Current user-facing behavior: ordinary Documents tree document selection returns focus to the visible editor surface, current document row keeps the short `現在` marker and `aria-current="page"`, and `e2e/daily-document-lifecycle.spec.js` proves two-document write/switch/reload/export-route plus focus return and marker width readback.
- Durable proof: `docs/verification/2026-07-07/documents-selection-focus-return.md`.

## 開始時の同期状態

| コマンド | 観測結果 |
|---|---|
| `git status --short --branch` | `## main...origin/main` with only `.serena/project.yml` modified |
| `git fetch --prune origin` | completed with no output |
| `git pull --ff-only origin main` | `Already up to date.` |
| `git rev-list --left-right --count "HEAD...origin/main"` | `0 0` |

## 次端末の再開手順

1. `git pull --ff-only origin main`
2. `git rev-list --left-right --count "HEAD...origin/main"` が `0 0` であることを確認する。
3. `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md` -> `docs/PROJECT_COCKPIT.md` を読む。
4. Documents の現行証拠を見る場合は `docs/verification/2026-07-07/documents-selection-focus-return.md` と `e2e/daily-document-lifecycle.spec.js` から開始する。

## 意図的に触っていないもの

- `.serena/project.yml` は pre-existing local dirt のまま。この handoff には含めない。
- Product source、runtime behavior、UI behavior、storage schema、autosave semantics、document model、import/export format、cloud/account/public sharing、Electron packaging は変更しない。
- First Writing Comfort、Design Cockpit、text expression preset catalog、Reader parity は再オープンしない。

## Handoff validation

| コマンド | 結果 |
|---|---|
| `npm run test:smoke` | pass with `ALL TESTS PASSED` |
| `git diff --check` | pass。warning は既存 local dirt `.serena/project.yml` の CRLF notice のみ |
