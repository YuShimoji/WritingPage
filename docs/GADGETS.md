# GADGETS — サイドバーのガジェット化

 本書は `#gadgets-panel` に小型ウィジェット（ガジェット）を配置する仕組みの設計と実装指針を示します。

> 注記: 本書には「現行実装の説明」と「将来設計/未実装案（旧計画メモを含む）」が混在しています。節タイトルと本文中の説明でステータス（現行/設計案）を明示するよう順次整理していきます。

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

## Sidebar と ZWGadgets の責務（Cフェーズ設計メモ）

- 本セクションは 2025Q4 Cフェーズでの整理方針メモであり、現行コードを大きく壊さずに責務の境界を明確にすることを目的とします。

### Sidebar（タブ/パネル管理）

- 主担当: `SidebarManager`（`js/sidebar-manager.js`）。
- DOM:
  - タブ: `.sidebar-tab[data-group="<groupId>"]`
  - パネル: `.sidebar-group[data-group="<groupId>"]`
- 役割:
  - 開閉状態（`open` クラス等）とアクティブ状態（`active`、`aria-selected` / `aria-hidden`）を一元管理します。
  - グループ切替時に `ZWLoadoutGroupChanged` イベントを発火します。

### ZWGadgets（ガジェット描画）

- 主担当: `ZWGadgets`（`js/gadgets.js`）。
- DOM:
  - コンテナ: `.gadgets-panel[data-gadget-group="<groupId>"]`
  - 各ガジェット: `.gadget-wrapper[data-gadget-name="<Name>"]`
- 役割:
  - `ZWGadgets.register(name, factory, { groups: [...] })` でガジェットを登録します。
  - `ZWGadgets.init(selector, { group })` でコンテナに紐づくレンダラを登録し、ロードアウトに応じて再描画します。
  - タブや `.sidebar-group` 自体の生成・表示制御は将来的に Sidebar 側へ寄せる想定です（`ZWGadgets.addTab/removeTab` は互換目的で残しつつ縮小方向）。

### data-属性ベースの安定セレクタ

- テストや拡張時には、次の data-属性を安定セレクタとして優先的に用います。
  - `data-group="<groupId>"` … Sidebar のタブおよびカテゴリパネル。
  - `data-gadget-group="<groupId>"` … 各カテゴリ内のガジェットコンテナ。
  - `data-gadget-name="<Name>"` … 各ガジェットインスタンス。
- `groupId` は現行では `structure` / `typography` / `assist` / `wiki` を基準とし、ロードアウト設定のキーとも一致させます。

### 今後の整理方針（ドラフト）

- タブ構成の SSOT を `SidebarManager.sidebarTabConfig` に集約し、タブの追加/削除は基本的に Sidebar 側の API から行うようにします。
- `.gadgets-panel[data-gadget-group]` への `ZWGadgets.init()` 呼び出しは、アプリ初期化コードからのみ行うことを推奨します。
- `ZWGadgets.addTab/removeTab` によるタブ生成は、既存ロードアウト互換のため当面は維持しつつも、新規機能では Sidebar 側の仕組みを優先します。

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
  (function () {
    var isEmbed = /(?:^|[?&])embed=1(?:&|$)/.test(location.search);
    if (isEmbed) return;
    function load(src) {
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      document.body.appendChild(s);
    }
    load('js/gadgets.js');
  })();
</script>
```

```js
// カスタムガジェットの登録例
ZWGadgets.register('Sample', function (el) {
  var p = document.createElement('p');
  p.textContent = 'Hello Gadget!';
  el.appendChild(p);
});
// DOM Ready 時に自動で ZWGadgets.init() が走る
```

## ガジェット追加手順（最短）

1. `js/gadgets.js` にガジェットを登録

```js
// 例: WritingGoal と同等の最小構成
ZWGadgets.register(
  'MyGadget',
  function (el, api) {
    var box = document.createElement('div');
    box.textContent = 'MyGadget is here!';
    el.appendChild(box);
  },
  { groups: ['assist'], title: 'MyGadget' },
);
```

2. ロードアウトへ含める（任意）

```js
// 既定プリセットに含めたい場合は DEFAULT_LOADOUTS を編集
// assist や typography 等の希望グループへガジェット名を追加
```

3. 設定UIを付ける（任意）

```js
ZWGadgets.registerSettings('MyGadget', function (panel, ctx) {
  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!ctx.get('enabled', true);
  cb.addEventListener('change', function () {
    ctx.set('enabled', !!cb.checked);
  });
  panel.appendChild(cb);
});
```

4. 並び順・折りたたみは自動保存

- ヘッダの「↑/↓」「▼/▶」操作は `prefs.order` / `prefs.collapsed` に自動保存されます。
- ドラッグ＆ドロップでも並び替え可能です。

5. テスト

- 画面で追加ガジェットが表示されること。
- 必要なら `ZWGadgets.assignGroups('MyGadget', ['assist'])` で所属を動的変更。

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
  "collapsed": { "Clock": false },
  "settings": { "Clock": { "hour24": true } }
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
ZWGadgets.move('Clock', 'down');

// Clock を折りたたむ/展開
ZWGadgets.toggle('Clock');

// 直接プリファレンスを書き換えて再描画
const prefs = ZWGadgets.getPrefs();
prefs.order = ['Clock'];
ZWGadgets.setPrefs(prefs);
```

## 将来拡張（旧計画メモ・要見直し）

> この節は当初の計画メモであり、2025-11 時点では一部が既に実装済み・一部が未実装の状態です。詳細な実装状況は本書の各セクションおよびコード（`js/gadgets.js`）・BACKLOG を参照してください。

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
ZWGadgets.registerSettings('Sample', function (panelEl, ctx) {
  const enable = document.createElement('input');
  enable.type = 'checkbox';
  enable.checked = !!ctx.get('enabled', false);
  enable.addEventListener('change', () => ctx.set('enabled', !!enable.checked));
  panelEl.appendChild(enable);
});
```

- ガジェット本体の factory には `api` が渡されます。

```js
ZWGadgets.register('Sample', function (el, api) {
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
ZWGadgets.registerSettings('Clock', function (el, ctx) {
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

## HUDSettings ガジェット

HUD（Heads-Up Display）の表示設定を管理するガジェットです。フェードイン/アウト型ミニHUDの位置・色・サイズ・メッセージなどを調整できます。

### 設定項目

- **位置 (Position)**: HUDの表示位置（bottom-left, bottom-right, top-left, top-right）
- **フェード時間 (Duration)**: メッセージの表示継続時間（500-5000ms）
- **背景色 (Background Color)**: HUDの背景色（カラーピッカー）
- **文字色 (Text Color)**: HUDの文字色（カラーピッカー）
- **不透明度 (Opacity)**: HUDの透明度（0.1-1.0の範囲）
- **幅 (Width)**: HUDの幅（120-800px）
- **フォントサイズ (Font Size)**: HUDの文字サイズ（10-24px）
- **メッセージ (Message)**: デフォルトで表示するメッセージ
- **常に表示 (Pinned)**: HUDを常に表示するか（チェックボックス）

### 既定値

```json
{
  "position": "bottom-left",
  "duration": 1200,
  "bg": "#000000",
  "fg": "#ffffff",
  "opacity": 0.75,
  "width": 240,
  "fontSize": 14,
  "message": "",
  "pinned": false
}
```

### 設定範囲

- 幅: 120-800px（ウィンドウ幅の80%以内に制限）
- フォントサイズ: 10-24px
- 不透明度: 0.1-1.0
- フェード時間: 500-5000ms

### 使用方法

1. サイドバーの「アシスト」タブで「HUD設定」をクリック
2. 各項目を調整
3. 「設定を保存」ボタンをクリックして反映
4. 即座にHUDの表示が更新されます

### プログラムからの制御

```js
// HUD設定を直接適用
const hudConfig = {
  position: 'top-right',
  bg: '#ff0000',
  fg: '#ffffff',
  width: 300,
  fontSize: 16
};

if (window.ZenWriterHUD && window.ZenWriterHUD.applyConfig) {
  window.ZenWriterHUD.applyConfig(hudConfig);
}

// 設定に保存
const settings = window.ZenWriterStorage.loadSettings();
settings.hud = hudConfig;
window.ZenWriterStorage.saveSettings(settings);
```

## Story Wiki ガジェット

物語Wikiは、小説執筆時に登場人物、場所、プロットなどの情報を整理するためのWiki機能を提供します。各ページはタイトル、本文、タグで構成され、検索やリンク機能で効率的に管理できます。

### 機能概要

- **ページ管理**: 作成、編集、削除、一覧表示
- **検索機能**: タイトル、本文、タグからの全文検索
- **タグ付け**: ページのカテゴライズと整理
- **ローカル保存**: localStorageを使用した永続化
- **E2Eテスト**: `e2e/wiki.spec.js` により、ページ作成・検索・編集・空状態など物語Wikiの基本フローを自動検証

### ページ構造

各Wikiページは以下のフィールドを持ちます：

```json
{
  "id": "wiki_1640995200000",
  "title": "主人公",
  "content": "主人公の詳細な説明...",
  "tags": ["character", "main", "protagonist"],
  "createdAt": 1640995200000,
  "updatedAt": 1640995200000
}
```

### 使用方法

1. Wikiタブを開く（サイドバー上部のタブから「Wiki」を選択）
2. 「新規ページ作成」ボタンをクリック
3. タイトル、本文、タグを入力して保存
4. 既存ページはリストからクリックして編集
5. 検索ボックスでページを検索

### テンプレートの活用

Wikiページ作成時に以下のテンプレートを使用することを推奨：

- **キャラクター**: 外見、性格、背景、動機などの情報
- **場所**: 地理的特徴、雰囲気、重要性などの情報  
- **アイテム**: 外見、効果、使用方法などの情報
- **プロット**: 出来事の時系列、因果関係などの情報

### プログラムからの操作

```js
// Wikiページを作成
const newPage = window.ZenWriterStorage.createWikiPage({
  title: '魔法の剣',
  content: '古代の魔法が込められた剣。敵を一撃で倒す力を持つ。',
  tags: ['item', 'weapon', 'magic']
});

// Wikiページを検索
const results = window.ZenWriterStorage.searchWikiPages('魔法');

// Wikiページを更新
window.ZenWriterStorage.updateWikiPage(pageId, {
  content: '更新された説明...'
});

// Wikiページを削除
window.ZenWriterStorage.deleteWikiPage(pageId);
```

### バックアップとエクスポート

WikiデータはlocalStorageに保存されるため、ブラウザの設定からエクスポート/インポート可能です。定期的なバックアップを推奨します。

### 制限事項

- 現在、ページ間のリンク機能は未実装
- AI統合による自動生成機能は今後の拡張予定
- 画像添付機能は未対応（テキストベースのみ）
