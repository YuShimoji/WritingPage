# GADGETS — サイドバーのガジェット化

本書は `#gadgets-panel` に小型ウィジェット（ガジェット）を配置する仕組みの設計と実装指針を示します。

## 方針

- ガジェットは小さな自己完結UI。時計/タイマー/進捗/ショートカット等を想定。
- 初期ロード負荷を抑えるため、`?embed=1` では読み込まない（親サイトに埋め込み時は最小UIを維持）。
- セキュリティ: DOM操作とストレージ範囲は最小限。postMessage等の外部通信は現時点では行わない。
- サイドバーはアコーディオンでグルーピングし、縦長化を防ぎつつ主要カテゴリ（章管理/外観/アシスト）を切り替えられるようにする。
- ユーザーはプリセット（ロードアウト）を保存・切替でき、用途に応じて表示するガジェット集合を最小構成にできるようにする。

## レイアウト刷新（Accordion Framework, 2025Q4設計）

- サイドバーは最大3階層（カテゴリ → ガジェット → ガジェット設定）で構成し、カテゴリは常時1つのみ展開。
- 既定カテゴリ案:
  - **Structure**: 章/シーン一覧、アウトライン、分岐プレビュー。
  - **Typography**: フォント切替、行間、テーマ、ビューワーレイアウト。
  - **Assist**: 文字数/HUD、AI要約、進捗、リマインダー。
- 各カテゴリは `data-gadget-group` 属性で識別し、読み込み時に`ZWGadgets.initGroup(groupId)`を使用してラベル・順序を適用する。
- スクロール負荷軽減のため、カテゴリ切替時に非表示パネルは`aria-hidden="true"`としてDOMを持続させつつリフローを抑制。

### UI仕様

- カテゴリタブは左サイドバー上部に横並び、キーボード操作は `Alt + 1/2/3` でフォーカス。
- 各ガジェットセクションは従来のヘッダ（▼/▶, ⚙, ↑/↓）を維持しつつ、アコーディオン内でのみ表示。
- `Alt + W` でツールバーを隠した際もカテゴリタブは `focus-within` に応じてフェード表示。
- Embed モード（`?embed=1`）ではカテゴリタブ全体を非表示とし、`assist`系のみ HUD に転換する（詳細は `docs/EMBED_SDK.md` と同期）。

### 現行ステータス（2025-10-20）

- `Documents`、`Outline`、`HUDSettings`、`TypographyThemes`、`Clock` がガジェット化済み。
  - `Documents` と `Outline` は `structure` タブの `#structure-gadgets-panel` に表示。
  - `HUDSettings` は `assist` タブに表示。
  - `TypographyThemes` は `typography` タブに表示。
  - `Clock` はデフォルトで `assist` に配置。
- 従来の `js/outline.js` は動的ロードから外し、UI はガジェット版へ移行。
- ロードアウト切替時には `ZWGadgets` が各ガジェットの所属カテゴリを再割り当てし、タブ表示と紐づく。
- `ZWGadgets.addTab(name, label)`: 新しいタブを動的に追加可能。ガジェットグループを拡張。
- `ZWGadgets.removeTab(name)`: タブを削除。
- 印刷/PDF機能をDocumentsガジェットに統合。

## ロードアウトプリセット

- LocalStorage にプリセット一覧を保持する（キー: `zenWriter_gadgets:loadouts`）。
- プリセット構造案:

```json
{
  "active": "novel-standard",
  "entries": {
    "novel-standard": {
      "label": "小説・長編",
      "groups": {
        "structure": ["Outline", "SceneList"],
        "typography": ["Font", "Theme"],
        "assist": ["HUD", "WordCount"]
      }
    },
    "vn-layout": {
      "label": "ビジュアルノベル",
      "groups": {
        "structure": ["SceneGraph", "BranchPreview"],
        "typography": ["Viewport", "Transition"],
        "assist": ["AssetPalette", "AIRecap"]
      }
    }
  }
}
```

- API追加案:
  - `ZWGadgets.defineLoadout(name, config)` — プリセットを登録。
  - `ZWGadgets.applyLoadout(name)` — カテゴリごとのガジェットリストを切替。
  - `ZWGadgets.listLoadouts()` / `ZWGadgets.deleteLoadout(name)` — 管理用。
- 実装済みAPI（2025-10-19時点）:
  - `ZWGadgets.getActiveLoadout()` — 現在適用中のロードアウト情報を取得。
  - `ZWGadgets.captureCurrentLoadout(label?)` — DOM上の配置からロードアウト構造を採取。
  - `ZWGadgets.assignGroups(name, groups)` — 既登録ガジェットのカテゴリを動的再設定。
  - `ZWGadgets.setActiveGroup(groupId)` — タブ切替に合わせて描画を更新。
  - 主要イベント: `ZWGadgetsReady`, `ZWLoadoutsChanged`, `ZWLoadoutApplied`, `ZWLoadoutDeleted`, `ZWLoadoutGroupChanged`。

### ロードアウトUI（現況）

- `index.html` のサイドバー上部に以下のUIを配置し、`js/gadgets.js` で連携済み。
  - セレクト: `#loadout-select`
  - 名前入力: `#loadout-name`
  - 操作: `#loadout-save`（保存/新規定義）、`#loadout-apply`（適用）、`#loadout-delete`（削除）
- 保存時は現在のガジェット配置を `captureCurrentLoadout()` で採取し、`defineLoadout()` → `applyLoadout()` の順に反映。
- 複製は「対象を選択→適用→名前を入力→保存」で実現可能（専用ボタンは今後の候補）。
- UI
  - カテゴリタブ右側にプリセットドロップダウンを配置し、「保存」「複製」「削除」操作を提供。
  - プリセット切替後は `ZWGadgets.importPrefs()` に近いフローで order/collapsed/settings を再構成。
- Embed モードではホストから `sdk.setLoadout(name)` を呼び出すことでロードアウトを同期できるよう、Embed SDK v2 でイベント定義予定。

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

## 設定のインポート/エクスポート（Mission 6）

- 目的
  - ガジェットの順序/開閉状態/個別設定を JSON として保存・復元できるようにします。
- UI
  - サイドバー「ガジェット」セクションに以下の操作ボタンを追加
    - 「ガジェット設定をエクスポート」: 現在の設定を JSON でダウンロード
    - 「ガジェット設定をインポート」: JSON ファイルを選択して設定を復元
- 保存形式
  - LocalStorage キー: `zenWriter_gadgets:prefs`
  - JSON 例:

```json
{
  "order": ["Clock"],
  "collapsed": {"Clock": false},
  "settings": {"Clock": {"hour24": true}}
}
```

### API

- `ZWGadgets.exportPrefs(): string` — 現在の設定を整形済み JSON 文字列で返します
- `ZWGadgets.importPrefs(jsonOrObject): boolean` — インポートを実行し、成功で `true`

### 手動手順

1. 「ガジェット設定をエクスポート」を押してJSONを保存
2. JSON を編集（例: `settings.Clock.hour24` を `false` に変える）
3. 「ガジェット設定をインポート」から当該 JSON を指定
4. Clock の 12/24 表示が反映され、必要に応じて順序/開閉も復元される

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

## 手動テスト手順（設定保存/折りたたみ/並び替え）

1. `/` を開く
2. サイドバー「ガジェット」セクションで、Clock の「▼」をクリックして本文を表示/非表示できること
3. 「↑」「↓」で順序が変わること（Clock が上下に移動）
4. ページをリロードし、開閉状態と順序が保持されていること
5. `?embed=1` ではガジェットが表示されないことを確認

## ドラッグ＆ドロップ並び替え（Mission 5）

- サイドバーの各ガジェットはヘッダ（タイトル行）をドラッグして並び替えが可能です。
- フォールバックとして従来の「↑/↓」ボタンも維持しています（キーボード操作向け）。

### 備考

- 内部的には `dataTransfer.setData('text/gadget-name', <name>)` を用い、`drop` 時に順序配列（prefs.order）を更新します。

## 設定UIフレームワーク（Mission 5）

- ガジェットごとに設定パネルを提供できます。登録 API は以下です。

```js
// 設定UIの登録（ガジェット名ごと）
ZWGadgets.registerSettings('Sample', function(panelEl, ctx){
  const enable = document.createElement('input');
  enable.type = 'checkbox';
  enable.checked = !!ctx.get('enabled', false);
  enable.addEventListener('change', () => ctx.set('enabled', !!enable.checked));
  panelEl.appendChild(enable);
});
```

- ガジェット本体の factory には `api` が渡されます。

```js
ZWGadgets.register('Sample', function(el, api){
  const enabled = api.get('enabled', false);
  // ...
});
```

### 提供されるコンテキスト API

- factory の第2引数 `api`、および settings の第2引数 `ctx` は以下を持ちます。
  - `get(key, default)` 設定値の取得
  - `set(key, value)` 設定値の保存（保存後は自動で再描画）
  - `prefs()` 現在のプリファレンスオブジェクト取得
  - `refresh()` 明示的な再描画要求

### 例: Clock の 12/24 時間表示

```js
// 表示ロジック（抜粋）
const hour24 = api.get('hour24', true);
```

設定UI:

```js
ZWGadgets.registerSettings('Clock', function(el, ctx){
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!ctx.get('hour24', true);
  cb.addEventListener('change', () => ctx.set('hour24', !!cb.checked));
  el.appendChild(cb);
});
```

## テスト（追加事項）

- `scripts/dev-check.js` は次を静的に検証します。
  - DnD: `draggable=true`、`dataTransfer.setData('text/gadget-name', ...)`、`drop` リスナーの存在
  - 設定UI: `registerSettings/getSettings/setSetting` の存在
