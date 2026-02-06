# Task: WYSIWYG エディタ E2E テスト修正

Status: DONE
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-17T02:00:00+09:00
Report: docs/reports/REPORT_TASK_031_wysiwyg_e2e_fix_20260118_0411.md

## Objective

- WYSIWYG エディタの E2E テスト（`e2e/wysiwyg-editor.spec.js`）で失敗している6つのテストケースを修正する
- 太字、斜体、下線、リンク挿入、モード切替のタイムアウト問題を解決する

## Context

- `js/editor-wysiwyg.js` に RichTextEditor クラスは実装済み
- E2E テスト結果: 3/9 成功、6/9 失敗（タイムアウト）
- 失敗テスト:
  1. should apply bold formatting in WYSIWYG mode (30.7s timeout)
  2. should apply italic formatting in WYSIWYG mode (30.5s timeout)
  3. should apply underline formatting in WYSIWYG mode (30.4s timeout)
  4. should switch between textarea and WYSIWYG modes (12.3s timeout)
  5. should insert link in WYSIWYG mode (30.4s timeout)

## Focus Area

- `js/editor-wysiwyg.js`（WYSIWYG エディタ実装）
- `e2e/wysiwyg-editor.spec.js`（E2E テスト）
- `index.html`（WYSIWYG UI 要素）

## Forbidden Area

- `.shared-workflows/**`（submodule 内の変更は禁止）

## Constraints

- テスト: `npx playwright test e2e/wysiwyg-editor.spec.js` で 9/9 成功
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] 失敗している4つの E2E テスト（Bold, Italic, Underline, Link）がすべて成功する
- [x] 既存の成功テスト（5つ）が引き続き成功する
- [x] 実装変更の場合、意図しない副作用がないことを確認
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- タイムアウトの原因は UI 要素の待機条件、セレクタの問題、または実装のバグの可能性がある
- まず失敗テストを個別に実行し、具体的なエラーメッセージを確認することを推奨

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存の成功テストが失敗するような変更が必要
