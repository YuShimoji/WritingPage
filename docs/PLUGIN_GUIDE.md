# PLUGIN_GUIDE — Local Gadget Mod 開発ワークフロー

最終更新: 2026-05-10

## 位置付け

このファイルは **Local Gadget Mod を開発するときの正本ワークフロー**です。
実装境界の正本は `docs/specs/spec-local-gadget-mods.md`、既存 built-in gadget の一覧と配置は `docs/GADGETS.md`、プラグインシステムの背景設計は `docs/design/PLUGIN_SYSTEM.md` を参照してください。

現フェーズは **Trusted local plugins only** です。ローカルに置いた JS を `js/plugins/manifest.json` から読み込み、設定モーダルの `ローカルMod` で有効化します。

## 開発ワークフロー

1. **候補判定**
   - 低頻度、実験的、個人用途、まだ標準 loadout に入れる根拠が弱い gadget は Mod-first で作る。
   - 日常執筆の基盤、既定 loadout に必要、または既存中核機能と強く結合するものだけ built-in 化を検討する。
2. **フォルダ作成**
   - Mod 本体は `js/plugins/<mod-id>/index.js` に置く。
   - 新しいテンプレートファイルは増やさず、`js/plugins/sample-word-count-gadget/index.js` を最小例として参照する。
3. **manifest 登録**
   - `js/plugins/manifest.json` の `plugins` に 1 件追加する。
   - 初期状態は試験中なら `enabled: false` を推奨する。
4. **ZWPlugin API 登録**
   - `window.ZWPlugin.register()` で Mod を登録し、gadget は `api.gadgets.register()` で追加する。
   - gadget 専用の設定 UI が必要な場合は `api.gadgets.registerSettings()` で同じ Mod 境界に登録する。
   - `api.gadgets.register()` 経由の gadget は `source: 'plugin'` / `pluginId` を持つ。
5. **ローカルMod有効化**
   - 設定モーダルの `ローカルMod` で有効化する。
   - 保存先は `localStorage` の `zw_plugin_manager_enabled`。
6. **reload 確認**
   - enable / disable の反映は reload 後でよい。
   - 読み込み済み JS の完全 unload は現行 MVP の対象外。
7. **検証 / closeout**
   - manifest と spec index の JSON parse、必要に応じて `plugin-manager.spec.js` を実行する。
   - built-in 化した場合だけ、理由を `docs/USER_REQUEST_LEDGER.md` または関連 spec に残す。

## manifest 形式

```json
{
  "plugins": [
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "type": "gadget",
      "description": "任意の説明",
      "src": "js/plugins/my-plugin/index.js",
      "enabled": false
    }
  ]
}
```

- `id`: 一意な ID。
- `name`: 設定画面に出す名前。
- `type`: `gadget` / `command` などの種別。
- `description`: 任意の説明。
- `src`: `js/plugins/*.js` または `js/plugins/<mod-id>/*.js` のローカルパス（`.js` 必須）。
- `enabled`: manifest 上の初期値。設定 UI の保存値がある場合はそちらが優先される。

## Gadget Mod の最小形

```javascript
window.ZWPlugin.register({
  id: 'my-plugin',
  name: 'My Plugin',
  type: 'gadget',
  init(api) {
    api.gadgets.register('MyPluginGadget', function (root) {
      root.textContent = 'Hello from Local Gadget Mod';
    }, {
      title: 'My Plugin',
      groups: ['assist'],
      kind: 'tool',
      defaultCollapsed: true
    });
  }
});
```

`groups` は `sections` / `structure` / `edit` / `theme` / `assist` / `advanced` のいずれかを使います。Mod の enable 状態は plugin manager、表示位置は gadget registration の `groups` と loadout、内部設定は `ZWGadgets` prefs または Mod が接続する既存 storage が担当します。

設定 UI が必要な Mod は、main gadget と同じ `init(api)` 内で登録します。

```javascript
api.gadgets.registerSettings('MyPluginGadget', function (root, ctx) {
  root.textContent = 'Settings for My Plugin';
});
```

## 有効/無効の優先順位

1. `ZWPluginManager.setEnabled(id, bool)` で保存されたローカル設定。
2. `manifest.json` の `enabled`。

ローカル設定は `localStorage` の `zw_plugin_manager_enabled` に保存されます。設定画面で切り替えた場合、反映は再読み込み後です。

## 既存互換の command plugin

同梱の `choice.js` は既存互換の command plugin として `window.ZenWriterPlugins` を使います。これは gadget Mod へ寄せず、互換ルートとして維持します。

```javascript
window.ZenWriterPlugins.register({
  id: 'my-action',
  name: 'My Action',
  actions: [
    { label: '操作名', handler: function () { /* ... */ } }
  ]
});
```

## セキュリティ制約

- 許可される `src` は `js/plugins/*.js` または `js/plugins/<mod-id>/*.js` のローカル JS のみ。
- `..` を含むパスや外部 URL は拒否される。
- sandbox / remote plugin / 公式 plugin repo は将来フェーズの対象。

## 検証コマンド

docs-only のワークフロー整理:

```powershell
git diff --check
node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"
```

manifest / sample / plugin API に触れた場合:

```powershell
node --check js/plugin-manager.js js/plugin-api.js js/gadgets-plugin-manager.js js/plugins/sample-word-count-gadget/index.js js/plugins/pomodoro-timer-gadget/index.js
node -e "JSON.parse(require('fs').readFileSync('js/plugins/manifest.json','utf8'))"
npx playwright test e2e/plugin-manager.spec.js --workers=1 --reporter=line
npm run test:smoke
npm run lint:js:check
```
