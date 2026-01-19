# Task: Embed SDK の same-origin 判定と origin 検証の正規化
Status: OPEN
Tier: 2
Branch: feature/audit-embed-sdk
Created: 2026-01-20T03:05:00+09:00

## Objective
Embed SDK (`js/embed/zen-writer-embed.js`) のセキュリティ強化と挙動の正規化を行う。
現状の `sameOrigin` デフォルト `true` 依存や、`postMessage` 検証の脆弱性を解消する。

## Focus Area
- `js/embed/zen-writer-embed.js`
- `js/embed/child-bridge.js`
- `docs/EMBED_SDK.md`

## Forbidden Area
- `.shared-workflows/**`
- 既存のEmbed動作を破壊すること（後方互換性の維持）

## Constraints
- **案A（推奨）** を採用: `src` の origin から `sameOrigin` を自動判定する。
- ユーザーが明示的に `sameOrigin` を指定した場合はそれを優先する。

## DoD
- [ ] cross-origin（異なる origin）で `sameOrigin` 未指定でも `targetOrigin` が `src` から推定され、`ZW_EMBED_READY` を受信できる
- [ ] postMessage の受信は `targetOrigin` と一致しない場合に破棄される
- [ ] 同一originで API が見つからない場合、誤った cross-origin エラーメッセージを出さない
- [ ] `npm run test:smoke` が通る
