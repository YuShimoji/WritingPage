# PLUGIN_GUIDE — ローカルプラグイン導入ガイド

最終更新: 2026-03-09

## 概要

Zen Writer は `js/plugins/manifest.json` を使って、ローカルプラグインを起動時に読み込めます。  
現フェーズは **Trusted local plugins only**（ローカル配置前提）です。

## 1. 追加手順

1. プラグインファイルを `js/plugins/` 配下に配置する  
   例: `js/plugins/my-plugin.js`
2. `js/plugins/manifest.json` の `plugins` に1件追加する
3. アプリを再読み込みする

## 2. manifest 形式

```json
{
  "plugins": [
    {
      "id": "my-plugin",
      "src": "js/plugins/my-plugin.js",
      "enabled": true
    }
  ]
}
```

- `id`: 一意なID
- `src`: `js/plugins/*.js` のローカルパス（`.js` 必須）
- `enabled`: `true` なら起動時にロード

## 3. 有効/無効の優先順位

1. `ZWPluginManager.setEnabled(id, bool)` で保存されたローカル設定
2. `manifest.json` の `enabled`

ローカル設定は `localStorage` の `zw_plugin_manager_enabled` に保存されます。

## 4. プラグインAPI（Phase 1）

プラグインは `window.ZWPlugin.register({...})` で登録できます。  
利用可能APIは `gadgets`, `themes`, `storage`, `events` です。

実装: `js/plugin-api.js`  
設計: `docs/design/PLUGIN_SYSTEM.md`

## 5. セキュリティ制約

- 許可される `src` は `js/plugins/*.js` のみ
- `..` を含むパスや外部URLは拒否されます
- sandbox / remote plugin は将来フェーズの対象です
