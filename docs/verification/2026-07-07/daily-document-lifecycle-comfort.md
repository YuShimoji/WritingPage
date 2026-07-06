# Daily Document Lifecycle Comfort

日付: 2026-07-07
Active Artifact: `daily-document-lifecycle-comfort`

Fresh/reset launch から Documents panel を開き、現在文書を見つけ、2 件の文書へ短い日本語本文を書き分け、切り替え、reload 復帰、外部退避導線まで確認した。

## 変更

- Documents tree の active 行に `aria-current="page"` と短い `現在` marker を追加した。
- これにより、現在開いている文書が背景色だけでなく文字としても読める。
- 新規 E2E `e2e/daily-document-lifecycle.spec.js` を追加し、fresh/reset launch からの日常文書 lifecycle を固定した。

## E2E で固定した日常導線

- `?reset=1` の fresh launch 後、Documents category / panel を current sidebar route で開く。
- 現在文書 identity が Documents tree 上で `現在` として見える。
- 文書 1 に `朝の文書に一文を残す。` を入力し、保存済み chip を確認する。
- `+ 文書` から 2 件目を作り、`夜の文書には別の一文を書く。` を入力する。
- Documents tree から文書 1 に戻り、文書 1 の本文が残り、文書 2 の本文が混ざらないことを確認する。
- reload 後も文書 1 が current として復帰し、文書 2 も tree に残っていることを確認する。
- `入出力` menu で `TXT書き出し` / `JSON書き出し` / `JSON読み込み` と外部退避 hint を確認する。

## 境界

- storage schema、autosave semantics、document model、import/export format、Electron packaging、cloud/account/public sharing は変更していない。
- First Writing Comfort、Design Cockpit、text expression preset catalog、Reader / Editor parity は再設計していない。
- manuscript body は dashboard / readback summaries へ出していない。
- `.serena/project.yml` は既存 local dirt のままで、このスライスには含めていない。

## Validation

| コマンド | 結果 |
|---|---|
| `node --check js/gadgets-documents-tree.js` | pass |
| `node --check e2e/daily-document-lifecycle.spec.js` | pass |
| `npx playwright test e2e/daily-document-lifecycle.spec.js --workers=1 --reporter=line` | 1 passed |
| `npx playwright test e2e/first-writing-comfort.spec.js --workers=1 --reporter=line` | 1 passed |
| `npm run test:ui:capture` | pass。local evidence: `output/playwright/manual-verification-2026-07-06T16-12-19-646Z` |
| `node scripts/capture-full-showcase.js` | pass。19 screenshots。local evidence: `output/showcase/full-2026-07-06T16-12-38` |
| `npx playwright test e2e/design-cockpit.spec.js --workers=1 --reporter=line` | 2 passed |
| `npm run test:smoke` | pass with `ALL TESTS PASSED` |
| `npm run lint:js:check` | pass |
| `npm run build` | pass |
| `git diff --check` | pass。warning は既存 local dirt `.serena/project.yml` の CRLF notice のみ |

`reader-wysiwyg-distinction` は editor rendering path を変更していないため、このスライスでは再実行していない。
