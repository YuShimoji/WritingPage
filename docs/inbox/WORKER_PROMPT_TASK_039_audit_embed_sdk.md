# Worker Prompt: TASK_039_audit_embed_sdk

## 参照
- チケット: docs/tasks/TASK_039_audit_embed_sdk.md
- SSOT: .shared-workflows/docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- PROTOCOL: .shared-workflows/docs/windsurf_workflow/WORKER_METAPROMPT.md

## 境界
- Focus Area:
  - `js/embed/zen-writer-embed.js`
  - `js/embed/child-bridge.js`
  - `docs/EMBED_SDK.md`
- Forbidden Area:
  - `.shared-workflows/**`
  - 既存のEmbed動作を破壊すること

## DoD
- [ ] cross-origin（異なる origin）で `sameOrigin` 未指定でも `targetOrigin` が `src` から推定され、`ZW_EMBED_READY` を受信できる
- [ ] postMessage の受信は `targetOrigin` と一致しない場合に破棄される
- [ ] 同一originで API が見つからない場合、誤った cross-origin エラーメッセージを出さない
- [ ] `npm run test:smoke` が通る

## 停止条件
- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 依存追加/更新、破壊的Git操作が必要
- SSOT不足を `ensure-ssot.js` で解決できない

## 納品先
- docs/inbox/REPORT_TASK_039_audit_embed_sdk_YYYYMMDD.md
