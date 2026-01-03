# Task: セッション終端チェック（推奨運用の自動検査）と Auto-merge 運用ガイド整備
Status: OPEN
Tier: 1
Branch: main
Owner: Worker
Created: 2026-01-03T03:00:00+09:00
Report:

## Objective

- セッション終端時に「やり残し（git dirty / docs/inbox / Driver入口の誤り）」を機械的に検知できるようにする
- Auto-merge が無効な環境でも、Orchestrator が迷わず手動マージに切り替えられるようガイドを整備する

## Focus Area

- `scripts/`（新規スクリプト追加や既存チェックの強化）
- `docs/`（運用ガイドの追記）
- `prompts/every_time/ORCHESTRATOR_DRIVER.txt`（入口の固定が崩れていないかの検査対象）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- `js/**`（機能実装は本タスク対象外）

## Constraints

- テスト: 主要パスのみ（必要なら `node scripts/dev-check.js` で最低限確認）
- フォールバック: 新規追加禁止（既存運用の強化のみ）
- 外部通信: GitHub 設定の変更はコードから行わない（「必要条件の案内」まで）

## DoD

- [ ] セッション終端チェック用のスクリプトが追加され、異常時に明確なメッセージを出す
- [ ] docs に「auto-merge が使えない場合の手動マージ手順」が短く追記される
- [ ] docs/inbox にレポート（REPORT_...md）が作成され、Report欄にパスが追記される

