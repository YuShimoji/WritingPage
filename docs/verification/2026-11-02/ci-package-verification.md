# CI結合・Electron候補の確認

## 対象と結論

- Source: `main` / `33dd238a321fa0c8cc06c4aca6ab085629e380f6`（clean）
- CI: [`CI E2E` run 41395033055](https://github.com/YuShimoji/WritingPage/actions/runs/41395033055)、repository `YuShimoji/WritingPage`、head SHA一致、completed/success。
- Checkpoint: `output/release-readiness/2026-11-02/33dd238-checkpoint/checkpoint.json`。CIは exact source、release readiness は `HOLD_FOR_ELECTRON_OBSERVATION`。公開・配布の承認ではない。
- Checkpoint toolのWindows app.asar読取を修正し、`test/release-readiness-checkpoint.test.js` にOS別path normalizationのテストを追加した。commit `33dd238`。

## 検証

| 対象 | 結果 |
| --- | --- |
| CI exact-source binding | PASS — `YuShimoji/WritingPage` / `CI E2E` / run `41395033055` / source `33dd238a321fa0c8cc06c4aca6ab085629e380f6` |
| Local smoke / unit / lint / build | PASS — smoke、56 unit tests、JS lint、dist build |
| Wiki削除後の即時reload | PASS — 削除記事が復活しない |
| 遅延Wiki IDB hydration | PASS — 保存済み編集を巻き戻さない |
| Rich空見出し境界と最終空章 | PASS — 保存・再読込後も保持 |
| 11個目の揃え付き段落 | PASS — Preview/Reader再読込後も各本文を保持 |
| UI capture | PASS — dist由来の7画面とmanifest/readbackを生成 |
| Electron package / packed content | PASS — exeとapp.asarを別出力に作成。指定5 sourceのarchive hashがsource hashと一致し、packed/installed/lockのmarkdown-itが14.3.0で一致 |
| 隔離profileでの起動・保存・再起動復帰 | PASS — technical verification、下記参照 |
| 人間の独立した受入 / 公開判断 | PENDING — technical verificationとは別ゲート |

## Package identity

- Executable: `output/electron-candidates/33dd238a321fa0c8cc06c4aca6ab085629e380f6/build/win-unpacked/Zen Writer.exe`
- Executable SHA-256: `732d9704f32b2b301bdb85fbc13815900d30c5226195a5bdb1a6d14f1988e64b`
- app.asar: `output/electron-candidates/33dd238a321fa0c8cc06c4aca6ab085629e380f6/build/win-unpacked/resources/app.asar`
- app.asar SHA-256: `fb82280fe6a48bd9752b15db9f98de0cf916a7c44b7718a09bc4aa5b77f872e3`
- Packed/source hash一致: `js/storage.js`, `js/storage-idb.js`, `js/editor-wysiwyg.js`, `js/zw-markdown-it-body.js`, `electron/main.js`。
- markdown-it: packed / installed / lockfile all `14.3.0`。

## Native isolated-profile observation

- Profile: `C:\Users\PLANNER007\WritingPage\output\verification-profiles\33dd238-isolated`
- 起動引数は `--verification-user-data-dir=<profile>`。`electron/main.js` が絶対パスを検証して `app.setPath('userData', ...)` した後に状態保存先を初期化する。別の既存ユーザーデータは使用していない。
- 対象exeを起動し、test-only text `Codex isolated save check 33dd238` をRich editorに入力。AX stateで33文字と「保存済み 14:52」を確認した。
- UIから終了し、exe processがなくなったことと隔離profileにIndexedDB/Local Storage等のデータが生成されたことを確認。
- 同じexeとprofileで再起動し、同じ33文字がエディタとdocument textに復帰し、保存済み表示となったことを確認。再度GUIから終了し、exe processの終了を確認。
- これはこの環境でのtechnical observationであり、本人による独立操作感受入、release acceptance、公開承認には置き換えない。Generated operator review sheetはpendingのまま保持した。

## Evidence files

- Machine-readable checkpoint: `output/release-readiness/2026-11-02/33dd238-checkpoint/checkpoint.json`
- Human-readable checkpoint: `output/release-readiness/2026-11-02/33dd238-checkpoint/RELEASE_READINESS.md`
- Operator review template: `output/release-readiness/2026-11-02/33dd238-checkpoint/ELECTRON_OPERATOR_REVIEW.md`（pendingのまま）
- UI captures: `output/release-readiness/2026-11-02/33dd238-checkpoint/captures/ui-dist/`
- Isolated profile: `output/verification-profiles/33dd238-isolated/`
