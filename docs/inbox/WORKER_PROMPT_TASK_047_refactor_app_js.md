# Worker Prompt: TASK_047_refactor_app_js

## 参照
- チケット: docs/tasks/TASK_047_refactor_app_js.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md（無ければ .shared-workflows/docs/ を参照）
- HANDOVER: docs/HANDOVER.md
- Worker Metaprompt: .shared-workflows/prompts/every_time/WORKER_METAPROMPT.txt

## 前提
- Tier: 2
- Branch: refactor/app-js
- Report Target: docs/inbox/REPORT_TASK_047_refactor_app_js_20260221.md
- GitHubAutoApprove: docs/HANDOVER.md の記述を参照

## 境界
- Focus Area: - `js/app.js`
- Forbidden Area: - Changing the initialization flow critically (must ensure `window.app` remains valid if used elsewhere)

## 目的
Refactor `js/app.js` (currently >1400 lines) into smaller modules.

## DoD
- [ ] `js/app.js` reduced to < 500 lines.

## 制約
<チケットに記載なし>

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- 依存追加 / 外部通信が必要で GitHubAutoApprove=true が未確認
- 破壊的操作が必要
- SSOT が取得できない

## 納品先
- docs/inbox/REPORT_TASK_047_refactor_app_js_20260221.md

---
Worker Metaprompt の Phase 0〜Phase 4 に従って実行してください。
チャット報告は固定3セクション（結果 / 変更マップ / 次の選択肢）で出力してください。

## Test Plan
- Test Phase: Stable
- テスト対象: `window.app` の公開参照と初期化フロー
- テスト種別: Smoke（必須）, E2E（推奨）, Unit（推奨）, Build（推奨）
- 期待結果: 起動回帰なし、`npm run test:smoke` 成功

## Impact Radar
- コード: `js/app.js`, `js/modules/app/*`
- テスト: app初期化関連のE2E/Smoke
- パフォーマンス: 初期化ハンドラ分割による改善余地
- UX: ダイアログ/イベント応答の回帰有無
- 連携: `window.app` 依存箇所への影響

## Milestone
- SG-1, MG-1

## AI_CONTEXT / MISSION_LOG 参照
- AI_CONTEXT: `AI_CONTEXT.md` の Next セクション
- MISSION_LOG: `.cursor/MISSION_LOG.md` の 2026-02-22 P2〜P5 記録
