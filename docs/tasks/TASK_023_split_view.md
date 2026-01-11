# Task: 分割ビュー機能実装

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_023_split_view.md
## Objective

- 分割ビュー機能（編集/プレビュー、章間比較、スナップショット差分）を実装する
- 複数のビューを同時に表示し、比較や確認を容易にする

## Context

- `README.md` の「記載漏れの将来拡張アイデア」に「分割ビュー: 編集/プレビュー、章間比較、スナップショット差分」が記載されている
- 分割ビュー機能は未実装
- 既存のプレビュー機能を拡張し、複数ビューを同時表示できるようにする

## Focus Area

- `js/editor.js`（エディタ機能の拡張）
- `js/editor-preview.js`（プレビュー機能の拡張）
- `js/split-view.js`（新規作成）
- `index.html`（分割ビューUI）
- `css/style.css`（分割ビュースタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のプレビュー機能の破壊的変更

## Constraints

- テスト: E2Eテストで分割ビュー機能を検証
- フォールバック: 分割ビューが無効な場合、既存の単一ビューにフォールバック
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] 編集/プレビューの分割ビューを実装
- [x] 章間比較機能を実装
- [x] スナップショット差分表示機能を実装
- [x] 分割ビューの切り替えUIを実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 既存のプレビュー機能（`js/editor-preview.js`）との統合を考慮
- パフォーマンスに注意（複数ビューの同時表示）
- レスポンシブデザインを考慮（小画面での表示）
