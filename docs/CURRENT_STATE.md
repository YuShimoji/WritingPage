# Current State

最終更新: 2026-05-04（Phase 1 Story Wiki / left nav regression fix）

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| ブランチ | `main` / `origin/main` から作業中。`main-hub-panel` cleanup、left chrome / left nav refinement、right window controls / top chrome retirement 差分は local 未commit |
| 現在の主軸 | **Phase 1 Story Wiki / left nav regression fix complete**: left nav back rail と Story Wiki full backlinks の既知 2 failures を解消 |
| 直近の実装スライス | `#sidebar-nav-back-rail` は gadget 操作を奪わず、sidebar 左列の非操作領域クリックだけ root 戻りにする。Story Wiki full pane は viewport 幅で開き、full pane 内 backlinks を E2E で見る |
| 最新ビルド・検証 | Phase 1: `git diff --check` pass、対象 JS `node --check` pass、`lint:js:check` pass、`build` pass、`wiki+wiki-graph+pomodoro` 36 passed、`gadgets+editor-settings+ui-mode` 68 passed |
| 隔離サイドクエスト | 無重力メモ / Floating memo lab。dev-only / experimental overlay。既存 editor data model / autosave 契約には接続しない |
| 今回の docs sync | Phase 1 の root 戻り hit target 契約、Story Wiki full mode 表示契約、解消済み regression の検証証拠を restart docs に反映 |

## Latest Handoff

- Shared focus: session 127〜129 の unified shell foundation、daily writing narrow fix、writing workflow friction sweep を、現行判断の起点にする。
- Trusted: Story Wiki / Link Graph / Compare の shell token 寄せ、gadget collapse 契約、left nav label/icon/panel/gadget 対応、package safe launcher。
- Closed: visible top chrome surface は廃止。旧 `ZenWriterTopChrome` / `menu:toggle-toolbar` 互換経路は command palette へ誘導し、F2 / Electron menu も command palette を開く。
- New: Editor surface は「Editor = 唯一の執筆面」「Rich editing = 既定のリッチ編集表示」「Markdown source = 開発者向け escape hatch」「Reader = 編集不可の読者確認 surface」で整理済み。Documents は作成・保存・入出力・管理を分け、`JSON保存` ではなく `JSON書き出し` と呼ぶ。周辺 gadget も `+ Wikiページ`、`+ 構成プリセット`、`TXT書き出し`、`プロファイル保存`、`ロードアウト適用` のように対象つき label へ寄せる。
- New: `#writing-status-chip` は Reader / Floating memo lab 非表示時だけ文字数と `編集中` / `保存済み` を非操作型で表示する。`GadgetPrefs` も `LoadoutManager` と同じ hide-by-default に移した。
- New: `main-hub-panel` の active source refs は削除済み。legacy command compatibility (`toggle-fullscreen` / `ui-mode-*`) は hidden 互換として維持する。
- New: Electron window drag はユーザー確認で安定。今後の主軸は 2 レーンに分ける。Lane A は無重力メモ / Floating memo lab の visual iteration と productization gate、Lane B はガジェット再整理の usefulness audit と default loadout cleanup。どちらも現行 Editor / Reader / left nav 契約を壊さず、実装スライスは 1 トピックに限定する。
- New: Gadget cleanup は削除ではなく標準導線から下げる方針。`UISettings` は日常表示・文字サイズ・placeholder・自動保存だけ、`EditorAdvancedSettings` はリッチ編集改行 / Textbox / 浮遊パネル / gadget 表示を持つ。`MarkdownPreview` / `FontDecoration` は標準 preset から外し、`TextAnimation` は VN preset だけ残す。
- New: Phase 1 既知 regression は解消済み。left nav category の root 戻りは sidebar 左列の空白クリックだけで発火し、button / input / link / tree item / gadget controls は奪わない。Story Wiki full mode は containing gadget の collapsed/hidden 状態を解除し、full pane を viewport 幅で表示して backlinks detail を見せる。
- Do not reopen: 旧 mode button 群、常用 top toolbar、上端 hover reveal、legacy handoff/runtime/health 文書。

## Restart Route

1. このファイルの **Snapshot**、**Latest Handoff**、**Document Map** を読む。
2. 挙動の境界は `docs/INVARIANTS.md`、UI 用語と手動確認形式は `docs/INTERACTION_NOTES.md` を読む。
3. 次スライスを選ぶときだけ `docs/USER_REQUEST_LEDGER.md` と `docs/ROADMAP.md` を読む。

## Document Map

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

## Verification Results

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
- loadout normalization smoke → `novel-standard` edit は `ChoiceTools` のみ、`vn-layout` edit は `Images` / `ChoiceTools` / `TextAnimation`
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

## Current Priorities

| 優先 | テーマ | 内容 | Actor |
|------|--------|------|-------|
| Done | Right window controls / top chrome retirement | visible top chrome surface を廃止し、F2 / Electron menu は command palette へ再割当。最小化・最大化/復元・閉じるは右上 hover island へ移動 | assistant / Electron shell |
| Done | Left chrome / left nav refinement | Electron grip を初期透明 hover reveal に変更し、category-only back rail と root rail dismiss 同期を追加。packaged build/open まで pass | assistant / affected UI surface |
| Done | `main-hub-panel` dead code cleanup | DOM 実体なしの CSS / UI editor selector / active source comment を削除済み。旧前提の再混入防止チェックも pass | assistant |
| Done | Phase 1 Story Wiki / left nav regression fix | back rail の click interception と Story Wiki backlinks hidden を局所修正。`wiki+wiki-graph+pomodoro` は 36 passed | assistant / Story Wiki + left nav |
| A1 | 無重力メモ visual iteration | dev-only overlay のまま、紙片サイズ・奥行き・blur・投げ戻り・foreground 編集の読みやすさを詰める | assistant / memo overlay |
| A2 | 無重力メモ daily writing proof | 起動→Rich editing→セクション→Reader→memo lab 開閉の短い手動シナリオで、邪魔にならないことを確認する | shared / writing UX |
| A3 | 無重力メモ productization gate | 実験継続 / command palette 実験導線維持 / 正式機能化を判断する。正式化なら保存・設定・名称を別スライス化 | shared / product decision |
| Done | Gadget usefulness audit | 登録 gadget を `core / useful-default / advanced-hide / duplicate / delete-candidate` に分類し、削除ではなく標準導線から下げる方針を採用 | assistant / gadget UX |
| Done | Default loadout cleanup | `MarkdownPreview` / `FontDecoration` / 非VN `TextAnimation` を標準 preset から外し、custom loadout の明示利用は維持 | assistant / loadout UX |
| B3 | Gadget merge/delete candidate | audit で候補化した gadget だけ 1 件ずつ統合・削除する。`LoadoutManager` / `GadgetPrefs` は現時点では hide-by-default 維持 | shared / gadget UX |
| C | Writing status visibility follow-up | status chip は PASS。保存履歴・設定化などの拡張は別スライスまで増やさない | shared |
| D | WP-004 Phase 3 / Docs hygiene | 新規差分・正本汚染が出たときだけ 1 トピックで扱う | shared |
| Watch | Unified shell narrow fix | window drag / startup structure / left nav は closeout 済み。新規 FAIL 報告時だけ該当 surface を局所修正する | assistant / affected UI surface |

## Known Notes

- `docs/spec-index.json` の `status: removed` は、参照先ファイルが存在しないことがある。現行仕様の探索は `done` / `partial` を優先する。
- `docs/spec-index.json` の `status: done` は「現行判断の入口」と同義ではない。summary の current pointer と各 doc 冒頭の Status を確認する。
- 旧 planning / checklist / workflow-profile stub は削除済み。再開・次作業・受け入れ確認の正本として復活させない。復元が必要な場合もファイル単位ではなく、現行の該当 specs / invariants / CURRENT_STATE へ最小事実だけ移す。
- セッション変更ログや古い検証ログは履歴参照に限る。現在判断へ持ち込まない。
- 仕様変更・方向転換・暗黙決定は、同一ブロックで役割に合う正本文書へ同期する。
- 2026-04-27 friction sweep では通常 `npm run electron:build` が既存 `build/win-unpacked/resources/app.asar` の Windows 側 file lock で失敗したため、同じソースを `build-friction/win-unpacked/` へ packaged 出力して実機確認した。次回通常 build が必要なら stale packaged process / lock を先に解放する。
