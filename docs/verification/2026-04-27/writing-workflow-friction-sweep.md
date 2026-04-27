# Writing Workflow Friction Sweep

実施日: 2026-04-27  
対象: local web E2E + packaged `build-friction/win-unpacked/Zen Writer.exe`（CDP 補助）  
目的: Floating memo lab 前に、執筆導線上の UI 摩擦を narrow fixes と packaged proof で閉じる。

## Scope

- 対象: gadget drag と slider 競合、left nav root/category 操作、低価値 gadget の既定表示、章作成テンプレート導線。
- 非対象: Floating memo 実装、WP-004 parity、Reader 大改修、低価値 gadget のコード削除。
- 方針: 同じ surface の小さい摩擦だけ修正し、別系統の問題は次スライス候補へ回す。

## Result Summary

| 項目 | 結果 | 観察 |
|------|------|------|
| gadget drag と slider | PASS | `.gadget-wrapper` 全体 drag を廃止し、専用 `.gadget-drag-handle` のみ drag 開始。range / input / select / textarea / button / gadget body では drag state が発火しない。 |
| header collapse と drag | PASS | header click は collapse、drag handle は並び替えとして分離。slider 操作を最優先にした。 |
| left nav title anchor | PASS | `#sidebar-nav-anchor` は display-only。click しても root に戻らず、`#sidebar-nav-back` だけが root 戻りを担当する。 |
| left nav root visibility | PASS | root rail は通常時に opacity 0 / visibility hidden / pointer-events none。不可視 left edge rail hover で fade-in する。 |
| left edge hover | PASS | Normal left-edge hover は sidebar を force-open せず、root rail の一時 fade-in のみ行う。 |
| loadout cleanup | PASS | `LoadoutManager` は built-in preset / default loadout から除外。登録と custom loadout 経路は維持。 |
| gadget usefulness classification | PASS | `LoadoutManager = hide-by-default`、`GadgetPrefs = keep / HOLD` として `docs/GADGETS.md` に分類を記録。 |
| Rich editing chapter creation | PASS | `+ 新しい章` は空 H2 を追加し、表示は `章タイトル未設定` placeholder。保存値に `新しい章` を入れない。 |
| Markdown source chapter creation | PASS | `+ 新しい章` は空見出し `##` を追加し、カーソルを見出し名入力位置へ置く。 |
| ChapterStore chapter creation | PASS | 新規章 record は explicit empty title を保持し、表示上だけ `章タイトル未設定` placeholder として扱う。 |
| Reader roundtrip | PASS | proof text は Reader surface で読め、Reader 内に編集可能 input / textarea / contenteditable は出ない。 |
| packaged proof | PASS | packaged/CDP 12 checks すべて PASS。 |

## Validation

- `npm run lint:js:check` → pass
- `npx playwright test e2e/gadgets.spec.js e2e/sections-nav.spec.js --workers=1 --reporter=line` → 24 passed
- `npx playwright test e2e/sections-nav.spec.js e2e/command-palette.spec.js e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 57 passed
- `npx playwright test e2e/sidebar-layout.spec.js e2e/sidebar-writing-focus.spec.js --workers=1 --reporter=line` → 16 passed
- `npm run build` → pass
- `npx electron-builder --win --dir --config.directories.output=build-friction` → pass
- packaged/CDP proof against `build-friction/win-unpacked/Zen Writer.exe` → 12/12 PASS

## Packaged Proof Checks

| Check | Result |
|-------|--------|
| left nav root hidden at rest | PASS |
| left edge rail remains available | PASS |
| left edge hover fades root rail in | PASS |
| left nav title anchor is display-only | PASS |
| left nav back icon returns root | PASS |
| Rich editing + chapter starts empty title | PASS |
| Rich editing title rename syncs markdown/tree | PASS |
| Markdown source + chapter creates empty heading/caret | PASS |
| ChapterStore + chapter creates empty title record | PASS |
| gadget slider does not start drag; handle does | PASS |
| LoadoutManager hidden from built-in defaults | PASS |
| Reader surface opens read-only proof text | PASS |

## Build Note

- 通常 `npm run electron:build` は既存 `build/win-unpacked/resources/app.asar` が Windows 側プロセスに lock され、上書きに失敗した。
- 同一ソースを alternate output `build-friction/win-unpacked/` へ packaged し、CDP proof はその packaged app で実施した。
- 次回通常 packaged build を更新する場合は、stale `Zen Writer.exe` / file lock を先に解放する。

## Next Slice Candidates

1. `floating-memo-lab-follow-up`: friction sweep は PASS。本流へ混ぜず、隔離 overlay のまま進める。
2. `writing-status-visibility-decision`: top chrome hidden 時の文字数・保存状態を常時見せるか決める。
3. `gadget-usefulness-pruning`: `GadgetPrefs` などを keep / hide-by-default / delete-candidate に追加分類する。
