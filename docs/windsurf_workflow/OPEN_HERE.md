# OPEN HERE（運用者の入口）

このドキュメントは、**shared-workflows を運用する人間**が「どのフォルダを開いて、どのテンプレをコピペするか」を迷わないための入口です。

- プロジェクト側（Submodule運用）: `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md`
- このリポジトリ直読み: `docs/windsurf_workflow/OPEN_HERE.md`

---

## 最短ルート（迷ったらこれだけ）

開くフォルダ（参照）:
- `.shared-workflows/docs/windsurf_workflow/`

開くフォルダ（コピペ）:
- `.shared-workflows/prompts/`

毎回コピペするもの:
- **Orchestrator起動（毎回）**: `.shared-workflows/prompts/every_time/ORCHESTRATOR_METAPROMPT.txt`

初回だけコピペするもの（環境が未整備の場合）:
- **Kickstart（初回）**: `.shared-workflows/prompts/first_time/PROJECT_KICKSTART.txt`

Windsurf Global Rules（端末ごとの統一）:
- **貼り付け用**: `.shared-workflows/prompts/global/WINDSURF_GLOBAL_RULES.txt`

参照するもの（コピペは原則しない）:
- **Worker生成テンプレ（参照）**: `.shared-workflows/docs/windsurf_workflow/WORKER_PROMPT_TEMPLATE.md`
  - Orchestrator がチケット内容（Tier/Focus/Forbidden/DoD）に合わせて Worker Prompt を都度生成するためのベース

---

## 運用ストレージ（プロジェクト側で必ず見る場所）

- `AI_CONTEXT.md`（プロジェクトルート）: 状態/中断可能点/意思決定
- `docs/HANDOVER.md`: 全体の進捗、ブロッカー、運用フラグ（例: `GitHubAutoApprove: true`）
- `docs/tasks/`: チケット（Status: OPEN/IN_PROGRESS/DONE がSSOT）
- `docs/inbox/`: Worker の納品レポート（次回 Orchestrator が回収して HANDOVER に統合）

---

## 迷いがちなポイント（判断だけ固定）

- GitHub操作（push/PR/merge）を承認待ちで止めない運用にしたい場合は、`docs/HANDOVER.md` に `GitHubAutoApprove: true` を記載して判断根拠を固定する。
- ただし `rebase` / `reset` / `force push` など **破壊的/復旧困難な操作は常に停止して合意を取る**。

---

## 追加の参照（必要なときだけ）

- ルール本体（SSOT / latest）: `.shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md`
- テンプレ一覧: `.shared-workflows/docs/PROMPT_TEMPLATES.md`
- オーケストレーション手順（参照）: `.shared-workflows/docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
- コピペ用プロンプト集（貼るだけ）: `.shared-workflows/prompts/`
- 進行の全体像（任意）: プロジェクトルート `ORCHESTRATION_PROMPT.md`（採用している場合のみ）
- SSOTファイル（`docs/Windsurf_AI_Collab_Rules_v2.0.md` / `latest`）がプロジェクトに無い場合は、作業開始前に以下いずれかで `scripts/ensure-ssot.js --project-root .` を実行して補完する:
  1. Submodule推奨: `node .shared-workflows/scripts/ensure-ssot.js --project-root .`
  2. 共有ディレクトリを直接参照: `node ../shared-workflows/scripts/ensure-ssot.js --project-root .` 等
  3. プロジェクト側 `scripts/` にコピーした `ensure-ssot.js` を実行
  - いずれも `.shared-workflows/` が無くても SSOT を揃えられる。コマンドで解決できない場合は停止して参照方法を調整する。
