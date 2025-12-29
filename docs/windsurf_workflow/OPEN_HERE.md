# OPEN HERE（運用者の入口）

このドキュメントは、**shared-workflows を運用する人間**が「どのフォルダを開いて、どのテンプレをコピペするか」を迷わないための入口です。

- プロジェクト側（Submodule運用）: `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md`
- このリポジトリ直読み: `docs/windsurf_workflow/OPEN_HERE.md`

---

## 最短導入手順（Submodule推奨）

1. **Submodule追加**:
   ```bash
   git submodule add https://github.com/YuShimoji/shared-workflows.git .shared-workflows
   ```
2. **SSOT同期**:
   ```bash
   node .shared-workflows/scripts/ensure-ssot.js --project-root .
   ```
3. **Orchestrator起動**:
   `.shared-workflows/prompts/every_time/ORCHESTRATOR_METAPROMPT.txt` の内容を AI に貼り付ける。

---

## 迷ったらこれだけ（日常運用）

開くフォルダ（コピペ用）:
- `.shared-workflows/prompts/`

毎回コピペするもの:
- **Orchestrator起動**: `every_time/ORCHESTRATOR_METAPROMPT.txt`

Windsurf Global Rules（端末設定）:
- **貼り付け用**: `global/WINDSURF_GLOBAL_RULES.txt`

---

## 運用ストレージ
- `AI_CONTEXT.md`（ルート）: 状態/中断可能点/意思決定
- `docs/HANDOVER.md`: 進捗/ブロッカー/運用フラグ
- `docs/tasks/`: チケット（SSOT）
- `docs/inbox/`: 納品レポート

---

## サブモジュールが無い場合の扱い
`.shared-workflows/` が存在しない場合は、AI は「SSOT参照不可」と判断し、上記 **「最短導入手順」** をユーザーに提案して停止する。

---

## 追加の参照
- ルール本体: `.shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md`
- テンプレ集: `.shared-workflows/docs/PROMPT_TEMPLATES.md`
