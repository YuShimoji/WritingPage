# Plugin System Design — Zen Writer

**Status**: Background design / Local Gadget Mod MVP implemented / remote sandbox deferred
**Created**: 2026-03-02  
**Owner**: Worker  

---

## 1. Position

Zen Writer のプラグインシステムは、コアコードを変更せずにカスタム機能を追加するための背景設計です。現行の開発手順と仕様正本は、このファイルではなく次を参照します。

- 開発ワークフロー: `docs/PLUGIN_GUIDE.md`
- Local Gadget Mod 仕様: `docs/specs/spec-local-gadget-mods.md`
- built-in gadget 一覧と loadout 境界: `docs/GADGETS.md`

このファイルは API の方向性、信頼モデル、将来 deferred 項目を保持します。旧手順や将来構想は、現行ワークフローを上書きしません。

## 2. Current Model

現行は **Trusted local plugins only** です。

- `js/plugins/manifest.json` からローカル JS を読み込む。
- `js/plugins/<mod-id>/index.js` 形式の folder entry を推奨する。
- 設定モーダルの `ローカルMod` で enable / disable を保存する。
- enable / disable の反映は reload 後でよい。
- リモート URL、iframe sandbox、権限 UI、公式 plugin repository は deferred。

旧「index.html の末尾へ手動 `<script>` 追加」は historical pattern です。現行の Local Gadget Mod 開発では manifest 登録を使います。

## 3. Plugin Types

| Type | Current status | Notes |
|------|----------------|-------|
| `gadget` | supported | `api.gadgets.register()` で category group に表示する。Local Gadget Mod の主対象 |
| `command` | compatibility | `choice.js` のような既存 `window.ZenWriterPlugins` 互換を維持 |
| `theme` | API background | `api.themes.register()` の背景設計はあるが、今回の Mod 開発導線の主対象ではない |
| `export` | deferred | 現フェーズの対象外 |

## 4. API Surface

Local Gadget Mod は `window.ZWPlugin.register()` を通じて登録します。

```js
window.ZWPlugin.register({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  type: 'gadget',
  init(api) {
    api.gadgets.register('MyGadget', function (container, gadgetApi) {
      container.textContent = 'Hello from plugin!';
    }, { title: 'My Gadget', groups: ['assist'], kind: 'tool' });
  }
});
```

主な API:

```ts
interface ZWPluginAPI {
  gadgets: {
    register(name: string, factory: GadgetFactory, options?: GadgetOptions): void;
    getSetting(name: string, key: string, def?: any): any;
    setSetting(name: string, key: string, val: any): void;
  };
  themes: {
    register(themeId: string, palette: ThemePalette): void;
  };
  storage: {
    get(key: string): any;
    set(key: string, value: any): void;
    remove(key: string): void;
  };
  events: {
    on(eventName: string, handler: Function): void;
    off(eventName: string, handler: Function): void;
    emit(eventName: string, detail?: any): void;
    onZW(eventName: string, handler: Function): void;
  };
}
```

## 5. Security Model

| Level | Status | Constraints |
|-------|--------|-------------|
| Trusted local | current | ユーザーがローカル配置した JS。`js/plugins/*.js` / `js/plugins/<mod-id>/*.js` のみ |
| Sandboxed remote | deferred | iframe sandbox / postMessage / limited API が必要 |
| Verified repository | deferred | 公式 repo / review / distribution policy が必要 |

現行制約:

- `..` を含む plugin path や外部 URL は拒否する。
- plugin storage は plugin ID prefix 付き localStorage を使う。
- Gadget Mod は渡された container 内を主な描画領域とする。
- `window.ZWGadgets._list` など private state への直接依存は避ける。

## 6. Implementation Status

- [x] `js/plugin-api.js`: `window.ZWPlugin` 公開、gadget / theme / storage / events API。
- [x] `js/plugin-manager.js`: manifest-driven local loader。
- [x] `js/plugins/manifest.json`: `choice` と sample gadget Mod を登録。
- [x] `js/gadgets-plugin-manager.js`: 設定モーダル内 `ローカルMod` UI。
- [x] `api.gadgets.register()` 経由の gadget に `source: 'plugin'` / `pluginId` を付与。
- [ ] Remote sandbox。
- [ ] Verified plugin repository。

## 7. Deferred Questions

- plugin ID を `org.domain.plugin-name` 形式へ寄せるか。
- gadget 以外の plugin type をいつ product surface に出すか。
- remote sandbox 時の permission model と配布責任をどう分けるか。
