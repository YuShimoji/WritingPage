# Current State

最終更新: 2026-05-08（Local Gadget Mod workflow 整理）

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| ブランチ | `main` / `origin/main` は同期運用。A3 closeout は `db3b3df`、Local Gadget Mod MVP は `86cc07d` として push 済み |
| 現在の主軸 | **C2 Gadget information design**: gadget を固定ラックではなく、Local Gadget Mod として後から着脱できる境界へ戻す |
| 直近の実装スライス | Local Gadget Mod 開発導線を `docs/PLUGIN_GUIDE.md` に一本化。runtime API や既存 28 gadget の配置は未変更 |
| 最新ビルド・検証 | Local Gadget Mod workflow 整理: `git diff --check` pass、`docs/spec-index.json` JSON parse pass。runtime API / manifest / sample Mod は未変更 |
| 隔離サイドクエスト | 無重力メモ / Floating memo lab。command palette 限定の dev-only / experimental overlay。既存 editor data model / autosave 契約、正式 Gadget、loadout には接続しない |
| 今回の docs sync | `PLUGIN_GUIDE` を Local Gadget Mod 開発ワークフローの正本にし、`GADGETS` / `spec-local-gadget-mods` / `PLUGIN_SYSTEM` の役割を分離。次は built-in / Mod 境界 audit |

## Latest Handoff

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

## Current Priorities

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
| C2 | Gadget information design audit | 標準 preset cleanup 後に残った表示密度・配置・導線の摩擦を read-only で 1 件に絞る。ここではコード削除や loadout 変更を始めない | assistant / gadget UX |
| B3 follow-up | Gadget merge/delete candidate | C2 audit で候補化した gadget だけ 1 件ずつ統合・削除する。`LoadoutManager` / `GadgetPrefs` は現時点では hide-by-default 維持 | shared / gadget UX |
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
