# Local Gadget Mod Boundary Closeout

Date: 2026-05-10
Status: closed / docs-only

## Purpose

`MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件を、active migration queue ではなく完了済みの Local Gadget Mod 境界として固定する。

この closeout は次の Mod 化候補を探す作業ではない。追加 migration は、明確な体感摩擦、静的監査で見つかった単一候補、または仕様上の低頻度・実験・個人用途判定が出た場合だけ別スライスで扱う。

## Closed Migration Set

| Gadget | Mod id | Group | Externalized part | Kept built-in |
|--------|--------|-------|-------------------|---------------|
| `MarkdownPreview` | `markdown-preview-gadget` | `edit` | 開閉ボタン、scroll sync 設定 | Markdown preview engine、`ZenWriterEditor.togglePreview()`、Reader、Markdown source |
| `HUDSettings` | `hud-settings-gadget` | `advanced` | HUD 位置・表示時間・見た目設定 UI | `ZenWriterHUD`、autosave HUD、command palette HUD 表示 |
| `PomodoroTimer` | `pomodoro-timer-gadget` | `assist` | timer UI、settings UI | `ZenWriterPomodoro`、Pomodoro storage、HUD notification |

All three manifest entries are disabled by default. Users enable them from settings modal `ローカルMod` and reload.

## Retain / Preserve Boundary

| Target | Decision | Reason |
|--------|----------|--------|
| `choice` command plugin | retain as command plugin | 既存互換の command plugin。gadget migration target ではない |
| `StoryWiki` / `LinkGraph` | preserve / contextual | 小説構成資産。削除や Mod 化を default next にしない |
| `Images` | preserve / contextual | VN / visual writing 文脈で残す。日常 preset 露出とは別問題 |
| `LoadoutManager` / `GadgetPrefs` | admin hide | 低頻度管理 UI。削除ではなく hide-by-default |
| `TextEffects` | contextual | `FontDecoration` / `TextAnimation` の統合先。VN preset では有用 |

## Closeout Decision

- Lane B の「Local Mod migration」は、現時点では `MarkdownPreview` / `HUDSettings` / `PomodoroTimer` の 3 件で閉じる。
- Built-in count is 25. Local Gadget Mod count is 3, plus settings modal `PluginManager`.
- Additional migration is not a standing next action.
- New built-in gadget additions still follow Mod-first gates in `docs/PLUGIN_GUIDE.md` and `docs/specs/spec-local-gadget-mods.md`.

## Recommended Residual Work

1. **Dead-code / stale-resource audit**: 旧 UI refs、未使用 selector、古い verification entry などを 1 target に絞って削る。
2. **Docs authority hygiene**: `ROADMAP` / `CURRENT_STATE` / `USER_REQUEST_LEDGER` の次手が diverge した場合だけ、正本を同期する。
3. **Writing status visibility follow-up**: 保存履歴や設定化は、必要性が出た時だけ別スライスで扱う。
4. **WP-004 / WP-001 watch lanes**: 新規 FAIL 報告がある時だけ局所修正する。

## Verification

- Docs-only closeout. Runtime API / manifest schema / loadout schema unchanged.
- Required verification: `git diff --check`
- Required verification: `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"`
