# Worker Prompt: TASK_052_gadget_api_type_safety

## 参照
- チケット: docs/tasks/TASK_052_gadget_api_type_safety.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md（無ければ .shared-workflows/docs/ を参照）
- HANDOVER: docs/HANDOVER.md
- Worker Metaprompt: .shared-workflows/prompts/every_time/WORKER_METAPROMPT.txt

## 前提
- Tier: 2
- Branch: chore/gadget-types
- Report Target: docs/inbox/REPORT_TASK_052_gadget_api_type_safety_20260221.md
- GitHubAutoApprove: docs/HANDOVER.md の記述を参照

## 境界
- Focus Area: - `js/gadgets-core.js`
- Forbidden Area: <未設定>

## 目的
Add JSDoc/Types validation for `ZWGadgets.register()` to prevent runtime errors.

## DoD
- [ ] Add JSDoc types for Gadget Definition.

## 制約
<チケットに記載なし>

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- 依存追加 / 外部通信が必要で GitHubAutoApprove=true が未確認
- 破壊的操作が必要
- SSOT が取得できない

## 納品先
- docs/inbox/REPORT_TASK_052_gadget_api_type_safety_20260221.md

---
Worker Metaprompt の Phase 0〜Phase 4 に従って実行してください。
チャット報告は固定3セクション（結果 / 変更マップ / 次の選択肢）で出力してください。

## Test Plan
- Test Phase: Stable
- テスト対象: `ZWGadgets.register()` の型/ランタイム検証
- テスト種別: Unit（必須）, Smoke（必須）, Build（推奨）
- 期待結果: 不正入力で明確なエラー、正常入力で既存ガジェット登録継続

## Impact Radar
- コード: `js/gadgets-core.js`
- テスト: gadget登録周辺の単体検証追加
- パフォーマンス: バリデーション追加分の微小コスト
- UX: ガジェット登録失敗時の可観測性向上
- 連携: 既存ガジェット定義との互換性

## Milestone
- SG-1, MG-1

## AI_CONTEXT / MISSION_LOG 参照
- AI_CONTEXT: `AI_CONTEXT.md` の Next セクション
- MISSION_LOG: `.cursor/MISSION_LOG.md` の 2026-02-22 P2〜P5 記録
