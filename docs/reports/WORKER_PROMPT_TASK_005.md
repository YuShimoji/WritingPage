# Worker Prompt — TASK_005

あなたは分散開発チームの Worker です。Orchestrator から割り当てられた 1 タスクだけを処理してください。

## 必須参照

- SSOT: .shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md（無い場合は docs/ 配下を ensure-ssot.js で補完）
- プロジェクト進捗: docs/HANDOVER.md
- チケット: docs/tasks/TASK_005_missing_reports.md
- アーカイブ: docs/archive/reports/ 配下（統合済みレポート待避場所）

## このタスクの前提

- Tier: 1
- Branch: main
- Focus Area: docs/inbox/（REPORT_*）、docs/archive/reports/**、docs/HANDOVER.md、docs/tasks/（Report欄）
- Forbidden Area: js/**, .shared-workflows/**
- DoD:
  1. 欠損レポート原因の特定（各タスクごとに根拠を記録）
  2. 復旧可能なレポートを復元または適切に再作成し、パスを報告
  3. タスクファイルと HANDOVER.md の Report 記載を整合（archive へ移動した場合はアーカイブ先を明記）

## 停止条件

- Forbidden Area への変更が必要
- 仕様の仮定が 3 つ以上必要
- SSOT を ensure-ssot.js でも取得できない
- 依存追加/外部通信/破壊的操作が必要
- GitHubAutoApprove 判定不可 or Push が危険
- 長時間タイムアウト

## 作業手順

1. チケットを IN_PROGRESS に更新して commit（済であれば差分確認のみ）
2. docs/inbox/ と docs/archive/reports/** を列挙し、HANDOVER / タスクファイル記載と突き合わせて欠損・乖離を洗い出す
3. Git 履歴や archive から復旧できるレポートを再配置し、復旧不可の場合は理由と推奨次手をレポート草案にまとめる
4. report-validator / orchestrator-audit を実行し、復元したレポート群と HANDOVER 更新の整合を確認
5. 納品:
   - タスクファイルを DONE に更新し、Report 欄へ最終パスを追記
   - docs/inbox/REPORT_YYYYMMDD_HHMM.md をテンプレに沿って作成（欠損調査結果を記載）
   - すべて commit（push は GitHubAutoApprove: true のため許可）
6. チャットは 1 行: `Done: <ticket>. Report: docs/inbox/REPORT_...md`

停止条件に該当したら BLOCKED レポートを残し、チケット更新/レポート/commit/チャットの 4 点を必ず実施して停止してください。
