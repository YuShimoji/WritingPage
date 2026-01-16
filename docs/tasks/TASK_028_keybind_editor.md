# Task: キーバインド編集機能実装

Status: DONE
Tier: 3
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_028_keybind_editor.md
## Objective

- キーバインド編集機能（ショートカットの再割当）を実装する
- ユーザーがショートカットをカスタマイズできるようにする

## Context

- `README.md` の「記載漏れの将来拡張アイデア」に「キーバインド編集: ショートカットの再割当」が記載されている
- キーバインド編集機能は未実装
- 既存のショートカット機能を拡張する

## Focus Area

- `js/keybind-editor.js`（新規作成）
- `js/app.js`（ショートカット機能の拡張）
- `js/gadgets-keybinds.js`（新規作成）
- `index.html`（キーバインド編集UI）
- `css/style.css`（キーバインド編集スタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のショートカット機能の破壊的変更

## Constraints

- テスト: E2Eテストでキーバインド編集機能を検証
- フォールバック: キーバインド編集が無効な場合、デフォルトショートカットにフォールバック
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] キーバインド編集UIを実装
- [x] ショートカットの再割当機能を実装
- [x] キーバインドの保存・復元機能を実装
- [x] キーバインドの競合検出機能を実装
- [x] デフォルトキーバインドのリセット機能を実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 既存のショートカット機能との統合を考慮
- キーバインドデータの保存形式を検討（LocalStorage）
- キーボード操作の競合を防ぐ仕組みが必要
