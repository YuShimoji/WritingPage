# Task: レポート欠損調査（docs/inbox / HANDOVER 整合性）
Status: DONE
Tier: 1
Branch: main
Owner: Orchestrator
Created: 2025-12-22T02:59+09:00
Report: docs/reports/REPORT_TASK_005_ReportAudit_20251223.md

## Objective
- docs/inbox/ の REPORT_* と docs/HANDOVER.md（Latest Orchestrator Report / Progress 欄）の内容を突き合わせ、欠損・重複・未統合レポートを洗い出す。
- Orchestrator レポートの保存～検証～HANDOVER 反映までの手順がメタプロンプト通り機能しているかを確認し、問題があれば最小修正を行う。

## Context
- 最新セッションで `REPORT_ORCH_20251222T015500.md` を統合後、新しいセッション分のレポートがまだ作成されていない。
- “レポート欠損” が Phase 1 のブロッカーとして挙がっており、docs/tasks/ にチケットが存在しなかったため本チケットで追跡する。
- report-validator.js の引数指定（config/path）が遵守されているかも合わせて点検する。

## Focus Area
- `docs/inbox/`
- `docs/HANDOVER.md`
- `templates/ORCHESTRATOR_REPORT_TEMPLATE.md`
- `scripts/report-validator.js`
- `prompts/every_time/ORCHESTRATOR_METAPROMPT.txt`（Phase 6 の手順確認）

## Forbidden Area
- Worker 納品物の内容改変（オリジナルレポート本文を書き換えない）
- プロジェクトコード（src/ 配下）の実装変更
- 不要なテンプレ追加・削除

## Constraints
- テスト: `node .shared-workflows/scripts/report-validator.js <report>` または `node scripts/report-validator.js <report> REPORT_CONFIG.yml .` を用いて検証ログを残す。
- フォールバック: レポートが存在しない場合は、HANDOVER 側に “該当レポート未作成” と TODO を明示し、空のレポートを捏造しない。
- 結果はドキュメント（Markdown）更新とログに限定する。PDF/外部配布は不要。

## DoD
- [x] docs/reports/ にある全レポートについて、HANDOVER への反映状況を確認し、不足していれば統合 or TODO 記載を完了
- [x] report-validator 実行結果（コマンド・ログ・config パス）をレポートに記載
- [x] レポート欠損に関する原因と次アクション（例: レポート作成、テンプレ修正）を列挙
- [x] チケット Report 欄に `docs/reports/REPORT_TASK_005_*.md` のパスを追記

## Notes
- Orchestrator レポート作成フロー（Phase 6）で CLI が使えない場合の代替手順も整理し、HANDOVER に “手動で実施した” というログを残す。
- docs/tasks/ との整合性チェック用に `node scripts/todo-sync.js` を実行し、AI_CONTEXT の Next セクションにも反映させる。
