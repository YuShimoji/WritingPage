# REPORT_TASK_SETUP_shared-workflows_20251228

## Summary
- shared-workflows サブモジュールは `.shared-workflows/` に導入済みで、`git submodule status --recursive` 上は `def2c995382333250dbf5752c5badbc3882ee345 (.shared-workflows v0.1.0-9-gdef2c99)` を指している。
- プロジェクト側にはすでに以下が存在し、SSOT/テンプレ/CLI の最低限セットは揃っている:
  - `docs/Windsurf_AI_Collab_Rules_v2.0.md`
  - `docs/Windsurf_AI_Collab_Rules_latest.md`
  - `docs/windsurf_workflow/OPEN_HERE.md`
  - `docs/windsurf_workflow/ORCHESTRATOR_METAPROMPT.md`
  - `docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
  - `scripts/ensure-ssot.js`
  - `scripts/report-validator.js`
  - `scripts/todo-sync.js`
- `.shared-workflows/scripts` には `adapt-response.js` / `creativity-booster.js` / `detect-project-type.js` / `dev-check.js` / `dev-server.js` / `report-style-hint.js` のみがあり、`sw-doctor.js` は存在しない。
- 共有クローンと思われる `../shared-workflows` および `../shared-workflows-1` についても、`docs/` / `scripts/` 配下に `sw-doctor.js` は見つからない。
- このため、指示にある `node .shared-workflows/scripts/sw-doctor.js --profile shared-orch-bootstrap --format text` を本日時点の環境では実行できない。

## Tried Commands
- 状態確認:
  - `git status -sb`
  - `git submodule status --recursive`
  - `git -C .shared-workflows status -sb`
- サブモジュール更新:
  - `git submodule sync --recursive`
  - `git submodule update --init --recursive --remote`
- SSOT 補完:
  - `node scripts/ensure-ssot.js --project-root . --no-fail`
    - 出力: `Exists: docs/Windsurf_AI_Collab_Rules_v2.0.md` / `Exists: docs/Windsurf_AI_Collab_Rules_latest.md` / `すべてのファイルが既に存在しています。`
- sw-doctor 実行試行:
  - `node .shared-workflows/scripts/sw-doctor.js --profile shared-orch-bootstrap --format text`
    - 結果: `MODULE_NOT_FOUND` (`.shared-workflows/scripts/sw-doctor.js` が存在しない)

## Current State
- プロジェクト側 SSOT:
  - `docs/Windsurf_AI_Collab_Rules_v2.0.md` / `docs/Windsurf_AI_Collab_Rules_latest.md` は存在し、WINDSURF_GLOBAL_RULES の指す v2.0 ルールはローカルで参照可能。
- 運用ストレージ:
  - `AI_CONTEXT.md` / `docs/HANDOVER.md` / `docs/tasks/` / `docs/inbox/` は既に運用中で、最新 Orchestrator レポートも `docs/inbox` / `docs/reports` に揃っている。
- CLI 類:
  - `scripts/ensure-ssot.js` / `scripts/report-validator.js` / `scripts/todo-sync.js` / `scripts/orchestrator-audit.js` は存在し、`node scripts/<name>.js` 形式で実行可能。
- 不足物:
  - `.shared-workflows/scripts/sw-doctor.js` がサブモジュールにも共有クローンにも存在せず、`sw-doctor` 系の Complete Gate チェックは現状スキップせざるを得ない。

## Next Required Input
- `sw-doctor.js` の正式な入手元と配置ポリシーの決定:
  - 例: `YuShimoji/shared-workflows` 側で `sw-doctor.js` を公開し、サブモジュール更新で取得する運用に統一する。
  - あるいは中央クローン（例: `../shared-workflows-1`）に `scripts/sw-doctor.js` を追加し、プロジェクト側 `scripts/` にコピーして `node scripts/sw-doctor.js` で運用するポリシーを明示する。
- 上記が決まった段階で、改めて:
  - `node .shared-workflows/scripts/sw-doctor.js --profile shared-orch-bootstrap --format text`
  - または `node scripts/sw-doctor.js --profile shared-orch-bootstrap --format text`

を 1 回実行し、Complete Gate 用のチェックを通す。
