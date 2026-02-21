# Worker Prompt: TASK_055_e2e_remaining64_continuation

## 参照
- チケット: docs/tasks/TASK_055_e2e_remaining64_continuation.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md（無ければ .shared-workflows/docs/ を参照）
- HANDOVER: docs/HANDOVER.md
- Worker Metaprompt: .shared-workflows/prompts/every_time/WORKER_METAPROMPT.txt

## 前提
- Tier: 1
- Branch: chore/e2e-phase1d6-continue
- Report Target: docs/inbox/REPORT_TASK_055_e2e_remaining64_continuation_20260221.md
- GitHubAutoApprove: docs/HANDOVER.md の記述を参照

## 境界
- Focus Area: - `e2e/**/*.spec.js`
- Forbidden Area: - `.shared-workflows/**`

## 目的
前回セッションで 64 failed / 104 passed まで改善した E2E テストを継続し、失敗要因を収束させる。

## DoD
- [x] 最新ベースライン（failed/passed）を取得済み

## 制約
<チケットに記載なし>

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- 依存追加 / 外部通信が必要で GitHubAutoApprove=true が未確認
- 破壊的操作が必要
- SSOT が取得できない

## 納品先
- docs/inbox/REPORT_TASK_055_e2e_remaining64_continuation_20260221.md

---
Worker Metaprompt の Phase 0〜Phase 4 に従って実行してください。
チャット報告は固定3セクション（結果 / 変更マップ / 次の選択肢）で出力してください。

## Test Plan
- Test Phase: Hardening
- テスト対象: 失敗64件クラスター（responsive-ui/tags-smart-folders/decorations/ui-editor/collage）
- テスト種別: E2E（必須）, Smoke（必須）, Build（推奨）
- 期待結果: `npm run test:e2e:ci` の failed 件数が 64 未満へ減少

## Impact Radar
- コード: `e2e/**/*.spec.js`, `e2e/helpers.js`, 必要最小限の `js/*`
- テスト: クラスター単位再実行 + 全体CI再走
- パフォーマンス: テスト実行時間は増加し得る
- UX: 表示/フォーカス/ガジェット操作の安定化
- 連携: sidebar/editor/gadget 機能間の前提整合

## Milestone
- SG-1, MG-2

## AI_CONTEXT / MISSION_LOG 参照
- AI_CONTEXT: `AI_CONTEXT.md` の Next セクション
- MISSION_LOG: `.cursor/MISSION_LOG.md` の 2026-02-22 P2〜P5 記録
