# HANDOVER

LastUpdate: 2025-12-19T15:15:00+09:00

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

- GitHubAutoApprove: false

## Current Status

- Summary: セットアップ完了（shared-workflows submodule + 運用ディレクトリ）。次: 次ミッション決定。
- Active Threads: 0

## Active Tasks

- docs/tasks/TASK_001_embed_sdk_origin_normalization.md (P0-1, Tier 2)
- docs/tasks/TASK_002_docs_gadgets_status_cleanup.md (P1-4, Tier 1)

## Notes

- このリポジトリ直下に `shared-workflows/`（gitignore対象のクローン）が存在するが、参照SSOTは `.shared-workflows/`（submodule）とする。
- ルール参照はバージョン固定を避けるため、原則 `.../Windsurf_AI_Collab_Rules_latest.md` を参照する。
- ルートの `HANDOVER.md` は既存の長文申し送り（レガシー）であり、オーケストレーション運用のSSOTは `docs/HANDOVER.md` とする。
