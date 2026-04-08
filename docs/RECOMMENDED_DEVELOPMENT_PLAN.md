# 推奨開発プラン（入口）

本ファイルは **索引** です。詳細な backlog・優先度の正本は下表のリンク先にあります。実装は **常に 1 トピック** に絞り、スライス完了ごとに [`CURRENT_STATE.md`](CURRENT_STATE.md) を更新してください。

## 正本（プランと backlog）

| 役割 | ファイル |
|------|----------|
| 推奨スライス順（短期） | [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の「推奨スライス順」 |
| 優先度テーブル | [`CURRENT_STATE.md`](CURRENT_STATE.md) の「現在の優先課題」 |
| 機能ロードマップ・WP 表 | [`ROADMAP.md`](ROADMAP.md)（次スライス候補、WP-004/WP-001 UI ロードマップ） |

運用: 不変条件は [`INVARIANTS.md`](INVARIANTS.md)、状態モデルは [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md)。

## 要約（実装順の目安）

詳細・表・候補一覧は上記正本を参照。

### 短期

1. **保存導線** — [`specs/spec-writing-mode-unification-prep.md`](specs/spec-writing-mode-unification-prep.md) の未決を 1 スライスで確定（実装または現状維持の明文化）。
2. **WP-004 Phase 3** — [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) に沿い差分を **1 件ずつ**。回帰は [`e2e/reader-wysiwyg-distinction.spec.js`](../e2e/reader-wysiwyg-distinction.spec.js) を中心に。
3. **WP-001 摩擦削減** — deferred は体感で問題が出たときだけ 1 トピック化。それ以外は [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の表から 1 件。

### 中期（WP-004 Phase 3 と混ぜない）

- リッチテキスト: [`specs/spec-richtext-enhancement.md`](specs/spec-richtext-enhancement.md)、段落揃えは [`specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)。
- WP-001 中長期（サイドバー密度・ロードアウト・発見性など）: 台帳表を 1 スライス単位で。
- 横断（将来）: Wiki ワークフローなどは要望に応じ 1 トピック起票。

### 継続的な検証

- 全 E2E: `npx playwright test`（件数は `npx playwright test --list`）。
- WP-004 手動パック: [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)。
