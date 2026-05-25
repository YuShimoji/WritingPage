# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。ここは議事録ではなく、現在の判断に効く要求だけを残す。

## 現在有効な要求

- **統合シェル UI 再設計**: 公開 UI は `display mode` ではなく、command palette、left nav の `root/category` 階層、再生オーバーレイの開閉で扱う。
- **Left nav category/icon mapping**: `sections` は「セクション」+ `list-tree` + `sections-gadgets-panel` + SectionsNavigator、`structure` は「構造」+ `file-text` + `structure-gadgets-panel` + Documents / Outline / StoryWiki / LinkGraph 系に固定する。
- **Sidebar / Gadget UI foundation**: Documents の作成 / 保存 / 入出力 / 管理 controls、gadget controls、fields、menus、scrollbars、collapse affordance は unified shell token と ARIA 契約へ寄せる。
- **Documents action lanes**: `+ 文書` / `+ フォルダ` は作成、`保存` は現在本文保存、`入出力` は TXT / JSON 書き出し・読み込み、`管理` は復元・複数選択に分ける。`JSON保存` という保存ボタンと紛れる表現は使わず `JSON書き出し` と呼ぶ。
- **UI label consistency sweep**: 同じ surface で操作対象が衝突しうる label は対象または lane を明示する。現行正本は `+ Wikiページ`、`+ 構成プリセット`、`TXT書き出し`、`プロファイル保存`、`ロードアウト適用`。局所 dialog 内で対象が明示される `保存` / `削除` は短縮可。
- **Top chrome visible surface 廃止**: visible top chrome surface は復活させない。`F2` / Electron menu / 旧 toolbar 互換経路は command palette を開く。
- **Frameless window controls**: OS枠なしの通常時移動は右上 `#electron-window-controls` 内の `#electron-window-drag-handle` に統合する。非表示時の handle は `no-drag`、表示 active / focus 中だけ `drag` にする。左上・Editor余白・長押し・sidebar は window drag region にしない。最小化・最大化/復元・閉じる button は常に `no-drag` のまま局所 hover / focus 時だけ fade-in する。
- **Package / Electron closeout 完了**: 自動検証と packaged 体感確認を混同しない。2026-04-27 closeout で top chrome seam / drag lane / left nav root→category→root / shell menu wording は PASS。今後は新規 FAIL 報告時のみ narrow fix。
- **Daily writing workflow before Floating memo**: 起動→Rich editing 執筆→セクション確認→保存状態→Reader 往復→Floating memo lab 開閉のミニ原稿導線は A2 で E2E 化済み。2026-04-27 proof の初回 FAIL（public `sections` の「新しい章」追加導線、手動保存 HUD）は narrow fix 済み。続く friction sweep で gadget drag、left nav、低価値 loadout、章作成テンプレート導線も PASS。文字数・保存状態は `#writing-status-chip` で Reader / Floating memo lab 非表示時に非操作型表示する。
- **Save / Resume Trust Audit**: 新機能追加より先に、作家が毎日使う「書く→保存済み確認→Documents で見つける→閉じて戻る→TXT / JSON 書き出し→Reader から戻る」導線を安心できる状態へ固定する。2026-05-13 audit では本文保存・再開・書き出し・Reader focus は PASS。修正は Sections 空状態の Rich editing / Markdown ソース案内と Documents menu 一意化に限定済み。Floating memo 保存モデル化、Cloud sync、EPUB / DOCX、Gadget 追加、top chrome / 常設 toolbar 復活へは進まない。
- **Export Trust Proof**: Save / Resume Trust Audit の次段として、TXT / JSON は download event ではなく実ファイル内容で信頼を証明する。2026-05-13 proof では TXT が current editor value と一致し、JSON は `document.id` / `document.name` / `document.content` / `pages` を構造 assert し、daily JSON 読み込み UI roundtrip、explicit chapter `pages` roundtrip、Reader 往復後の再書き出しまで PASS。Cloud sync、EPUB / DOCX、Floating memo 保存、Gadget 追加、Export UI 大規模再設計へは進まない。
- **First-use Save Help**: Save / Resume Trust Audit、Export Trust Proof、Chapter Creation Daily Flow の信頼を前提に、初回または久しぶりのユーザーが保存モデルを短時間で理解できるようにする。2026-05-14 slice では status chip aria/title、Documents 補助文、空状態文言、入出力 menu hint/title を追加し、本文と章構造のこの端末への自動保存、画面下の保存状態、外部退避としての TXT/JSON 書き出し、戻す導線としての JSON 読み込みを短く示した。`JSON保存` 表現、Cloud sync、EPUB/DOCX、top chrome、export UI redesign は追加しない。
- **Remote sync / cross-terminal handoff**: Import Roundtrip Hardening 後の product proof anchor は `a56671b test: harden import roundtrip`。別端末は `git pull --ff-only origin main` の後、`docs/CURRENT_STATE.md` → `docs/INVARIANTS.md` → `docs/INTERACTION_NOTES.md` を読み、次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` を読む。引き継ぎでは chat 履歴ではなく project docs を正本にする。詳細 handoff は `docs/verification/2026-05-25/remote-sync-import-roundtrip-handoff.md`。
- **Editor surface 整理**: `Editor` は唯一の執筆面。`Rich editing` は既定のリッチ編集表示、`Markdown source` は開発者向け escape hatch、`Reader` は編集不可の読者確認 surface として扱う。`WYSIWYG mode` や Reader 代替 UI を増やさない。
- **Writing UX map**: 本筋の主従は **Editor canvas > 保存/文字数 status > Documents/Sections > on-demand Gadgets > experimental memo**。Floating memo は本流保存や正式 Gadget より下位の実験 surface として扱い、保存安心感や Gadget 情報設計は別スライスで扱う。
- **Writing workflow friction sweep 完了**: gadget 移動は専用 drag handle 限定。left nav root は通常完全非表示で左端 hover fade-in、title anchor は表示専用、root 戻りは back icon と category-only left-column back rail が担う。root icon rail 表示中は back rail を出さず、見た目幅を出たら即 dismiss する。`LoadoutManager` / `GadgetPrefs` は標準 preset から外す。`+ 新しい章` は保存値に `新しい章` を入れず、空タイトル + placeholder から開始する。
- **Floating memo lab**: command palette の `浮遊メモ実験` からだけ開ける dev-only / experimental overlay として隔離する。`?memoLab=1` は E2E / developer 用 hook。editor / chapter / autosave 本流、正式 Gadget、loadout preset へ接続しない。
- **無重力メモ / Floating memo roadmap**: A1 reframe と A2 daily proof は完了。A3 判断は「command palette 限定実験導線」で確定。正式機能化・保存モデル・設定化は今回しない。
- **ガジェット再整理 roadmap**: 標準 preset cleanup は着手済み。`UISettings` は日常設定へ縮小し、`EditorAdvancedSettings` へ高度設定を分離。`MarkdownPreview` は `markdown-preview-gadget`、`HUDSettings` は `hud-settings-gadget`、`PomodoroTimer` は `pomodoro-timer-gadget` Local Mod へ移動済み。`FontDecoration` / `TextAnimation` は `TextEffects` へ統合して VN 以外から外す。標準 preset から外すこととコード削除を混同しない。
- **Local Gadget Mod boundary**: ガジェットは固定ラックではなく、後から着脱できる Mod 境界を持つ。低頻度・実験的・個人用途の gadget は built-in へ直接足さず、まず `docs/PLUGIN_GUIDE.md` の開発ワークフローに従い、`js/plugins/<mod-id>/index.js` + `js/plugins/manifest.json` + 設定モーダル `ローカルMod` の enable で扱う。enable 状態は plugin manager、配置は loadout、内部設定は `ZWGadgets` prefs が正本。
- **C2 Gadget Mod boundary audit**: 既存 28 gadget の read-only 監査で、最初の実装候補を `MarkdownPreview` の Local Gadget Mod migration に固定し、後続スライスで実装済み。StoryWiki / LinkGraph / Images は preserve / contextual、LoadoutManager / GadgetPrefs は admin hide 維持。次の実装時も 1 gadget だけ扱う。
- **MarkdownPreview Local Mod migration**: `MarkdownPreview` は built-in wrapper ではなく `markdown-preview-gadget` として manifest に登録する。preview pipeline / `ZenWriterEditor.togglePreview()` / command palette / Reader / Markdown source は built-in のまま維持し、Mod は開閉ボタンと `preview.syncScroll` 設定だけを持つ。
- **HUDSettings Local Mod migration**: `HUDSettings` は built-in wrapper ではなく `hud-settings-gadget` として manifest に登録する。HUD 本体 / `ZenWriterHUD` / autosave HUD / command palette HUD 表示は built-in のまま維持し、Mod は位置・表示時間・見た目設定 UI だけを持つ。
- **PomodoroTimer Mod feasibility audit**: `PomodoroTimer` は次点候補として監査済み。settings UI が `ZWGadgets.registerSettings()` を使うため、完全移行には `api.gadgets.registerSettings()` が必要と確認し、後続の Local Mod migration で対応済み。
- **PomodoroTimer Local Mod migration**: `PomodoroTimer` は小説執筆自体には不要な個人用途補助と判断し、built-in wrapper / settings UI ではなく `pomodoro-timer-gadget` として manifest に登録する。timer engine / storage / HUD notification は built-in のまま維持し、Mod は timer UI と settings UI だけを持つ。
- **Local Gadget Mod migration closeout**: 現時点の externalized set は `MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件で閉じる。`choice` は command plugin 維持、StoryWiki / LinkGraph / Images は preserve / contextual、LoadoutManager / GadgetPrefs は admin hide、TextEffects は contextual merged gadget。追加 migration は常時探索せず、体感摩擦・静的監査・Mod-first gate のいずれかで 1 候補に絞れた時だけ別スライスで扱う。
- **デッドコード寄りの資源削除**: stale docs、旧 UI 導線、使われない再開テンプレートは積極的に削除する。
- **Active help stale wording cleanup**: active help / shortcut resources の旧 `Normal / Focus / 表示モード切替` 語彙は current shell 判断を歪めるため削除する。`F2` は command palette 表示、公開 UI は command palette / left nav / Reader surface / Local Gadget で説明する。
- **Docs authority hygiene after active help cleanup**: active help cleanup 後の `ROADMAP` と `FEATURE_REGISTRY` FR-009 は現行説明へ同期済み。次の候補選定では旧 Focus panel 由来の設定導線、旧ガジェット件数表記、古い help authority 日付を正本として扱わない。
- **Writing status saved-time visibility**: `#writing-status-chip` は文字数と編集中/保存済みに加え、保存済み時の最終保存時刻を表示する。chip は引き続き非操作型で、Reader / Floating memo lab 表示中は隠す。設定化は UI / storage 変更が広がるため別スライス扱い。
- **EDITOR_HELP stale settings route cleanup**: active help SSOT の設定導線は `Ctrl+,` と command palette `open-settings`、操作場所は left nav の「詳細設定」カテゴリに統一済み。旧 Focus panel 由来の設定導線と旧 three-route framing は戻さない。
- **VisualProfile stale UI-state wording cleanup**: Visual Profile は公開 UI 状態切替ではなく、テーマ・背景・フォント・余白・本文表示・作業シーンの一括適用として説明する。`profile.uiMode` は legacy/internal compatibility field として残すが、新規 built-in / user-saved profile の主機能に戻さない。
- **報告・次手の摩擦削減**: 完了報告は検証ログだけに圧縮しない。変更理由、何が楽になるか、残った判断、次の取っ掛かりをつなぎ、旧 planning / checklist / workflow-profile のような出力固定化 docs は削除寄りに扱う。
- **作業粒度**: 次スライスは常に 1 トピック。WP-001 / WP-004 / package gate / docs hygiene を混ぜない。
- **post-A3 start report 統合**: A3 closeout は `db3b3df` として `main` / `origin/main` に反映済み。`236b59c` は A2 proof commit であり、A3 差分が未コミットという報告は stale と扱う。`.serena/project.yml` の template churn は tool noise として戻すか除外してから次スライスへ進む。

## 次スライス候補

| 優先 | 候補 | Bottleneck | Actor / Owner |
|------|------|------------|---------------|
| Done | Right window controls / top chrome retirement | アプリを閉じる手段不足を解消。右上 hover island に三要素 window controls を移し、F2 / Electron menu は command palette に再割当済み | assistant / Electron shell |
| Done | Left chrome / left nav interaction refinement | 初期 window grip の視覚ノイズ、category 戻り hit area の遠さ、root rail の広すぎる残留範囲を解消済み。window drag は右上 island 内 handle へ統合済み。E2E UI / packaged build green | assistant / affected UI surface |
| Done | `main-hub-panel` dead code cleanup | DOM 実体なしの CSS / UI editor selector / active source comment を削除済み。再混入防止の source refs check と E2E UI は green | assistant / stale UI |
| Done | Writing UX map + 無重力メモ reframe | Editor canvas を最上位に置く設計階層を記録し、memo はカード型フォームから余白 fragment へ修正済み。保存モデルや正式機能化は未変更 | assistant / writing UX + memo overlay |
| Done | 保存安心感 / daily writing proof | 起動→Rich editing→セクション→Reader→memo lab 開閉に加え、保存/文字数 status と editor focus 復帰を `daily-writing-proof.spec.js` で確認済み | assistant / writing UX |
| Done | 無重力メモ A3 command palette限定実験 | `浮遊メモ実験` は command palette からだけ開ける保存されない隔離実験 overlay として固定。`?memoLab=1` は E2E / developer hook。正式化・保存・設定・Gadget・loadout 接続はしない | assistant / memo overlay |
| Done | Gadget usefulness audit | 登録 gadget を `core / useful-default / advanced-hide / duplicate / delete-candidate` に分類し、削除ではなく標準導線から下げる方針を採用 | assistant / gadget UX |
| Done | Default loadout cleanup | `MarkdownPreview` / 非VN `TextEffects` を標準 preset から外し、custom loadout の明示利用は維持 | assistant / loadout UX |
| Done | B3 first merge candidate | `FontDecoration` / `TextAnimation` を `TextEffects` へ統合し、旧 loadout 名は migration で維持。`LoadoutManager` / `GadgetPrefs` は hide-by-default 維持 | assistant / gadget UX |
| Done | Local Gadget Mod MVP | `ローカルMod` 設定 UI、manifest folder entry、plugin-sourced gadget 登録を追加。ガジェットが固定ラックへ戻らない境界を仕様化 | assistant / gadget UX |
| Done | Local Gadget Mod workflow整理 | `PLUGIN_GUIDE` を Mod 開発導線の正本にし、`GADGETS` / `spec-local-gadget-mods` / `PLUGIN_SYSTEM` の役割を分離。runtime API と既存 28 gadget 配置は未変更 | assistant / gadget docs |
| Done | C2 Gadget Mod boundary audit | Built-in に残すべき gadget と Local Mod に逃がすべき gadget を read-only で分類し、最初の候補を `MarkdownPreview` に固定 | assistant / gadget UX |
| Done | `MarkdownPreview` Local Mod migration | preview pipeline は残し、built-in gadget wrapper だけを `markdown-preview-gadget` Local Mod へ移動。`choice` / StoryWiki / LinkGraph / Images / LoadoutManager / GadgetPrefs は未変更 | assistant / gadget UX |
| Done | `HUDSettings` Local Mod migration | HUD 本体は残し、built-in gadget wrapper だけを `hud-settings-gadget` Local Mod へ移動。`ZenWriterHUD` / autosave HUD / command palette HUD 表示は未変更 | assistant / gadget UX |
| Done | `PomodoroTimer` Local Mod migration | `api.gadgets.registerSettings()` を追加し、timer UI / settings UI を `pomodoro-timer-gadget` Local Mod へ移動。engine / storage / HUD notification は未変更 | assistant / gadget UX |
| Done | Gadget Mod migration lane closeout | Local Mod 化済み 3 件と built-in retain / preserve / admin hide 境界を固定。追加 migration は常時探索せず、明確な 1 候補が出た時だけ別スライスで扱う | assistant / gadget UX |
| Done | Active help mode wording cleanup | `EDITOR_HELP` / in-app help / MarkdownReference shortcut の旧 `Normal / Focus / 表示モード切替` 語彙を現行シェル語彙へ同期 | assistant / active help |
| Done | Docs authority hygiene after active help cleanup | `ROADMAP` と `FEATURE_REGISTRY` FR-009 を active help cleanup 後の現行 authority へ同期。runtime は未変更 | assistant / docs authority |
| Done | Writing status saved-time visibility | `#writing-status-chip` に `保存済み HH:mm` と `data-last-saved-at` を追加。非操作型・Reader/Floating memo lab 非表示契約は維持 | assistant / writing UX |
| Done | EDITOR_HELP stale settings route cleanup | active help SSOT の旧 Focus panel 由来設定導線を削除し、`Ctrl+,` / command palette / left nav 詳細設定カテゴリへ同期 | assistant / docs authority |
| Done | VisualProfile stale UI-state wording cleanup | `docs/VISUAL_PROFILE.md` を公開 UI 状態切替ではなく、テーマ・背景・フォント・余白・本文表示・作業シーンの一括適用へ同期。runtime は未変更 | assistant / selected docs |
| Done | Save / Resume Trust Audit | 書く→保存済み確認→Documents 発見→再起動復帰→download event→Reader 往復を PASS。修正は Sections 空状態案内と Documents menu 一意化のみ | assistant / writing trust |
| Done | Export Trust Proof | TXT / JSON download の実ファイル内容を検査。TXT は current editor value、JSON は `document.id/name/content/pages` と chapter pages roundtrip、Reader 往復後の再書き出しまで PASS | assistant / export trust |
| Done | Chapter Creation Daily Flow | 章運用を毎日の執筆導線へ固定済み。`+ 新しい章`→本文入力→保存→再開→Reader→TXT/JSON 書き出し→JSON import roundtrip まで、章構造が日常利用で壊れないことを証明した | assistant / writing trust |
| Done | First-use Save Help | 初回空状態、Documents、status chip、入出力 menu に短い補助を追加し、保存モデルと外部退避導線を初見でも読めるようにした。操作面や保存方式は増やしていない | assistant / first-use UX |
| Done | Import Roundtrip Hardening | JSON 読み込みを保存前正規化へ移し、失敗時不変、既存文書衝突 suffix、legacy pages-only、章順序・level・visibility 正規化を E2E で固定した | assistant / import trust |
| Decision | Rich Editing Heading Shortcut Decision | 次の第一候補。Rich editing で `# 見出し` を Markdown shortcut として自動変換するか判断する。境界が決まるまで大きな editor 変換実装へ進まない | shared / editor UX |
| D | Docs hygiene / WP-004 parity follow-up | stale spec reconciliation は第二候補。WP-004 parity は preview / Reader 差分が新規報告された時だけ user-actor gate として扱う | shared |
| Watch | Unified shell narrow fix | window drag / startup structure / left nav は closeout 済み。新規 FAIL が出た surface だけ局所修正する | assistant / affected UI surface |

## 完了時チェックリスト

- `docs/CURRENT_STATE.md` の Snapshot・Latest Handoff・検証結果を必要最小限で同期する。
- 不変条件が増えたら `docs/INVARIANTS.md`、UI 用語・手動確認形式が変わったら `docs/INTERACTION_NOTES.md` を更新する。
- ユーザー向け機能の仕様・入口・テスト所在が変わったら `docs/FEATURE_REGISTRY.md` と関連 spec を同期する。
- E2E / manual gate の責務境界が変わったら `docs/AUTOMATION_BOUNDARY.md` を同期する。
- 古い session 議事録をこの台帳へ戻さない。履歴が必要なら archive へ置く。

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す。
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する。
- 過去の完了セッション詳細は現在判断に混ぜない。

# 2026-05-13 Chapter Creation Daily Flow

- Status: done. This slice fixed and proved the everyday chapter route: Rich editing -> `+ 新しい章` -> chapter body isolation -> save/reload -> Reader -> TXT/JSON export -> JSON import roundtrip.
- Current judgment: chapter creation is no longer treated as a docs-only or UI-presence item. The trust proof is that adding chapters does not lose body text, mix chapter bodies, lose chapter structure, or export only the active chapter slice.
- Implementation anchor: `js/gadgets-sections-nav.js`, `js/chapter-list.js`, `js/content-guard.js`, `js/gadgets-documents-hierarchy.js`, and `js/modules/editor/EditorCore.js` keep chapterMode creation/saving/export on the ChapterStore route.
- Test anchor: `e2e/chapter-creation-daily-flow.spec.js` is the restart proof. `e2e/sections-nav.spec.js` daily-writing expectations now assert the Store-backed route.
- Next candidates stay separate: `Import Roundtrip Hardening`, `Rich Editing Heading Shortcut Decision`, and `Docs Hygiene: stale spec reconciliation`.

# 2026-05-14 First-use Save Help

- Status: done. This slice made the existing local-save model legible without adding a new save mechanism.
- Current judgment: 初回ユーザーに必要なのは保存方式の再設計ではなく、「この端末に自動保存」「保存状態は画面下」「Documents で文書を見つける」「TXT/JSON は外部退避」「JSON 読み込みは戻す導線」という短い確認で足りる。
- Implementation anchor: `js/writing-status-chip.js` adds aria/title help to the non-interactive status chip; `js/gadgets-documents-hierarchy.js` adds the Documents helper and import/export menu hint/title wording; `js/gadgets-documents-tree.js` adds the first-use empty-state hint.
- Test anchor: `e2e/first-use-save-help.spec.js` proves first-use empty state, new document discovery, saved status aria, import/export wording, no `JSON保存`, and chapter-mode continuity.
- Next candidates stay separate: `Import Roundtrip Hardening`, `Rich Editing Heading Shortcut Decision`, and `Docs Hygiene: stale spec reconciliation`.

# 2026-05-14 Remote sync handoff after First-use Save Help

- Status: done. Local `main` was confirmed up to date with `origin/main` before writing the handoff note.
- Product proof anchor: `8770edd feat: clarify first-use save help`.
- Project context anchor: `docs/verification/2026-05-14/remote-sync-first-use-save-help-handoff.md` records the restart route, trusted writing path, non-reopen areas, next candidates, and validation already attached to the product proof.
- Current restart order: `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next candidates stay separate: `Import Roundtrip Hardening`, `Rich Editing Heading Shortcut Decision`, and `Docs Hygiene: stale spec reconciliation`.

# 2026-05-15 Remote sync and restart roadmap handoff

- Status: done. Local `main` was clean and synchronized with `origin/main` before this docs handoff; `git rev-list --left-right --count HEAD...origin/main` was `0 0`.
- Project context anchor: `docs/verification/2026-05-15/remote-sync-restart-roadmap-handoff.md` records the clean-state check, local readiness verification, restart route, and current roadmap priority.
- Local readiness checked: `npm run test:smoke`, `npm run lint:js:check`, `npm run test:unit`, `npm run build`, and `git diff --check` passed. `npx playwright test --list` reported 66 spec files and 588 tests.
- Current judgment: First-use Save Help and Chapter Creation Daily Flow remain closed unless a new failure appears. The next work should choose one bottleneck: `Import Roundtrip Hardening` first, `Rich Editing Heading Shortcut Decision` second, or `Docs Hygiene: stale spec reconciliation` third.
- Full monolithic E2E and Electron package build were not run in this block; use focused specs, shards, or targeted package checks when the selected slice touches those surfaces.

# 2026-05-25 Import Roundtrip Hardening

- Status: done. JSON 読み込みは外部退避から安全に戻す導線として、保存前正規化・失敗時不変・既存文書衝突回避を持つようになった。
- Current judgment: Export Trust Proof と Chapter Creation Daily Flow の後続として、JSON を書き出せるだけでなく、同名 document や荒れた pages 配列を含む JSON でも既存作業を壊さず戻せるところまで import trust を厚くした。
- Implementation anchor: `js/storage.js` の `ZenWriterStorage.importProjectJSON(jsonString)`。公開シグネチャ、export schema、Documents UI 文言、Electron menu 経路は未変更。
- Test anchor: `e2e/import-roundtrip-hardening.spec.js`。同名 document suffix、重複章タイトル保持、order / level / visibility 正規化、legacy pages-only、invalid import の docs 不変を直接確認する。
- Next candidates now shift to `Rich Editing Heading Shortcut Decision` first, `Docs Hygiene: stale spec reconciliation` second. WP-004 parity pack remains a user-actor release gate unless a new preview / Reader difference appears.

# 2026-05-25 Remote sync handoff after Import Roundtrip Hardening

- Status: done. `a56671b test: harden import roundtrip` を `origin/main` へ反映済みで、handoff note 作成前の local `main` は `origin/main` と `0 0` 同期だった。
- Project context anchor: `docs/verification/2026-05-25/remote-sync-import-roundtrip-handoff.md` records the clean-state check, validation attached to the import slice, restart route, and current next-slice priority.
- Current restart order: `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`; use `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` only when choosing the next slice.
- Next candidates stay separate: `Rich Editing Heading Shortcut Decision` first, `Docs Hygiene: stale spec reconciliation` second, and WP-004 parity pack only as a user-actor release gate when a new preview / Reader difference appears.
