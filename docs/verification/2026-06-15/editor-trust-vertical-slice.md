# WP-SAVELOAD-001 Editor Trust Vertical Slice

日付: 2026-06-15
Active Artifact: `writing-trust-workflow-001`

Zen Writer を「周辺機能の多い Web ページ」ではなく「原稿を預けられる Editor」として扱えるかを、保存・復帰・入出力・破損時失敗で再検証した。過去の Save / Resume / Export / Import proof は参照したが、今回の完了判定は新規 E2E、unit、Browser 画面確認、実装修正で取り直した。

## 開始時の同期確認

| コマンド | 観測結果 |
|---|---|
| `git fetch --prune origin` | 出力なしで完了 |
| `git checkout main` | `Already on 'main'` / `Your branch is up to date with 'origin/main'.` |
| `git pull --ff-only origin main` | `Already up to date.` / `From https://github.com/YuShimoji/WritingPage` |
| `git status --short --branch` | `## main...origin/main`、未追跡 `docs/ai/CODEX_OPERATIONS.md` と `docs/ai/prompts/` |
| `git rev-list --left-right --count HEAD...origin/main` | `0 0` |

## 棚卸し

| 面 | 現行導線 / 責務 | 今回の扱い |
|---|---|---|
| UI | `#writing-status-chip`、Documents の `保存`、`入出力`、`documents-save-help` | `保存失敗` 状態を追加し、Browser で `編集中` -> `保存済み` と Documents help / IO menu を確認 |
| code | `js/storage.js`、`js/app-autosave-api.js`、`js/content-guard.js`、`js/modules/editor/EditorCore.js`、`js/gadgets-documents-hierarchy.js` | close / reload 時の空 assembled 上書き、IDB 初期化競合、chapter raw id の親 document 正規化、保存失敗イベントを修正 |
| E2E | `export-trust`、`import-roundtrip-hardening`、`chapter-creation-daily-flow` | 重複を避け、新規 `e2e/editor-trust-workflow.spec.js` で横断 workflow を確認。既存 3 spec も再実行 |
| unit | `test/storage-settings.test.js` のみ | `test/storage-roundtrip.test.js` を追加し、duplicate suffix、新規 ID、不正 JSON 非破壊、保存失敗時 import 非破壊を確認 |
| docs | `CURRENT_STATE`、`USER_REQUEST_LEDGER`、`ROADMAP`、First-use Save Help 由来の UI 文言 | 本ログと `docs/EDITOR_TRUST_WORKFLOW.md` を追加し、保存モデル・外部退避・同期なしを短く固定 |

## 実装で直したこと

- `beforeunload` の保険保存が、chapterMode かつ章 0 件の通常 document を `assembleFullText()` の空文字で上書きしていた。章が存在する場合だけ assembled 全文で保存するようにした。
- 非同期 IDB 初期化が、すでに localStorage / runtime cache で読んだ新しい docs を古い IDB docs で上書きできた。runtime docs cache が空でない、または dirty のときは IDB 側で上書きしない。
- `saveContent()` / `updateDocumentContent()` の current 判定で、raw current id が章 ID の場合も親 document へ正規化するようにした。
- `writing-status-chip` に `data-save-state="failed"` と表示文言 `保存失敗` を追加した。input だけでは楽観的に `保存済み` へ戻さず、実保存成功イベントで戻る。
- `ContentGuard` / `EditorCore` / Documents の明示保存が、保存失敗時に `zen-content-save-failed` と通知 `保存失敗` を出すようにした。
- JSON import UI で `null` が返った場合、既存 document を触らず `JSON読み込みに失敗しました` を通知するようにした。

## 自動確認

| コマンド | 結果 |
|---|---|
| `node --check js/writing-status-chip.js` | pass |
| `node --check js/modules/editor/EditorCore.js` | pass |
| `node --check js/content-guard.js` | pass |
| `node --check js/gadgets-documents-hierarchy.js` | pass |
| `node --check js/app-autosave-api.js` | pass |
| `node --check e2e/editor-trust-workflow.spec.js` | pass |
| `node --check test/storage-roundtrip.test.js` | pass |
| `npm run test:smoke` | pass |
| `npm run test:unit` | pass。invalid JSON と強制保存失敗の console error は意図した安全失敗ケース |
| `npm run lint:js:check` | pass |
| `npm run build` | pass。`dist/` 生成 |
| `npx playwright test e2e/editor-trust-workflow.spec.js --workers=1 --reporter=line` | 1 passed |
| `npx playwright test e2e/export-trust.spec.js e2e/import-roundtrip-hardening.spec.js e2e/chapter-creation-daily-flow.spec.js --workers=1 --reporter=line` | 6 passed |

## 実ファイル出力の確認

`e2e/editor-trust-workflow.spec.js` は download event だけでなく、download した実ファイルを `fs.readFile` で読んだ。

| 形式 | 確認内容 |
|---|---|
| TXT | `editor-trust.txt` を読み、chapter A / B の token が両方含まれることを確認 |
| Markdown | `editor-trust.md` を読み、chapter A / B の token が両方含まれることを確認 |
| JSON | `editor-trust.zwp.json` を `JSON.parse` し、`format: zenwriter-v1`、親 document id、document name、2 件の `pages` と各章 content を確認 |

Playwright の成功 run では outputDir の一時ファイルは保持されないが、テスト内で実ファイル内容を読み取って assert している。

## 画面確認

Browser で `http://127.0.0.1:8080/index.html` を開き、初期 document に `Manual browser trust check 2026-06-15` と日本語本文を入力した。

| 画面 | 観測結果 |
|---|---|
| Editor / status chip | 入力直後 `文字数: 49 · 編集中`、約 1.5 秒後 `文字数: 49 · 保存済み 05:10` |
| Rich editing surface | `Manual browser trust check 2026-06-15` と `この端末に残る確認。` が表示された |
| Documents help | `本文と章構造はこの端末に自動保存。保存状態は画面下で確認できます。TXT/JSON書き出しは外部退避、JSON読み込みで戻せます。` |
| Documents `入出力` menu | `書き出しは外部退避。JSON読み込みで戻せます。TXT書き出しJSON書き出しJSON読み込み` |

## 失敗時挙動

| ケース | 観測結果 |
|---|---|
| `ZenWriterStorage.saveContent()` が `false` を返す | `#writing-status-chip[data-save-state="failed"]`、文言 `保存失敗`、mini HUD `保存失敗` |
| 不正 JSON import | `JSON読み込みに失敗しました` を通知し、current doc id / raw id / docs snapshot は import 前と同一 |
| storage unit の保存失敗 | `importProjectJSON()` は `null` を返し、`zenWriter_docs` と `loadDocuments()` の readback は失敗前と同一 |

## Known limitations

- 現行 Documents hierarchy の `入出力` menu は TXT / JSON export と JSON import を表示する。Markdown export は editor export API / legacy Documents 経路に残る対応範囲として E2E で実ファイル確認したが、今回のスライスでは hierarchy menu へ新規項目追加しない。
- TXT / Markdown import は現行 hierarchy UI の本流導線として確認していない。legacy Documents 実装には `.txt,.md,.markdown,.text` import helper が残るが、今回の受入は JSON import roundtrip と破損 JSON 安全失敗を必須範囲にした。
- Cloud sync、外部 DB、auth、Google Drive / Keep 連携、Electron package 配布整備は対象外。
