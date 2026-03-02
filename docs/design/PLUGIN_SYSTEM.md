# Plugin System Design — Zen Writer

**Status**: Draft  
**Created**: 2026-03-02  
**Owner**: Worker  

---

## 1. Overview

Zen Writer のプラグインシステムは、コアコードを変更せずにカスタムガジェット・機能を追加できる仕組みです。

### Goals

- ユーザーがサードパーティのガジェットをロードできる
- コアAPIへの安全なアクセス（サンドボックス）
- 最小限のインターフェースで最大の拡張性
- 後方互換性の維持

---

## 2. Plugin Types

| タイプ | 説明 | 例 |
|--------|------|-----|
| **Gadget Plugin** | カスタムガジェット追加 | ポモドーロタイマー、カスタムカウンター |
| **Theme Plugin** | テーマ色パレット追加 | 独自カラースキーム |
| **Command Plugin** | コマンドパレットにコマンド追加 | カスタム変換処理 |
| **Export Plugin** | エクスポート形式追加 | LaTeX, EPUB 変換 |

---

## 3. API Surface

### 3.1 Plugin Registration

```js
// プラグインは window.ZWPlugin を通じて登録
window.ZWPlugin.register({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  author: 'Author Name',
  type: 'gadget',    // gadget | theme | command | export
  init(api) {
    // プラグイン初期化
    api.gadgets.register('MyGadget', (container, gadgetApi) => {
      container.textContent = 'Hello from plugin!';
    }, { title: 'My Gadget', groups: ['assist'] });
  }
});
```

### 3.2 Plugin API (api object)

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
  commands: {
    register(command: CommandDef): void;
  };
  storage: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
  events: {
    on(eventName: string, handler: Function): void;
    off(eventName: string, handler: Function): void;
    emit(eventName: string, detail?: any): void;
  };
}
```

### 3.3 What Plugins CANNOT Do

- DOMを直接操作（コアUIコンポーネント）— ただしガジェットの`container`内は自由
- localStorage内の `zw_*` 以外のキーへの書き込み
- `window.ZWGadgets._list` などプライベートプロパティへの直接アクセス
- ネットワークリクエスト（将来的にCSPで制限）

---

## 4. Security Model

### 4.1 Trust Levels

| レベル | 説明 | 制約 |
|--------|------|------|
| **Trusted** | ローカルで手動インストール | 制約なし（ユーザー責任） |
| **Sandboxed** | リモートURLからロード | iframe sandbox, LIMITED API |
| **Verified** | 公式プラグインリポジトリ | コードレビュー済み |

### 4.2 現フェーズ（v1）

- **Trusted Only**: localのJSファイルを手動で`<script>`タグに追加
- Content Security Policy でのリモートスクリプト制限は将来的に検討
- プラグインIDの重複チェック（上書き防止）

### 4.3 将来フェーズ（v2）

- iframe sandboxによるリモートプラグイン対応
- `postMessage` ベースの通信
- 権限システム（manifestで権限宣言）

---

## 5. Loading Mechanism

### 5.1 v1: 手動ロード

```html
<!-- index.html の末尾にユーザーが追加 -->
<script src="plugins/my-plugin.js"></script>
```

- `window.ZWPlugin.register()` がDOMReady後に実行
- 遅延登録に対応（`ZWPluginsReady` イベントを待つ）

### 5.2 v2: プラグインマニフェスト

```json
// plugins/manifest.json
{
  "plugins": [
    { "id": "my-plugin", "src": "plugins/my-plugin.js", "enabled": true }
  ]
}
```

- UI設定画面からプラグイン有効/無効を切り替え
- `ZWPluginManager.loadManifest()` が起動時に実行

---

## 6. Implementation Plan

### Phase 1 (v1) — 現実装可能

- [ ] `js/plugin-api.js` 作成（`window.ZWPlugin` 公開）
- [ ] `ZWPlugin.register()` → `window.ZWGadgets.register()` へのブリッジ
- [ ] `ZWPlugin.events` → `CustomEvent` ラッパー
- [ ] `ZWPlugin.storage` → `localStorage` ラッパー（`zw_plugin_<id>_` プレフィックス）
- [ ] ドキュメント: `docs/PLUGIN_GUIDE.md`

### Phase 2 (v2) — 将来

- [ ] プラグインマネージャーUI
- [ ] リモートプラグインのsandbox対応
- [ ] 公式プラグインリポジトリ

---

## 7. Example Plugin

```js
// plugins/word-frequency.js
(function() {
  'use strict';

  function init() {
    if (!window.ZWPlugin) {
      console.warn('[word-frequency] ZWPlugin API not available');
      return;
    }

    window.ZWPlugin.register({
      id: 'word-frequency',
      name: 'Word Frequency Counter',
      version: '1.0.0',
      type: 'gadget',
      init(api) {
        api.gadgets.register('WordFrequency', (container, gadgetApi) => {
          const btn = document.createElement('button');
          btn.textContent = '頻度分析';
          btn.addEventListener('click', () => {
            const editor = document.getElementById('editor');
            if (!editor) return;
            const text = editor.value || editor.textContent || '';
            const words = text.match(/\S+/g) || [];
            const freq = {};
            words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
            const top = Object.entries(freq)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([w, n]) => `${w}: ${n}`)
              .join(', ');
            container.querySelector('.result').textContent = top || '（テキストなし）';
          });
          const result = document.createElement('div');
          result.className = 'result';
          result.style.cssText = 'margin-top:6px;font-size:12px;word-break:break-all;';
          container.appendChild(btn);
          container.appendChild(result);
        }, { title: '単語頻度', groups: ['assist'] });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

---

## 8. Open Questions

1. プラグインIDの名前空間は `org.domain.plugin-name` 形式にするか？
2. ガジェット以外のプラグインタイプの優先度は？
3. エラーハンドリング: プラグイン初期化失敗時にアプリをクラッシュさせないか（現在は try/catch で保護）

---

*このドキュメントはドラフトです。実装フェーズに合わせて更新してください。*
