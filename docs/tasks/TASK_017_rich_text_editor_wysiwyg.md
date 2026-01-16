# Task: リッチテキストエディタ（WYSIWYG）実装

Status: OPEN
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_017_rich_text_editor_wysiwyg.md
## Objective

- contenteditableベースのWYSIWYGエディタを実装し、Markdownとの双方向変換を提供する
- 現在のtextareaベースのエディタを拡張し、リッチテキスト編集機能を追加する

## Context

- 現在はtextareaベースのエディタのみ実装されている
- `openspec/changes/ui-enhancements/tasks.md` にタスクが記載されているが未実装
- `README.md` の「開発中・優先課題」に記載されている
- 小説執筆において、リッチテキスト編集は重要な機能

## Focus Area

- `js/editor.js`（エディタ機能の拡張）
- `js/editor-preview.js`（プレビュー機能との統合）
- `index.html`（エディタUIの追加）
- `css/style.css`（エディタスタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のtextareaエディタの完全削除（段階的移行を維持）

## Constraints

- テスト: E2Eテストでリッチテキスト編集機能を検証
- フォールバック: textareaエディタをフォールバックとして維持
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] contenteditableベースのWYSIWYGエディタを実装
- [x] Markdownとの双方向変換機能を実装
- [x] 既存のtextareaエディタとの切り替え機能を実装
- [x] リッチテキスト編集機能（太字、斜体、下線、リンク等）を実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- OpenSpec `ui-enhancements` の仕様を参照
- 既存のMarkdownプレビュー機能との統合を考慮
- パフォーマンスに注意（大規模ドキュメントでの動作確認）
