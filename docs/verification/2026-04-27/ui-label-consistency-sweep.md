# UI Label Consistency Sweep

実施日: 2026-04-27  
対象: local web E2E + static label audit  
目的: Documents action lanes で露出した `+ 新規` / `...` / `保存` 系の曖昧さを、他の visible UI label へ横展開して総ざらいする。

## Scope

- 対象: visible label が同じ surface 内で衝突しうる sidebar / gadget / command palette の作成・保存・書き出し・適用・管理操作。
- 非対象: Floating memo lab、WP-004 parity、gadget code 削除、dialog 内の局所的な `保存` / `削除` ラベルの全面改名。
- 方針: 見た目だけの改名ではなく、操作対象または action lane が曖昧な箇所だけを object-specific label へ寄せる。

## Result Summary

| Surface | Before | After | Result |
|---------|--------|-------|--------|
| Documents | `+ 新規` / `...` / `JSON保存` 系の混在 | `+ 文書` / `+ フォルダ` / `保存` / `入出力` / `管理` | PASS（前スライスから維持） |
| Outline | `+ 新規` | `+ 構成プリセット` | PASS |
| Story Wiki | `+ 新規作成` / `+ 新規Wikiページ` | `+ Wikiページ` | PASS |
| PrintSettings | `TXTエクスポート` | `TXT書き出し` | PASS |
| VisualProfile | `適用` / `保存` / `削除` | `プロファイル適用` / `プロファイル保存` / `プロファイル削除` | PASS |
| LoadoutManager | `保存` / `複製` / `適用` / `削除` | `ロードアウト保存` / `ロードアウト複製` / `ロードアウト適用` / `ロードアウト削除` | PASS |
| Command palette save | 「常設の保存ボタンは置かない方針」 | 現在本文のローカル即時保存として説明 | PASS |
| MarkdownReference shortcut | `Ctrl+S 保存` | `Ctrl+S 手動保存` | PASS |
| Editor surface wording | visible help / settings docs の `WYSIWYG mode` | `リッチ編集表示` / `Rich editing` | PASS |

## Audit Notes

- `保存` は現在本文保存の primary action として Documents / command palette に残す。
- Dialog 内や selected wiki page の詳細 actions など、対象が局所文脈で明示される場所の `保存` / `削除` は今回保持する。
- archive docs は歴史的記録として変更しない。現行仕様に参照される docs / specs / manual guide のみ同期した。
- 今回の sweep は label/action lane の統一であり、ロードアウトや低価値 gadget の削除判断は `gadget-usefulness-pruning` へ残す。

## Validation

- `npm run lint:js:check` → pass
- `npx playwright test e2e/ui-label-consistency.spec.js e2e/command-palette.spec.js e2e/wiki.spec.js e2e/gadgets.spec.js --workers=1 --reporter=line` → 51 passed
- `npm run lint:js:check && npx playwright test e2e/ui-label-consistency.spec.js e2e/editor-settings.spec.js --workers=1 --reporter=line` → 21 passed
- `npm run lint:js:check && git diff --check` → pass（`.gitignore` CRLF warning のみ）

## Next Slice Candidates

1. `floating-memo-lab-follow-up`: writing workflow / friction / label consistency sweep は PASS。本流へ混ぜず隔離 overlay のまま進める。
2. `gadget-usefulness-pruning`: low-value gadget を keep / hide-by-default / delete-candidate に追加分類する。
3. `writing-status-visibility-decision`: top chrome hidden 時に文字数・保存状態を常時見せるか判断する。
