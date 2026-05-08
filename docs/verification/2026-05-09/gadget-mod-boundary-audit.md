# Gadget Mod Boundary Audit

Date: 2026-05-09
Status: read-only audit / no runtime changes

## Purpose

Local Gadget Mod workflow 整理後の最初の C2 監査として、既存 28 gadget を built-in に残すもの、Local Mod 化候補、preserve / quarantine 候補、admin hide 維持に分類する。

この監査ではコード、manifest、loadout、既存 gadget 配置を変更しない。次の実装スライスに進む場合も 1 gadget だけを扱う。

## Current Evidence

- `docs/PLUGIN_GUIDE.md` は Local Gadget Mod 開発ワークフローの正本。
- `docs/specs/spec-local-gadget-mods.md` は Mod-first / built-in 例外 / 1 トピック原則を定義済み。
- `docs/GADGETS.md` は 28 built-in gadget と `PluginManager` の位置付けを記録済み。
- `js/gadgets-loadouts.js` は `LoadoutManager` / `GadgetPrefs` / `MarkdownPreview` を built-in loadout から hide-by-default にしている。
- `TextEffects` は `vn-layout` 以外の built-in loadout から隠す既存ルールを持つ。

## Classification

| Gadget | Classification | Reason |
|---|---|---|
| SectionsNavigator | built-in retain | セクション移動は日常執筆の基盤。`sections` category の単独中核 |
| Documents | built-in retain | 文書作成・保存・入出力・管理の中核 |
| Outline | built-in retain | 構造把握と本文移動の基盤 |
| StoryWiki | preserve / quarantine | 物語情報の既存中核。削除・Mod 化より preserve を優先 |
| TagsAndSmartFolders | built-in retain | 文書整理の structure 補助。標準 preset に含まれる |
| SnapshotManager | built-in retain | 復旧・履歴の安全面で built-in が妥当 |
| Images | preserve / contextual | VN / 画像 API と E2E があり、単純な低頻度 Mod 扱いにしない |
| ChoiceTools | built-in retain | インタラクティブ小説向けの編集導線。既存 `choice` command plugin 互換とは別物として維持 |
| MarkdownPreview | mod candidate / first | 標準 preset から除外済み。Reader / Markdown source が主導線で、gadget wrapper は developer/audit 用入口に近い |
| TextEffects | preserve / contextual | B3 で統合済み。VN loadout では演出ツールとして維持 |
| Typography | built-in retain | テーマ・本文表示の基盤 |
| Themes | built-in retain | 表示テーマの基盤 |
| VisualProfile | built-in retain | テーマ・フォント・レイアウトの profile 管理 |
| HeadingStyles | built-in retain | 見出し表現の基盤 |
| WritingGoal | built-in retain | 保存/文字数 status と近い日常執筆補助 |
| Typewriter | built-in retain | 執筆面の視線移動補助。標準 assist に含まれる |
| FocusMode | built-in retain | 執筆集中補助。標準 assist に含まれる |
| HUDSettings | mod candidate / later | 低頻度設定だが decorations E2E と HUD 即時反映があり、初回移動対象にはしない |
| PomodoroTimer | mod candidate / later | 個人用途寄りだが標準 assist と専用 E2E / HUD integration が強く、初回移動対象にはしない |
| MarkdownReference | built-in retain | ヘルプから分離した執筆中参照。assist 標準に含まれる |
| UISettings | built-in retain | 日常表示・文字サイズ・自動保存設定の基盤 |
| EditorAdvancedSettings | built-in retain | 高度編集設定の集約先。設定分離済み |
| EditorLayout | built-in retain | 執筆面の幅・余白設定 |
| LinkGraph | preserve / quarantine | StoryWiki と対で扱う既存 structure surface。削除・Mod 化の初回対象にしない |
| GadgetPrefs | admin hide | 標準 preset から除外済み。prefs import/export の管理面として維持 |
| LoadoutManager | admin hide | 標準 preset から除外済み。loadout 管理面として維持 |
| Keybinds | built-in retain | アプリ操作設定の基盤 |
| PrintSettings | built-in retain | 出力導線。Documents の入出力 lane と語彙連動済み |

## First Candidate

最初の実装候補は `MarkdownPreview` とする。

理由:

- 既に built-in loadout から hide-by-default で、通常執筆の標準導線に出ていない。
- Reader / Markdown source が確認導線の主役であり、`MarkdownPreview` gadget は developer/audit 用の入口に近い。
- preview pipeline 本体は `editor-preview.js` / `ZenWriterEditor.togglePreview()` 側にあり、gadget wrapper だけを Local Mod 化しやすい。
- `LoadoutManager` / `GadgetPrefs` は admin hide として維持すべきで、初回移動候補ではない。
- StoryWiki / LinkGraph / Images は preserve / contextual 候補であり、初回移動候補にはしない。

## Next Slice Boundary

次に実装する場合は、`MarkdownPreview` の gadget registration だけを Local Gadget Mod へ移す。

Keep:

- preview engine / markdown rendering pipeline
- `ZenWriterEditor.togglePreview()`
- Reader / Markdown source / command palette の既存導線
- existing built-in loadout hide-by-default policy

Change only in the next slice:

- `ZWGadgets.register('MarkdownPreview', ...)` の登録場所
- `js/plugins/markdown-preview-gadget/index.js`
- `js/plugins/manifest.json` entry with `enabled: false`
- plugin-manager / gadgets E2E の必要最小追加

Do not change:

- `choice` command plugin
- StoryWiki / LinkGraph / Images
- `LoadoutManager` / `GadgetPrefs`
- bulk migration of all existing gadgets

## Verification

This audit is documentation only. Recommended checks:

- `git diff --check`
- `docs/spec-index.json` JSON parse
