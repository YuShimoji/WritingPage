# Task: コード規約の明文化（ESLint/Prettier導入検討）

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-18T05:30:00+09:00
Report: docs/reports/REPORT_TASK_038_code_style_standardization_20260118_1735.md

## Objective

- ESLint/Prettierを導入し、コード規約を明文化する
- コード品質の向上と一貫性の確保を目指す

## Context

- `docs/BACKLOG.md` の「優先度: 低」セクションに「コード規約の明文化（ESLint/Prettier導入検討）」が記載されている
- 現在のコードは統一されたコーディング規約がなく、コードスタイルが散在している
- コード規約の明文化は未実装

## Focus Area

- `.eslintrc.js`（新規作成: ESLint設定ファイル）
- `.prettierrc`（新規作成: Prettier設定ファイル）
- `.prettierignore`（新規作成: Prettier除外ファイル）
- `package.json`（ESLint/Prettierの依存関係追加、npm scripts追加）
- `docs/CODING_STANDARDS.md`（新規作成: コーディング規約ドキュメント）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のコードの破壊的変更（既存のコードスタイルを強制的に変更しないこと）

## Constraints

- テスト: ESLint/Prettierの動作確認を実施
- フォールバック: ESLint/Prettierが無効な場合、既存のコードスタイルを維持
- 外部通信: 不要（ローカルツールのみ）

## DoD

- [x] ESLint設定ファイル（`.eslintrc.js`）を新規作成（既存、`.shared-workflows/`除外を追加）
- [x] Prettier設定ファイル（`.prettierrc`）を新規作成（既存、変更なし）
- [x] Prettier除外ファイル（`.prettierignore`）を新規作成
- [x] `package.json` にESLint/Prettierの依存関係を追加（既存、変更なし）
- [x] `package.json` にnpm scriptsを追加（`lint`, `lint:fix`, `format`, `format:check`）
- [x] コーディング規約ドキュメント（`docs/CODING_STANDARDS.md`）を新規作成
- [ ] CIパイプラインへの組み込みを検討（`.github/workflows/` への追加、オプション）
- [ ] 既存コードのリント/フォーマット実行（オプション、段階的導入）
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 既存コードのリント/フォーマットは段階的に導入（一度にすべてを変更しない）
- CIパイプラインへの組み込みはオプション（推奨）
- コーディング規約ドキュメントにESLint/Prettierの使用方法を記載

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存のコードが動作しなくなるような変更が必要
