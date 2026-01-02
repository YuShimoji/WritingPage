# Task: GitHubのデフォルトブランチを main に統一（origin/HEAD を是正）
Status: DONE
Tier: 1
Branch: main
Owner: Orchestrator
Created: 2025-12-20T10:05+09:00
Report: docs/reports/REPORT_TASK_001_DefaultBranch_20251223.md

## Objective
- GitHub 側のデフォルトブランチを `main` に統一し、clone 時の初期ブランチが `main` になる状態にする。
- ローカルで `git remote show origin` の `HEAD branch` が `main` になっていることを確認できる状態にする。

## Context
- 現状 `origin/HEAD -> origin/chore/central-init` となっており、初見の利用者が `main` ではないブランチに着地しうる。
- 本リポジトリは SSOT として参照されるため、入口での迷いを減らす必要がある。

## Focus Area
- GitHub リポジトリ設定（Default branch）
- `docs/`（必要なら README / OPEN_HERE / CENTRAL_REPO_REF の注意書きのみ）

## Forbidden Area
- 履歴破壊操作（rebase/reset/force push）
- 運用に無関係な大規模リファクタ

## Constraints
- テスト: 主要パスのみ（clone/参照導線の確認）
- フォールバック: 新規追加禁止

## DoD
- [x] GitHub 側の Default branch が `main` になっている（`gh repo view --json defaultBranchRef --jq ".defaultBranchRef.name"` → `main`）
- [x] `git remote show origin` の `HEAD branch` が `main` と確認できる（`git remote show origin` → `HEAD branch: main`）
- [x] 変更/判断の根拠を docs/reports/ のレポートに残している（`docs/reports/REPORT_TASK_001_DefaultBranch_20251223.md`）
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- GitHub 側の設定変更が必要な場合は、手順と理由をレポートに明記する
