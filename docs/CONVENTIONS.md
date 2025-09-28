# CONVENTIONS — 規約（命名/ブランチ/コミット）

## 命名
- ファイル: `kebab-case`（例: `theme-manager.js`）
- 変数/関数: `camelCase`
- 定数: `UPPER_SNAKE_CASE`

## ブランチ
- 機能: `feat/<topic>`
- 修正: `fix/<topic>`
- ドキュメント: `docs/<topic>`
- 雑務: `chore/<topic>`

## コミットメッセージ（推奨）
- `feat: 概要`
- `fix: 概要`
- `docs: 概要`
- `chore: 概要`
- `refactor: 概要`

## スタイル
- SRP/SoC、KISS、DRY、YAGNI を遵守
- CSS変数で配色・タイポグラフィ管理
- Linter/Formatter 導入時はプリコミットで自動実行（検討事項）

## 非採用/仕様外
- 『賞/メタ情報』は非採用（仕様外）。UI・コード・ドキュメントに含めない。
