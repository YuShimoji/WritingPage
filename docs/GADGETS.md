# GADGETS — サイドバーのガジェット化

本書は `#gadgets-panel` に小型ウィジェット（ガジェット）を配置する仕組みの設計と実装指針を示します。

## 方針

- ガジェットは小さな自己完結UI。時計/タイマー/進捗/ショートカット等を想定。
- 初期ロード負荷を抑えるため、`?embed=1` では読み込まない（親サイトに埋め込み時は最小UIを維持）。
- セキュリティ: DOM操作とストレージ範囲は最小限。postMessage等の外部通信は現時点では行わない。

## 実装概要

- `index.html` に `#gadgets-panel` を追加
- 非埋め込み時のみ `js/gadgets.js` を動的ロード
- `js/gadgets.js` は以下を提供:
  - `ZWGadgets.register(name, factory)` でガジェットを登録
  - `ZWGadgets.init(selector)` でコンテナへマウント（既定 `#gadgets-panel`）
  - 例として `Clock` ガジェットを内蔵

## 使い方

```html
<!-- index.html（抜粋） -->
<div id="gadgets-panel" class="gadgets-panel"></div>
<script>
(function(){
  var isEmbed = /(?:^|[?&])embed=1(?:&|$)/.test(location.search);
  if (isEmbed) return;
  function load(src){ var s=document.createElement('script'); s.src=src; s.defer=true; document.body.appendChild(s); }
  load('js/gadgets.js');
})();
</script>
```

```js
// カスタムガジェットの登録例
ZWGadgets.register('Sample', function(el){
  var p = document.createElement('p');
  p.textContent = 'Hello Gadget!';
  el.appendChild(p);
});
// DOM Ready 時に自動で ZWGadgets.init() が走る
```

## テスト

- `scripts/dev-check.js` が以下を自動検証
  - `/` のHTMLに `#gadgets-panel` が存在
  - `/js/gadgets.js` が 200 で取得可能
  - `/index.html?embed=1` に静的な `<script src="js/gadgets.js">` が含まれない

## 設定保存/折りたたみ/並び替え（v0.3.13+）

- 仕組み
  - LocalStorage キー: `zenWriter_gadgets:prefs`
  - 構造: `{ order: string[], collapsed: Record<string, boolean>, settings: Record<string, any> }`
- API
  - `ZWGadgets.getPrefs()` / `ZWGadgets.setPrefs(prefs)`
  - `ZWGadgets.toggle(name)` … ガジェットの開閉トグル
  - `ZWGadgets.move(name, dir)` … 並び替え（`'up'|'down'`）
- UI
  - 各ガジェットのヘッダに 開閉ボタン（▼/▶）と 上下ボタン（↑/↓）を配置
- 例

```js
// Clock を下へ移動
ZWGadgets.move('Clock', 'down')

// Clock を折りたたむ/展開
ZWGadgets.toggle('Clock')

// 直接プリファレンスを書き換えて再描画
const prefs = ZWGadgets.getPrefs()
prefs.order = ['Clock']
ZWGadgets.setPrefs(prefs)
```

## 将来拡張
- ガジェット設定の保存/復元（LocalStorage）
- 並び替え/折りたたみ
- プラグインと同等の拡張ポイント化
