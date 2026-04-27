# Daily Writing Workflow Proof

実施日: 2026-04-27  
対象: packaged `build/win-unpacked/Zen Writer.exe`（CDP 補助で実機操作を記録）  
目的: Floating memo lab の前に、日常執筆導線が再現できるかを確認する。

## Scope

- 対象導線: 起動 → Rich editing で書く → セクションを見る → 保存復元 → Reader で読む → 編集へ戻る。
- 非対象: Floating memo lab、WP-004 parity、新規 UI 改修、コード修正。
- 入力本文: AI 創作ではなく、固定の検証文のみ。

## Environment

- Git: `main` / `origin/main` = `24b422e`
- App: `build/win-unpacked/Zen Writer.exe --remote-debugging-port=9222`
- Web comparison: Windows Edge + local dev server `http://127.0.0.1:18080`
- 事前検証: `npm run lint:js:check` → pass

## Fixed Test Text

- Document: `Workflow Proof 2026-04-27`
- Section 1: `検証章 1`
- Body 1: `これは日常執筆導線の固定テスト文です。`
- Body 1b: `Rich editing 入力、保存、Reader 表示を確認します。`
- Section 2: `検証章 2`
- Body 2: `これは二つ目の章の固定テスト文です。`
- Body 2b: `章切替後の内容保持を確認します。`

## Result Summary

| 項目 | 結果 | 観察 |
|------|------|------|
| packaged 起動初期状態 | PASS | `top chrome` は hidden、handle なし。Rich editing は表示、textarea は非表示。 |
| 新規ドキュメント作成 | PASS | `structure` の Documents 作成導線から `Workflow Proof 2026-04-27` を 1 件作成し、current doc になった。 |
| Rich editing 入力 | PASS | Rich editing 上で H2 2件 + 段落を入力し、Markdown 保存値にも反映された。 |
| セクション確認 | PASS | left nav `セクション` に `H2 検証章 1` / `H2 検証章 2` が表示された。 |
| 章切替後の保持 | PASS | セクションノードで 2章目→1章目へ移動しても本文は保持された。 |
| 保存復元 | PASS | 再起動後も current doc / 本文 / Rich editing surface が復元された。 |
| Reader 表示 | PASS | command palette から Reader を開き、入力本文を読者視点で表示できた。 |
| 編集へ戻る | PASS | `編集に戻る` で Reader が閉じ、Rich editing にフォーカスが戻った。 |
| 新しい章導線 | Initial FAIL → PASS | 初回は public な `セクション` 導線に affordance がなかった。narrow fix 後は `+ 新しい章` が表示され、Rich editing / Markdown source / ChapterStore 分岐で追加できる。friction sweep 後は保存値に `新しい章` を入れず、空タイトル + placeholder 開始へ更新。 |
| 手動保存 HUD | Initial FAIL → PASS | 初回は保存完了 HUD が表示されなかった。narrow fix 後は command palette の保存で `.mini-hud` に `保存しました` が表示される。 |
| 文字数表示 | HOLD | 文字数は `文字数: 103` に更新されるが、top chrome hidden 状態では見えない。常時表示が必要かは判断待ち。 |

## FAIL 1: 新しい章導線が見えない

- 再現手順:
  1. packaged app を起動する。
  2. `structure` の Documents 作成導線から `Workflow Proof 2026-04-27` を作成する。
  3. Rich editing に `検証章 1` / `検証章 2` を H2 として入力する。
  4. left nav の `セクション` を開く。
- 実際の結果:
  - `H2 検証章 1` / `H2 検証章 2` は表示される。
  - `#writing-focus-add-section` と `#focus-add-chapter` は DOM 上にあるが、public normal shell では非表示。
  - `セクション` から自然に「新しい章」を足す見える入口がない。
- 期待結果:
  - 日常執筆導線では、内部 focus mode に入らなくても `セクション` / 章ナビ周辺から新しい章を追加できる。
- Web との差分:
  - Windows Edge + local web でも同じ。`visiblePublicAddCount: 0` で、packaged 固有差分ではない。

## FAIL 2: 手動保存 HUD が出ない

- 再現手順:
  1. Rich editing に固定テスト文を入力する。
  2. command palette から `保存（手動・即時）` を実行する。
- 実際の結果:
  - current doc content / storage content は保存される。
  - `.mini-hud` は visible にならず、保存完了メッセージが見えない。
- 期待結果:
  - 手動保存後に `保存しました` など、ユーザーに見える完了フィードバックが出る。
- Web との差分:
  - Windows Edge + local web でも同じ。`manualSaveHudVisible: false` で、packaged 固有差分ではない。

## Narrow Fix Recheck: Daily Writing / Editor Surface

実施日: 2026-04-27  
対象: packaged `build/win-unpacked/Zen Writer.exe --remote-debugging-port=9222`

| 項目 | 結果 | 観察 |
|------|------|------|
| Editor surface 定義 | PASS | docs 上で `Editor` を唯一の執筆面、`Rich editing` を既定表示、`Markdown source` を開発者向け escape hatch、`Reader` を編集不可の読者確認 surface と定義した。 |
| `sections` の章追加 affordance | PASS | `+ 新しい章` が見える。Rich editing では H2 として追加され、Markdown 保存値と Sections tree に同期された。 |
| Markdown source escape hatch | PASS | 開発者モードで Markdown source に切替後、同じ `+ 新しい章` 操作で空見出し `##` を追加し、カーソルをタイトル入力位置へ置く。 |
| ChapterStore 分岐 | PASS | 既存 ChapterStore 章がある文書では `ZWChapterList.addChapter()` 経路へ委譲する E2E を追加した。 |
| 手動保存 HUD | PASS | command palette の `保存（手動・即時）` で `.mini-hud` に `保存しました` が表示された。 |
| Reader 往復 | PASS | 追加した本文は Reader surface で読め、Reader 内に編集可能 input / textarea / contenteditable は出なかった。 |
| 再起動復元 | PASS | proof doc は再起動後も本文 / Rich editing 表示が復元された。検証後に proof doc を削除し、前回 current doc へ戻した。 |

## Follow-up: Writing Workflow Friction Sweep

実施日: 2026-04-27  
詳細: `docs/verification/2026-04-27/writing-workflow-friction-sweep.md`

| 項目 | 結果 | 観察 |
|------|------|------|
| 章作成テンプレート導線 | PASS | `+ 新しい章` は保存値に `新しい章` を入れず、Rich editing / Markdown source / ChapterStore すべて空タイトル + `章タイトル未設定` placeholder で開始する。 |
| gadget drag と slider | PASS | gadget wrapper 全体 drag を廃止し、専用 drag handle のみ drag 開始。range / input / gadget body 操作は drag state を発火しない。 |
| left nav root | PASS | root rail は通常完全非表示。不可視 left edge rail の hover で fade-in し、category title anchor は表示専用、back icon のみ root 戻り。 |
| 低価値 gadget | PASS | `LoadoutManager` は標準 preset / built-in default から除外。コード削除はせず custom loadout で明示利用可能。`GadgetPrefs` は HOLD。 |

### Narrow Fix Validation

- `npm run lint:js:check` → pass
- `npx playwright test e2e/sections-nav.spec.js --workers=1 --reporter=line --grep "daily writing"` → 3 passed
- `npx playwright test e2e/sections-nav.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → 26 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "session 129"` → 2 passed
- `npm run build` → pass
- `npm run electron:build` → pass
- packaged/CDP phase 1 → PASS: initial Rich editing / top chrome hidden、`+ 新しい章` visible、Rich H2 / saved Markdown / Sections tree sync、save HUD、Reader、Markdown source escape hatch
- packaged/CDP phase 2 → PASS: restart restore、Reader reopen、proof cleanup、previous current doc restore
- `git diff --check` → pass

## Evidence Notes

- packaged phase 1: create/write/sections/save/Reader/return → FAIL 2件、他 PASS。
- packaged phase 2: app restart/restore/Reader/return → PASS。
- Web comparison: `新しい章導線` と `手動保存 HUD` は Web でも同じ結果。
- `npx playwright` による Web 比較は WSL Chromium の `libnspr4.so` 不足で起動不可だったため、Windows Edge + CDP に切り替えた。
- narrow fix recheck: 初回 FAIL 2件は packaged / targeted E2E とも PASS。文字数常時表示だけ HOLD のまま。
- friction sweep recheck: 章作成テンプレート導線、gadget drag、left nav hover、loadout default は packaged / targeted E2E とも PASS。

## Next Slice Candidates

1. `floating-memo-lab-follow-up`: daily writing / friction sweep は PASS。本流へ混ぜず、隔離 overlay のまま進める。
2. `writing-status-visibility-decision`: top chrome hidden 時の文字数表示を常時必要とするか決める。
3. `wp004-parity-follow-up`: Reader / Rich editing / preview 差分が新規報告された時だけ扱う。

Floating memo lab は、日常執筆導線の初回 FAIL 2件が PASS になったため再開可能。ただし文字数常時表示は別判断として HOLD。
