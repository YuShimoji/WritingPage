# Task: ビジュアルUIエディタ実装

Status: CLOSED
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-18T04:30:00+09:00
Report: docs/inbox/REPORT_TASK_033_visual_ui_editor_20260118_0512.md

## Objective

- ビジュアルUIエディタを実装し、クリックで要素選択、個別またはタイプ別の一括色変更を可能にする
- テーマやVisual Profileの調整を視覚的に行えるようにする

## Context

- `docs/BACKLOG.md` の「優先度: 中」セクションに「ビジュアルUIエディタ（クリックで要素選択、個別またはタイプ別の一括色変更）」が記載されている
- 現在はテーマやVisual Profileの調整はガジェットUIから手動で行う必要がある
- ビジュアルUIエディタは未実装

## Focus Area

- `js/ui-editor.js`（新規作成: ビジュアルUIエディタの実装）
- `js/gadgets-themes.js`（テーマガジェットとの統合）
- `js/gadgets-visual-profile.js`（Visual Profileガジェットとの統合）
- `css/style.css`（UIエディタのスタイル）
- `index.html`（UIエディタのUI要素）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のテーマ/Visual Profileシステムの破壊的変更（既存の設定は動作し続けること）

## Constraints

- テスト: E2EテストでビジュアルUIエディタ機能を検証
- フォールバック: UIエディタが無効な場合、既存のガジェットUIで設定可能
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] クリックで要素選択機能を実装
- [x] 選択要素の色変更UIを実装
- [x] タイプ別の一括色変更機能を実装（例: すべてのボタン、すべてのリンク）
- [x] 変更内容をテーマ/Visual Profileに反映する機能を実装
- [x] 変更内容のプレビュー機能を実装
- [x] 変更内容の保存・復元機能を実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- テーマガジェット（Themes）やVisual Profileガジェットとの統合を考慮
- パフォーマンスに注意（多数の要素がある場合の動作確認）
- アクセシビリティを考慮（キーボード操作、スクリーンリーダー対応）

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存のテーマ/Visual Profileシステムが動作しなくなるような変更が必要
