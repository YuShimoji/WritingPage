# Central Repository Reference

本ファイルは、shared-workflows リポジトリを他プロジェクトから参照する際の情報を提供する。

## 最短導入手順 (Recommended: Git Submodule)

```bash
# 1. Submoduleとして追加
git submodule add https://github.com/YuShimoji/shared-workflows.git .shared-workflows

# 2. SSOT同期 (プロジェクトルートで実行)
node .shared-workflows/scripts/ensure-ssot.js --project-root .
```

## 参照先 (SSOT)

| ファイル                                         | 役割                            |
| ------------------------------------------------ | ------------------------------- |
| `docs/Windsurf_AI_Collab_Rules_latest.md`        | 中央ルール (SSOT)               |
| `docs/windsurf_workflow/OPEN_HERE.md`            | 運用者の入口 (まずここを読む)   |
| `prompts/every_time/ORCHESTRATOR_METAPROMPT.txt` | Orchestrator起動用 (毎回コピペ) |

## 参照の確実性

確実に参照させたい場合は **Git Submodule** を推奨する。プロジェクト外の絶対パス参照は、AI環境によってアクセス制限を受ける可能性があるためである。
Submodule が無い場合、AI は「SSOT参照不可」として停止し、上記導入手順を提案する。
