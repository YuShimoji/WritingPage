# Worker Prompt — TASK_005

あなたは分散開発チームの Worker です。Orchestrator から割り当てられた 1 タスクだけを処理してください。

## 必須参照

- SSOT: .shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md（無い場合は docs/ 配下を ensure-ssot.js で補完）
- プロジェクト進捗: docs/HANDOVER.md
- チケット: docs/tasks/TASK_005_missing_reports.md

## このタスクの前提

- Tier: 1
- Branch: main
- Focus Area: docs/inbox/（REPORT_*）、docs/HANDOVER.md、docs/tasks/（Report欄）
- Forbidden Area: js/**, .shared-workflows/**
- DoD: 欠損レポート原因の特定、復旧可否の判断と実施、task/HANDOVER への Report 記載

## 停止条件

- Forbidden Area への変更が必要
- 仕様の仮定が 3 つ以上必要
- SSOT を ensure-ssot.js でも取得できない
- 依存追加/外部通信/破壊的操作が必要
- GitHubAutoApprove 判定不可 or Push が危険
- 長時間タイムアウト

## 作業手順

1. チケットを IN_PROGRESS に更新して commit
2. docs/inbox/ の REPORT_* と docs/tasks/HANDOVER の Report 記載を突き合わせ、欠損/未統合を洗い出す
3. 復旧可能なレポートは git 履歴やバックアップから再配置し、不可なら理由と次アクションをレポートに記載
4. DoD 達成を確認（検証ログ: report-validator / orchestrator-audit）
5. 納品:
   - チケットを DONE に更新し Report 欄へパス追記
   - docs/inbox/REPORT_YYYYMMDD_HHMM.md をテンプレに沿って作成
   - すべて commit（push は GitHubAutoApprove: true のため許可）
6. チャットは 1 行: `Done: <ticket>. Report: docs/inbox/REPORT_...md`

停止条件に該当したら BLOCKED レポートを残し、チケット更新/レポート/commit/チャットの 4 点を必ず実施して停止してください。
