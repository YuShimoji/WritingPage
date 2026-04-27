# Frameless Window Grip Narrow Fix

実施日: 2026-04-27  
対象: Electron frameless window / local web E2E / packaged proof  
目的: `frame: false` + top chrome hidden の通常執筆状態で、OS枠を戻さずウィンドウ移動導線を復旧する。

## Scope

- 対象: Electron-only 左上 window grip、既存 top chrome drag lane との競合回避、Editor / sidebar の no-drag 維持。
- 非対象: top chrome 常設化、上端 hover reveal 復活、Editor余白ドラッグ、長押しドラッグ、window controls の再設計。
- 方針: 通常時は `#electron-window-grip`、top chrome 表示中は既存 `.top-chrome__drag-region` が window move を担当する。

## Result Summary

| 項目 | 結果 | 観察 |
|------|------|------|
| Non-Electron | PASS | `#electron-window-grip` は DOM に存在しても非表示のまま |
| Electron hidden chrome grip | PASS | `body.is-electron` で左上 grip が表示され、`-webkit-app-region: drag` を持つ |
| Editor / sidebar safety | PASS | Editor、Rich editing、sidebar、buttons、inputs、contenteditable は `no-drag` のまま |
| Top chrome revealed | PASS | `body[data-top-chrome-visible='true']` では grip を無効化し、top chrome drag lane に譲る |
| Packaged proof | PASS | packaged app で左上 grip から window 移動できた |

## Validation

- `npm run lint:js:check` → pass
- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js --workers=1 --reporter=line` → 42 passed
- `npm run build` → pass
- `npm run electron:build` → pass
- packaged `build/win-unpacked/Zen Writer.exe --remote-debugging-port=9231` + CDP/native mouse proof → PASS
  - `#electron-window-grip`: `display: block`, `pointer-events: auto`, `-webkit-app-region: drag`
  - grip rect: approx `left: 24px`, `top: 9px`, `48px × 24px`
  - stack top at grip center: `#electron-window-grip`
  - Editor / Rich editing / sidebar: `-webkit-app-region: no-drag`
  - native drag: window moved from `(79, 80)` to `(185, 120)` via grip center
- `git diff --check` → pass

## Notes

- v1 では Editor余白ドラッグや長押しドラッグは採用しない。誤選択・カーソル移動・右クリックと衝突しやすいため HOLD。
- grip は OS window move affordance であり、アプリ操作対象ではないため `aria-hidden="true"` の非 focusable DOM とする。
- top chrome 表示中は既存 `.top-chrome__drag-region` を優先し、grip は pointer event / drag region を無効化する。
