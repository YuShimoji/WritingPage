# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。ここは議事録ではなく、現在の判断に効く要求だけを残す。

## 現在有効な要求

- **統合シェル UI 再設計**: 公開 UI は `display mode` ではなく、`top chrome` の表示状態、left nav の `root/category` 階層、再生オーバーレイの開閉で扱う。
- **Left nav category/icon mapping**: `sections` は「セクション」+ `list-tree` + `sections-gadgets-panel` + SectionsNavigator、`structure` は「構造」+ `file-text` + `structure-gadgets-panel` + Documents / Outline / StoryWiki / LinkGraph 系に固定する。
- **Sidebar / Gadget UI foundation**: Documents の作成 / 保存 / 入出力 / 管理 controls、gadget controls、fields、menus、scrollbars、collapse affordance は unified shell token と ARIA 契約へ寄せる。
- **Documents action lanes**: `+ 文書` / `+ フォルダ` は作成、`保存` は現在本文保存、`入出力` は TXT / JSON 書き出し・読み込み、`管理` は復元・複数選択に分ける。`JSON保存` という保存ボタンと紛れる表現は使わず `JSON書き出し` と呼ぶ。
- **UI label consistency sweep**: 同じ surface で操作対象が衝突しうる label は対象または lane を明示する。現行正本は `+ Wikiページ`、`+ 構成プリセット`、`TXT書き出し`、`プロファイル保存`、`ロードアウト適用`。局所 dialog 内で対象が明示される `保存` / `削除` は短縮可。
- **Top chrome 非侵襲化**: `top chrome` は常用ツールバーではなく、`F2` / menu / command palette で明示表示する一時シェル。上端 hover reveal と visible handle は使わない。
- **Frameless window grip**: OS枠なし / top chrome hidden の通常時移動は Electron-only の左上 window grip に限定する。Editor余白・長押し・sidebar は window drag region にしない。
- **Package / Electron closeout 完了**: 自動検証と packaged 体感確認を混同しない。2026-04-27 closeout で top chrome seam / drag lane / left nav root→category→root / shell menu wording は PASS。今後は新規 FAIL 報告時のみ narrow fix。
- **Daily writing workflow before Floating memo**: Floating memo lab の前に、起動→Rich editing 執筆→セクション確認→保存復元→Reader 往復の新規ミニ原稿導線を再現する。2026-04-27 proof の初回 FAIL（public `sections` の「新しい章」追加導線、手動保存 HUD）は narrow fix 済み。続く friction sweep で gadget drag、left nav、低価値 loadout、章作成テンプレート導線も PASS。文字数・保存状態は `#writing-status-chip` で top chrome hidden 時だけ非操作型表示する。
- **Editor surface 整理**: `Editor` は唯一の執筆面。`Rich editing` は既定のリッチ編集表示、`Markdown source` は開発者向け escape hatch、`Reader` は編集不可の読者確認 surface として扱う。`WYSIWYG mode` や Reader 代替 UI を増やさない。
- **Writing workflow friction sweep 完了**: gadget 移動は専用 drag handle 限定。left nav root は通常完全非表示で左端 hover fade-in、title anchor は表示専用、back icon のみ root 戻り。`LoadoutManager` / `GadgetPrefs` は標準 preset から外す。`+ 新しい章` は保存値に `新しい章` を入れず、空タイトル + placeholder から開始する。
- **Floating memo lab**: dev-only / experimental overlay として隔離する。editor / chapter / autosave 本流へ接続しない。
- **デッドコード寄りの資源削除**: stale docs、旧 UI 導線、使われない再開テンプレートは積極的に削除する。
- **作業粒度**: 次スライスは常に 1 トピック。WP-001 / WP-004 / package gate / docs hygiene を混ぜない。

## 次スライス候補

| 優先 | 候補 | Bottleneck | Actor / Owner |
|------|------|------------|---------------|
| A | Floating memo lab visual iteration | 開閉・フォーカス復帰・Reader/top chrome 重なり回避は PASS。以後も本流へ混ぜず実験 UI の見え方だけ進める | assistant / memo overlay |
| B | Gadget usefulness pruning | `LoadoutManager` / `GadgetPrefs` は hide-by-default 済み。次は参照ゼロ候補だけ delete-candidate 化する | shared / gadget UX |
| C | Writing status visibility follow-up | `#writing-status-chip` は PASS。常時表示以外の詳細な保存履歴や設定化は別スライスまで増やさない | shared / writing UX |
| D | WP-004 parity follow-up | preview / replay overlay / Rich editing 差分が新規報告された時だけ扱う | shared / WP004 audit |
| E | Docs hygiene sweep | 正本汚染・旧語彙・重複導線を見つけたら削除または役割限定化する | assistant / docs |
| Watch | Unified shell narrow fix | packaged closeout は PASS。新規 FAIL が出た surface だけ局所修正する | assistant / affected UI surface |

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
