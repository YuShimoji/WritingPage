# PLUGIN_GUIDE — ローカルプラグイン導入ガイド

最終更新: 2026-05-08

## 概要

Zen Writer は `js/plugins/manifest.json` を使って、ローカルプラグイン / Local Gadget Mod を起動時に読み込めます。
現フェーズは **Trusted local plugins only**（ローカル配置前提）です。正本仕様は `docs/specs/spec-local-gadget-mods.md` です。

## 1. 追加手順

1. Mod ファイルを `js/plugins/<mod-id>/` 配下に配置する
   例: `js/plugins/my-plugin/index.js`
2. `js/plugins/manifest.json` の `plugins` に1件追加する
3. 設定モーダルの `ローカルMod` で有効化する
4. アプリを再読み込みする

## 2. manifest 形式

```json
{
  "plugins": [
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "type": "gadget",
      "description": "任意の説明",
      "src": "js/plugins/my-plugin/index.js",
      "enabled": true
    }
  ]
}
```

- `id`: 一意なID
- `name`: 設定画面に出す名前
- `type`: `gadget` / `command` などの種別
- `description`: 任意の説明
- `src`: `js/plugins/*.js` または `js/plugins/<mod-id>/*.js` のローカルパス（`.js` 必須）
- `enabled`: `true` なら起動時にロード

## 3. 有効/無効の優先順位

1. `ZWPluginManager.setEnabled(id, bool)` で保存されたローカル設定
2. `manifest.json` の `enabled`

ローカル設定は `localStorage` の `zw_plugin_manager_enabled` に保存されます。
設定画面で切り替えた場合、反映は再読み込み後です。

## 4. プラグインAPI

### 4a. 正規API（`window.ZWPlugin`）

```javascript
window.ZWPlugin.register({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  init(api) {
    // api.gadgets  — カスタムガジェット登録・設定
    // api.themes   — カスタムテーマ登録
    // api.storage  — プラグイン固有 localStorage（自動プレフィクス付き）
    // api.events   — 名前空間付き CustomEvent 送受信
  }
});
```

DOM Ready前に登録された場合はキューイングされ、Ready後に `init()` が呼ばれます。

### 4b. 簡易レジストリ（`window.ZenWriterPlugins`）

エディタアクションのみ提供するプラグイン向けの軽量パターン:

```javascript
window.ZenWriterPlugins.register({
  id: 'my-action',
  name: 'My Action',
  actions: [
    { label: '操作名', handler: function() { /* ... */ } }
  ]
});
```

同梱の `choice.js` はこのパターンを使用しています（参考実装: `js/plugins/choice.js`）。

### 実装ファイル

- 正規API: `js/plugin-api.js`
- 簡易レジストリ: `js/plugins/registry.js`
- 設計ドキュメント: `docs/design/PLUGIN_SYSTEM.md`

## 5. セキュリティ制約

- 許可される `src` は `js/plugins/*.js` のみ
- `..` を含むパスや外部URLは拒否されます
- sandbox / remote plugin は将来フェーズの対象です
