# Task: docs/reports の REPORT_* を HANDOVER 取り込み後に自動削除するコマンド追加

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-18T04:30:00+09:00
Report: docs/reports/REPORT_TASK_035_flush_reports_command_20260118_0511.md

## Objective

- `docs/reports/` の REPORT_* を HANDOVER 取り込み後に自動削除するコマンド（`flush-reports` 的スクリプト）を追加する
- レポートのアーカイブ管理を自動化し、手動削除の手間を減らす

## Context

- `docs/HANDOVER.md` の「Proposals」セクションに「docs/reports の REPORT_* を HANDOVER 取り込み後に自動削除するコマンドを追加」が記載されている
- 現在は `docs/reports/` にレポートが蓄積され続けており、手動で削除する必要がある
- レポートの自動削除機能は未実装

## Focus Area

- `scripts/flush-reports.js`（新規作成: レポート削除スクリプト）
- `docs/HANDOVER.md`（使用方法のドキュメント化、必要に応じて）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のレポート検証システム（`report-validator.js`）の破壊的変更

## Constraints

- テスト: スクリプトの動作確認を実施
- フォールバック: 削除前に確認プロンプトを表示（`--force` オプションでスキップ可能）
- 外部通信: 不要（ローカルファイル操作のみ）

## DoD

- [x] `scripts/flush-reports.js` を新規作成
- [x] HANDOVER.md に記載されているレポートを検出する機能を実装
- [x] 検出したレポートを削除する機能を実装（確認プロンプト付き）
- [x] `--dry-run` オプションを実装（削除対象の表示のみ）
- [x] `--force` オプションを実装（確認プロンプトをスキップ）
- [x] 使用方法をドキュメント化（`docs/HANDOVER.md` または `README.md`）
- [x] スクリプトの動作確認を実施
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- HANDOVER.md の「統合レポート」セクションや「Latest Orchestrator Report」「Latest Worker Report」欄を参照して削除対象を判定
- 削除前にバックアップを取る機能も検討（オプション）
- CI パイプラインへの組み込みも検討（オプション）

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存のレポート検証システムが動作しなくなるような変更が必要
