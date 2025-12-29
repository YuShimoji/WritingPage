# Task: 他プロジェクトへの参照方法を標準化（導入手順の最短化）
Status: IN_PROGRESS
Tier: 1
Branch: main
Owner: Orchestrator
Created: 2025-12-20T10:05+09:00
Report: 

## Objective
- 他プロジェクトが shared-workflows を導入する際の参照方法（推奨: submodule）と最短手順を、迷いが出ない形で固定する。
- 「何を開く/何をコピペする/どこに納品する」を 1 箇所で辿れる状態にする。

## Context
- `docs/windsurf_workflow/OPEN_HERE.md` と `docs/CENTRAL_REPO_REF.md` は存在するが、導入時の判断ポイント（submodule が無い場合の挙動など）をさらに短くできる余地がある。
- Orchestrator/Worker の運用を止めないため、SSOT と入口導線の一貫性が重要。

## Focus Area
- `docs/windsurf_workflow/OPEN_HERE.md`
- `docs/CENTRAL_REPO_REF.md`
- `docs/PROMPT_TEMPLATES.md`
- `prompts/first_time/PROJECT_KICKSTART.txt`

## Forbidden Area
- 仕様変更を伴う大改修（まずは導線の整流化に限定）
- 履歴破壊操作（rebase/reset/force push）

## Constraints
- テスト: 主要パスのみ（初回導入の手順が成立すること）
- フォールバック: 新規追加禁止

## DoD
- [ ] 推奨導入手順（submodule）の手順が短く明確に記載されている
- [ ] submodule が無い場合の扱い（停止/提案）が一貫している
- [ ] 参照導線（OPEN_HERE → prompts → SSOT）が迷わない
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- 追加の説明が必要なら、テンプレの追記ではなく既存ファイルの表現を短くする方針で進める
