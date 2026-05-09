# Local Gadget Mods

Status: done / MVP
Last updated: 2026-05-10

## Purpose

ガジェットは固定ラックではなく、後から着脱できるローカル Mod として扱える必要がある。Built-in gadget は日常執筆の基盤だけを担い、実験的・低頻度・個人用途の gadget は Local Gadget Mod として追加できる境界を保つ。

## Scope

- 対象は Trusted local plugins only。
- 初期 MVP は `js/plugins/manifest.json` に載ったローカル JS を起動時に読む。
- Mod ファイルは `js/plugins/<mod-id>/index.js` のように専用フォルダへ置ける。
- 有効/無効は設定モーダルの `ローカルMod` で切り替え、`localStorage` の `zw_plugin_manager_enabled` に保存する。
- enable / disable の反映は reload 後でよい。読み込み済み JS の完全 unload は MVP の対象外。

## Development Workflow Authority

- Local Gadget Mod の開発手順は `docs/PLUGIN_GUIDE.md` を正本とする。
- `docs/GADGETS.md` は built-in gadget の一覧、表示カテゴリ、loadout との関係を説明する。
- `docs/design/PLUGIN_SYSTEM.md` は背景設計と deferred な将来案であり、現行の開発手順を上書きしない。

## Decision Gates

新しい gadget を追加する前に、次の順で判定する。

1. **Mod-first**: 低頻度・実験的・個人用途・標準 loadout に入れる根拠が弱い gadget は Local Gadget Mod として作る。
2. **Built-in 例外**: 日常執筆の基盤、既定 loadout に必要、または Documents / Sections / Reader / editor core など既存中核機能と強く結合する場合だけ built-in 化できる。
3. **記録義務**: Built-in 化する場合は `USER_REQUEST_LEDGER` または関連 spec に、Local Mod ではなく built-in が必要な理由を残す。
4. **1 トピック原則**: 既存 built-in gadget の Mod 化・削除・統合は、候補を 1 件に絞って別スライスで扱う。

## Non-Goals

- リモート URL からの Mod 読み込み。
- iframe sandbox / 権限 UI / 公式リポジトリ。
- 既存 built-in gadget の一括 Mod 化。
- loadout と Mod 有効状態の統合。loadout は配置、Mod enable はインストール状態を扱う。

## File Contract

```json
{
  "plugins": [
    {
      "id": "sample-word-count-gadget",
      "name": "文字数Modサンプル",
      "type": "gadget",
      "description": "ローカルMod形式のサンプルガジェット。",
      "src": "js/plugins/sample-word-count-gadget/index.js",
      "enabled": false
    }
  ]
}
```

- `id`: 一意の Mod ID。
- `src`: `js/plugins/*.js` または `js/plugins/<mod-id>/*.js`。`..` と外部 URL は禁止。
- `enabled`: manifest の既定値。設定 UI の保存値がある場合はそちらを優先する。

## Gadget Registration Contract

Local Gadget Mod は `window.ZWPlugin.register()` を使い、`api.gadgets.register()` で gadget を登録する。gadget 専用 settings UI が必要な場合は `api.gadgets.registerSettings()` で同じ Mod 境界へ登録する。

```js
window.ZWPlugin.register({
  id: 'sample-word-count-gadget',
  name: '文字数Modサンプル',
  type: 'gadget',
  init(api) {
    api.gadgets.register('SampleWordCountMod', render, {
      title: '文字数Modサンプル',
      groups: ['assist'],
      kind: 'tool'
    });
  }
});
```

`api.gadgets.register()` 経由の gadget は `source: 'plugin'` と `pluginId` を持つ。enabled Mod は現在の built-in loadout に明示列挙されていなくても、指定 group の候補として表示される。

正式な開発インターフェースは次の通り。

- manifest: `id`, `name`, `type`, `description`, `src`, `enabled`
- plugin registration: `window.ZWPlugin.register({ id, name, type, init(api) { ... } })`
- gadget registration: `api.gadgets.register(name, render, { title, groups, kind, defaultCollapsed })`
- gadget settings registration: `api.gadgets.registerSettings(name, renderSettings)`
- enable storage: `zw_plugin_manager_enabled`

## Settings Contract

- 設定モーダルの `ローカルMod` は manifest 上の Mod を一覧する。
- Toggle は `ZWPluginManager.setEnabled(id, boolean)` を呼ぶ。
- 反映が reload 後になる場合は `再読み込みで有効化` / `再読み込みで停止` を表示する。
- `?embed=1` では plugin manager を自動 bootstrap しない。

## Drift Guardrails

- 新しい低頻度 gadget を built-in rack に追加する前に、Local Gadget Mod として成立するかを検討する。
- Built-in 化する場合は、日常執筆の基盤に必要な理由を `USER_REQUEST_LEDGER` または関連 spec に残す。
- `LoadoutManager` / `GadgetPrefs` は built-in gadget 整理のための管理面であり、Mod enable 状態の正本にしない。
- Mod enable 状態は plugin manager、gadget 配置は loadout、gadget 内部設定は `ZWGadgets` prefs が担当する。
- `choice` plugin は既存互換の command plugin として維持し、gadget Mod へ寄せない。

## Verification

- `e2e/plugin-manager.spec.js`
  - manifest plugin が非 embed で読み込まれる。
  - settings から local gadget Mod の enable 状態を保存できる。
  - enable 済み local gadget Mod が `source: 'plugin'` の gadget として登録される。
