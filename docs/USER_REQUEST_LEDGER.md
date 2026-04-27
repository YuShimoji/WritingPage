# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。ここは議事録ではなく、現在の判断に効く要求だけを残す。

## 現在有効な要求

- **統合シェル UI 再設計**: 公開 UI は `display mode` ではなく、`top chrome` の表示状態、left nav の `root/category` 階層、再生オーバーレイの開閉で扱う。
- **Left nav category/icon mapping**: `sections` は「セクション」+ `list-tree` + `sections-gadgets-panel` + SectionsNavigator、`structure` は「構造」+ `file-text` + `structure-gadgets-panel` + Documents / Outline / StoryWiki / LinkGraph 系に固定する。
- **Sidebar / Gadget UI foundation**: Documents `...`、gadget controls、fields、menus、scrollbars、collapse affordance は unified shell token と ARIA 契約へ寄せる。
- **Top chrome 非侵襲化**: `top chrome` は常用ツールバーではなく、`F2` / menu / command palette で明示表示する一時シェル。上端 hover reveal と visible handle は使わない。
- **Package / Electron manual gate**: 自動検証と packaged 体感確認を混同しない。top chrome seam / drag lane / left nav root→category→root / shell menu wording は user actor の確認対象。
- **Floating memo lab**: dev-only / experimental overlay として隔離する。editor / chapter / autosave 本流へ接続しない。
- **デッドコード寄りの資源削除**: stale docs、旧 UI 導線、使われない再開テンプレートは積極的に削除する。
- **作業粒度**: 次スライスは常に 1 トピック。WP-001 / WP-004 / package gate / docs hygiene を混ぜない。

## 次スライス候補

| 優先 | 候補 | Bottleneck | Actor / Owner |
|------|------|------------|---------------|
| A | Unified shell manual closeout | packaged / Electron の体感だけが未確定 | user / packaged app |
| B | Unified shell narrow fix | manual FAIL が出た surface を局所修正する | assistant / affected UI surface |
| C | WP-004 parity follow-up | preview / replay overlay / WYSIWYG 差分が新規報告された時だけ扱う | shared / WP004 audit |
| D | Floating memo lab follow-up | 本流に混ぜず、実験 UI のみを進める | assistant / memo overlay |
| E | Docs hygiene sweep | 正本汚染・旧語彙・重複導線を見つけたら削除または役割限定化する | assistant / docs |

## 完了時チェックリスト

- `docs/CURRENT_STATE.md` の Snapshot・Latest Handoff・検証結果を必要最小限で同期する。
- 不変条件が増えたら `docs/INVARIANTS.md`、UI 用語・手動確認形式が変わったら `docs/INTERACTION_NOTES.md` を更新する。
- ユーザー向け機能の仕様・入口・テスト所在が変わったら `docs/FEATURE_REGISTRY.md` と関連 spec を同期する。
- E2E / manual gate の責務境界が変わったら `docs/AUTOMATION_BOUNDARY.md` を同期する。
- 古い session 議事録をこの台帳へ戻さない。履歴が必要なら archive へ置く。

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す。
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する。
- 過去の完了セッション詳細は現在判断に混ぜない。
