# 推奨開発プラン

> **Status: superseded / historical planning snapshot**
>
> このファイルは現在の作業選定に使わない。session 94 時点の計画断面を残すための履歴 stub。

最終更新: 2026-04-27（旧プランの正本主張を降格）

## 現行の判断先

| 判断したいこと | 正本 |
|----------------|------|
| 現在地・直近検証・再開方向 | [`CURRENT_STATE.md`](CURRENT_STATE.md) |
| 次スライス候補・有効な要求 | [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) |
| 機能ロードマップ | [`ROADMAP.md`](ROADMAP.md) |
| 不変条件・責務境界 | [`INVARIANTS.md`](INVARIANTS.md) |
| UI 状態モデル・用語 | [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) |

## 降格理由

- 旧本文は「次に何を、どの順序で進めるか」の判断基準を名乗っていたが、session 121 以降の統合シェル UI と priority 状態を反映していなかった。
- `WP-004` 単独主軸、`WP-001` closeout、`WP-005` 優先などの記述が、現行の `CURRENT_STATE` / `USER_REQUEST_LEDGER` より古い判断へ誘導する危険があった。
- 再スタート時の読了対象を増やす割に、作業接続性より過去の計画テンプレを優先させる形になっていた。

## 扱い

- 新規の planning / next-action / restart 判断では読まない。
- 履歴として必要な場合だけ、2026-04-15 session 94 周辺の計画断面として参照する。
- 長命の方針・不変条件・backlog は、このファイルへ戻さず役割に合う正本文書へ同期する。
