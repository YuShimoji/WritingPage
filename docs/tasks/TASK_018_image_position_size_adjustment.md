# Task: 画像位置調整・サイズ変更機能実装

Status: OPEN
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_018.md
## Objective

- ドラッグ操作による画像の位置・サイズ変更機能を実装する
- エディタ内の画像をインタラクティブに操作できるようにする

## Context

- 基本的な画像挿入（ドラッグ&ドロップ、Markdown構文）は実装済み（`js/editor-images.js`, `js/images.js`）
- `README.md` の「開発中・優先課題」に「ドラッグ&ドロップした画像の位置調整・サイズ変更・コラージュレイアウト」が記載されている
- `openspec/specs/images-interactive/spec.md` に仕様が記載されている
- 画像の位置・サイズ変更機能は未実装

## Focus Area

- `js/images.js`（画像管理機能の拡張）
- `js/editor-images.js`（エディタ内画像操作）
- `css/style.css`（画像操作UIのスタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存の画像挿入機能の破壊的変更

## Constraints

- テスト: E2Eテストで画像操作機能を検証
- フォールバック: 画像操作が失敗した場合、既存のMarkdown構文を維持
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] ドラッグ操作による画像の位置変更機能を実装
- [x] ドラッグ操作による画像のサイズ変更機能を実装
- [x] 画像操作UI（ハンドル、リサイズコントロール）を実装
- [x] 画像の位置・サイズ情報をMarkdownに保存する仕組みを実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- `openspec/specs/images-interactive/spec.md` の仕様を参照
- 既存の画像インタラクティブ機能（プリセット、コントロール）との統合を考慮
- パフォーマンスに注意（多数の画像がある場合の動作確認）
