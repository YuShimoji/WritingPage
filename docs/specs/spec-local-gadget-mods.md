# Local Gadget Mods

Status: done / MVP
Last updated: 2026-05-08

## Purpose

ガジェットは固定ラックではなく、後から着脱できるローカル Mod として扱える必要がある。Built-in gadget は日常執筆の基盤だけを担い、実験的・低頻度・個人用途の gadget は Local Gadget Mod として追加できる境界を保つ。

## Scope

- 対象は Trusted local plugins only。
- 初期 MVP は `js/plugins/manifest.json` に載ったローカル JS を起動時に読む。
- Mod ファイルは `js/plugins/<mod-id>/index.js` のように専用フォルダへ置ける。
- 有効/無効は設定モーダルの `ローカルMod` で切り替え、`localStorage` の `zw_plugin_manager_enabled` に保存する。
- enable / disable の反映は reload 後でよい。読み込み済み JS の完全 unload は MVP の対象外。

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

Local Gadget Mod は `window.ZWPlugin.register()` を使い、`api.gadgets.register()` で gadget を登録する。

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

## Verification

- `e2e/plugin-manager.spec.js`
  - manifest plugin が非 embed で読み込まれる。
  - settings から local gadget Mod の enable 状態を保存できる。
  - enable 済み local gadget Mod が `source: 'plugin'` の gadget として登録される。
