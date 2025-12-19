# HANDOVER

LastUpdate: 2025-12-19T18:50:00+09:00

## References (SSOT)

- SSOT (latest): .shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md
- Operator entry: .shared-workflows/docs/windsurf_workflow/OPEN_HERE.md
- Orchestrator metaprompt: .shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_METAPROMPT.md
- Orchestrator protocol: .shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md
- Worker prompt template: .shared-workflows/docs/windsurf_workflow/WORKER_PROMPT_TEMPLATE.md
- Prompt templates: .shared-workflows/docs/PROMPT_TEMPLATES.md
- Project context: AI_CONTEXT.md
- Optional: ORCHESTRATION_PROMPT.md

## GitHubAutoApprove

- GitHubAutoApprove: true

## Current Status

- Summary: P0-1/P1-4 を完了（Embed SDK origin 正規化 / docs整備）。次: P1-3（KNOWN_ISSUES のバージョン整合）。
- Active Threads: 0

## Active Tasks

- docs/tasks/TASK_003_known_issues_version_alignment.md (P1-3, Tier 1)

## Completed Tasks

- docs/tasks/TASK_001_embed_sdk_origin_normalization.md (P0-1, Tier 2). Report: docs/inbox/REPORT_001_20251219_1810.md
- docs/tasks/TASK_002_docs_gadgets_status_cleanup.md (P1-4, Tier 1). Report: docs/inbox/REPORT_002_20251219_1810.md

## Notes

- このリポジトリ直下に `shared-workflows/`（gitignore対象のクローン）が存在するが、参照SSOTは `.shared-workflows/`（submodule）とする。
- ルール参照はバージョン固定を避けるため、原則 `.../Windsurf_AI_Collab_Rules_latest.md` を参照する。
- ルートの `HANDOVER.md` は既存の長文申し送り（レガシー）であり、オーケストレーション運用のSSOTは `docs/HANDOVER.md` とする。
