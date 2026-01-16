# Task: Investigate missing reports for completed tasks

Status: IN_PROGRESS
Tier: 1
Branch: main
Owner: Worker-3
Created: 2025-12-21T11:45:00+09:00

## Objective

- Investigate why reports for completed tasks are missing and restore them if possible.

## Context

- TASK_001, TASK_003, TASK_004 are completed but reports are missing from docs/inbox even though HANDOVER lists them as統合済み。
- docs/inbox には旧 Worker/Orchestrator レポートが残存しており、統合状況との乖離が発生している。

## Focus Area

- docs/inbox/
- git history

## Forbidden Area

- Modifying existing reports

## Constraints

- Do not create fake reports.

## DoD

- [ ] Identify why the reports are missing.
- [ ] Restore the reports if possible.
- [ ] Update the task files and HANDOVER.md to reflect the correct report paths.
