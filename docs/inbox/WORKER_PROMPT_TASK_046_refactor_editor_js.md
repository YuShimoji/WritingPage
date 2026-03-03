# Worker Prompt: TASK_046_refactor_editor_js

## 参照
- チケット: docs/tasks/TASK_046_refactor_editor_js.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md（無ければ .shared-workflows/docs/ を参照）
- HANDOVER: docs/HANDOVER.md
- Worker Metaprompt: .shared-workflows/prompts/every_time/WORKER_METAPROMPT.txt

## 前提
- Tier: 2
- Branch: refactor/editor-js
- Report Target: docs/inbox/REPORT_TASK_046_refactor_editor_js_20260221.md
- GitHubAutoApprove: docs/HANDOVER.md の記述を参照

## 境界
- Focus Area: - `js/editor.js`
- Forbidden Area: - Changing the external API of `EditorManager` (Must maintain backward compatibility for now)

## 目的
Refactor `js/editor.js` (currently >1700 lines) into smaller, strictly defined modules to improve maintainability and testability.

## DoD
- [ ] `js/editor.js` is reduced to < 500 lines or removed entirely (replaced by an index).

## 制約
<チケットに記載なし>

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- 依存追加 / 外部通信が必要で GitHubAutoApprove=true が未確認
- 破壊的操作が必要
- SSOT が取得できない

## 納品先
- docs/inbox/REPORT_TASK_046_refactor_editor_js_20260221.md

---
Worker Metaprompt の Phase 0〜Phase 4 に従って実行してください。
チャット報告は固定3セクション（結果 / 変更マップ / 次の選択肢）で出力してください。

## Test Plan
- Test Phase: Stable
- テスト対象: `EditorManager` 互換性、`EditorCore`/`EditorSearch`/`EditorUI` 分割後連携
- テスト種別: Smoke（必須）, E2E（必須）, Unit（推奨）, Build（推奨）
- 期待結果: `npm run test:smoke` と `npm run test:e2e` 成功、公開APIの互換維持

## Impact Radar
- コード: `js/editor.js`, `js/modules/editor/*`
- テスト: e2e/editor関連とsmokeの回帰確認
- パフォーマンス: 初期化分割による改善余地
- UX: エディタ操作導線の回帰有無
- 連携: `app.js` からの呼び出し互換性

## Milestone
- SG-1, MG-1

## AI_CONTEXT / MISSION_LOG 参照
- AI_CONTEXT: `AI_CONTEXT.md` の Next セクション
- MISSION_LOG: `.cursor/MISSION_LOG.md` の 2026-02-22 P2〜P5 記録
