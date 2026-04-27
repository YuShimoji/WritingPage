# Comprehensive Inspection — 2026-04-28

## Summary

- 目的: 次の開発スライスを安全に選ぶための総合点検。
- 結論: 再開ゲートは green。ユーザー向けの blocking FAIL はなし。
- 次に実装可能な高有用度候補は `main-hub-panel` 由来の stale UI / dead code cleanup。
- Floating memo lab は実験 overlay として安定しており、visual iteration へ進められる。

## Verification Baseline

| Check | Result |
|------|--------|
| `npm run test:smoke` | PASS |
| `npm run lint:js:check` | PASS |
| `npm run build` | PASS |
| `npm run test:unit` | PASS / 11 tests |
| `git diff --check` | PASS |
| `npm run test:e2e:ui -- --workers=1 --reporter=line` | PASS / 49 tests |
| `npm run test:e2e:stable -- --workers=1 --reporter=line` | PASS / 33 tests |
| `npx playwright test e2e/accessibility.spec.js e2e/ui-mode-consistency.spec.js e2e/floating-memo-lab.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` | PASS / 65 tests |

全 E2E 569件の一括実行は前回 15分 timeout 済みのため、今回の総合点検では suite 分割を正とした。assertion failure は未取得。

## Audit Findings

### Stale UI / Dead Code

- `#main-hub-panel` / `.main-hub-panel` は DOM 実体が見つからない。
- 残存参照は `css/style.css` の `.main-hub-panel` スタイル群と `js/ui-editor.js` の bulk toolbar selector。
- `HANDOVER.md` 前提は active template / smoke gate には復活していない。残存は履歴説明・明示禁止文脈のみ。
- `toggle-fullscreen` / `ui-mode-normal` / `ui-mode-focus` は `js/command-palette.js` に hidden internal compatibility として残存。visible command から外れていることは E2E で固定済み。
- 判定: `main-hub-panel` cleanup は「今すぐ着手」候補。legacy command cleanup は互換影響があるため保留。

### Daily Writing Flow

- `#writing-status-chip` は `aria-live="polite"`、初期文言 `文字数: 0 · 保存済み`、保存イベント `zen-content-saved` に連動。
- status chip は top chrome / Reader / Floating memo lab 表示中に非表示となる不変条件を targeted E2E で確認。
- command palette 保存 HUD、Reader 往復、editing focus 復帰は既存 E2E 群で green。
- 判定: 追加修正不要。保存履歴・設定化は別スライスまで増やさない。

### Gadget Pruning

- `LoadoutManager` / `GadgetPrefs` は `HIDE_BY_DEFAULT_GADGETS` で built-in loadout から除外済み。
- 両 gadget は登録・custom loadout・import/export 価値が残るため、削除候補ではなく hide-by-default 維持が妥当。
- 登録 gadget は少なくとも docs / loadout / tests で参照があり、今回の点検で即削除できる参照ゼロ gadget は見つからなかった。
- 判定: delete-candidate audit は継続候補だが、次スライスでの削除実装は推奨しない。

### Floating Memo Lab

- dev-only / experimental overlay の隔離は維持されている。
- 開閉、drag/touch、Reader/top chrome 重なり回避、close 後の編集面 focus 復帰は targeted E2E で green。
- status chip は memo lab 中に非表示。
- 判定: 実装本流へ接続せず、次は visual iteration に限定して進められる。

## Next Slice Classification

| 状態 | 有用度 | 候補 | 理由 |
|------|--------|------|------|
| 今すぐ着手 | 9 | `main-hub-panel` dead code cleanup | DOM 実体なし、残存は CSS / UI editor selector中心、E2E green。旧前提の再混入を防げる |
| 今すぐ着手 | 8 | Floating memo lab visual iteration | 隔離・focus・重なり回避が green。見え方の実験だけ進められる |
| 要確認 | 7 | Gadget delete-candidate audit | hide-by-default は妥当。即削除候補は今回見つからず、次は候補発見の scan が主作業 |
| 保留 | 6 | Writing status visibility follow-up | status chip は green。保存履歴・設定化は現時点では過剰 |
| 保留 | 5 | WP-004 parity / package narrow fix | 新規 FAIL 報告時のみ 1 トピック化する |

## Documentation Closeout

- `docs/CURRENT_STATE.md` と `docs/USER_REQUEST_LEDGER.md` を総合点検結果へ同期する。
- `docs/INVARIANTS.md` / `docs/INTERACTION_NOTES.md` は新規不変条件なしのため更新不要。
- `RECOMMENDED_DEVELOPMENT_PLAN.md` / `VERIFICATION_CHECKLIST.md` は historical stub のまま復活させない。
