# GADGETS — サイドバーのガジェット化

 本書は `.gadgets-panel[data-gadget-group]` に小型ウィジェット（ガジェット）を配置する仕組みの設計と実装指針を示します。

## このドキュメントの読み方

- [現行リファレンス（現行）](#reference-current)  
  いま使える UI / 実装 / テスト情報を網羅。作業や検証はまずここを参照してください。
- [提案・未実装 / 旧メモ](#reference-future)  
  将来案や残課題を一覧化。詳細な優先度・タスクは `docs/ROADMAP.md` で管理します。
- 関連資料
  - `docs/ARCHITECTURE.md` … Zen Writer 全体アーキテクチャとガジェット基盤の位置付け
  - `docs/ROADMAP.md` … ロードマップと将来計画

---

<a id="reference-current" aria-hidden="true"></a>

## 現行リファレンス（現行）

> 注記: 本節は現行実装の説明のみを扱います。開発途上の検討事項は末尾の「提案・未実装 / 旧メモ」を参照してください。

### 現行セクション一覧

- [基本方針](#基本方針)
- [レイアウト構造とカテゴリ](#レイアウト構造とカテゴリ現行)
- [Sidebar と ZWGadgets の責務](#sidebar-と-zwgadgets-の責務現行)
- [ロードアウトプリセット](#ロードアウトプリセット現行)
- [実装概要 / 使い方 / テスト](#実装概要)
- [設定インポート/エクスポート](#設定インポートエクスポート現行)
- [設定保存やドラッグ操作](#設定保存折りたたみ並び替えv0313)
- [個別ガジェット（HUDSettings / Story Wiki）](#hudsettings-ガジェット)

### 基本方針

- ガジェットは小さな自己完結UI。タイマー/進捗/ショートカット等を想定。
- 初期ロード負荷を抑えるため、`?embed=1` では読み込まない（親サイトに埋め込み時は最小UIを維持）。
- セキュリティ: DOM操作とストレージ範囲は最小限。postMessage等の外部通信は現時点では行わない。
- サイドバーはアコーディオンでグルーピングし、縦長化を防ぎつつ主要カテゴリ（章管理/外観/アシスト）を切り替えられるようにする。
- ユーザーはプリセット（ロードアウト）を保存・切替でき、用途に応じて表示するガジェット集合を最小構成にできるようにする。

### レイアウト構造とカテゴリ（現行）

- サイドバーはアコーディオン形式で6カテゴリに分類。各カテゴリは折りたたみ可能。
- 現行カテゴリ（`index.html` の `data-category` 属性と一致）:
  1. **sections**: セクションナビゲーション（SP-052、見出しツリー）
  2. **structure**: 構成管理（ドキュメント、アウトライン、スナップショット、タグ）
  3. **edit**: 画像、選択肢、プレビュー、装飾、アニメーション（Story Wiki は **structure**）
  4. **theme**: 表示調整（テーマ、フォント、VisualProfile、見出しスタイル）
  5. **assist**: 執筆継続の補助（目標、集中、参照、タイマー）
  6. **advanced**: 詳細設定と運用管理（表示、出力、ショートカット、ロードアウト）
- 各カテゴリは `data-gadget-group` 属性で識別し、`ZWGadgets.init(panel, { group })` でレンダリング。
- スクロール負荷軽減のため、非展開カテゴリは `aria-hidden="true"` とし、DOMを保持したままリフローを抑制。

> **SP-070 連動**: Focusモードではサイドバーが非表示となり、代わりにChapterListパネルが表示される。
> **SP-076 将来変更**: ドックパネル実装時にガジェット配置構造が変わる可能性がある。

#### UI仕様（現行）

- カテゴリヘッダークリックでアコーディオン展開/折りたたみ。複数同時展開可能。
- 各ガジェットセクションは従来のヘッダ（▼/▶, ⚙, ↑/↓）を維持しつつ、アコーディオン内でのみ表示。
- Embed モード（`?embed=1`）ではサイドバー全体を非表示とする（詳細は `docs/EMBED_SDK.md` と同期）。

#### 登録ガジェット一覧（28個）

> Session 19 (2026-03-23) で33→28に整理。削除: Clock/Samples/NodeGraph/GraphicNovel/UIDesign/SceneGradient。

| # | Name | Title | Group | Description | File |
|---|------|-------|-------|-------------|------|
| 1 | SectionsNavigator | セクションナビ | sections | 見出しツリーのリアルタイムナビゲーション (SP-052)。独立アコーディオンカテゴリに配置。 | gadgets-sections-nav.js |
| 2 | Outline | アウトライン | structure | 見出しをツリー表示し、クリックで本文へ移動。 | gadgets-builtin.js |
| 3 | Documents | ドキュメント | structure | ドキュメント階層をツリー表示し、並び替え・移動を管理。 | gadgets-documents-hierarchy.js |
| 4 | StoryWiki | Story Wiki | structure | Wiki形式のストーリーノート管理。ページ作成・リンク・検索が可能。 | story-wiki.js |
| 5 | TagsAndSmartFolders | タグ/スマートフォルダ | structure | タグ分類とスマートフォルダでページを整理。 | gadgets-tags-smart-folders.js |
| 6 | SnapshotManager | バックアップ | structure | スナップショットの保存・復元と履歴管理。 | gadgets-snapshot.js |
| 7 | Images | 画像 | edit | 挿入・管理と、コラージュ用レイアウト設定。 | gadgets-images.js |
| 8 | ChoiceTools | 選択肢 | edit | インタラクティブ小説向けの選択肢・ジャンプ記法を本文に挿入します。 | gadgets-choice.js |
| 9 | MarkdownPreview | Markdownプレビュー | edit | 編集画面の横に Markdown を並列表示し、本文とスクロール同期します。 | gadgets-editor-extras.js |
| 10 | FontDecoration | フォント装飾 | edit | 太字・斜体・傍点・影などを選択範囲に適用（ツールバー装飾と同系）。 | gadgets-editor-extras.js |
| 11 | TextAnimation | テキストアニメーション | edit | フェード・タイプライター・バウンスなどを選択範囲に適用します。 | gadgets-editor-extras.js |
| 12 | Typography | フォント | theme | フォント・文字サイズ・行間を調整。 | gadgets-typography.js |
| 13 | Themes | テーマ | theme | テーマプリセットと背景・文字色を調整。 | gadgets-themes.js |
| 14 | VisualProfile | Visual Profile | theme | テーマ・フォント・レイアウトをまとめたプロファイルを管理・適用。 | gadgets-visual-profile.js |
| 15 | HeadingStyles | 見出しスタイル | theme | 見出しプリセット選択と H1-H6 の個別調整。 | gadgets-heading.js |
| 16 | WritingGoal | 執筆目標 | assist | 文字数・期限の目標を設定し進捗を可視化。 | gadgets-goal.js |
| 17 | Typewriter | Typewriter | assist | カーソル行を画面中央へ寄せて視線移動を低減。 | gadgets-editor-extras.js |
| 18 | FocusMode | Focus Mode | assist | 編集中の段落以外を減光して集中を維持。 | gadgets-editor-extras.js |
| 19 | HUDSettings | HUD設定 | assist | HUDの位置・表示時間・見た目を調整。 | gadgets-hud.js |
| 20 | PomodoroTimer | Pomodoro/集中タイマー | assist | 作業と休憩のタイマーを切り替えて集中を維持。 | gadgets-pomodoro.js |
| 21 | MarkdownReference | Markdownリファレンス | assist | Markdown記法・ショートカット・拡張記法を参照。 | gadgets-markdown-ref.js |
| 22 | UISettings | UI Settings | advanced | 表示方式・サイドバー配置・改行時の装飾挙動を調整。 | gadgets-editor-extras.js |
| 23 | EditorLayout | Editor Layout | advanced | 本文の最大幅・内余白・余白背景色を調整。 | gadgets-editor-extras.js |
| 24 | LinkGraph | Link Graph | advanced | Wikiリンクの関係性をグラフで可視化。ページ間のつながりを俯瞰。 | link-graph.js |
| 25 | GadgetPrefs | ガジェット設定 | advanced | ガジェット表示状態と設定JSONの入出力を管理。 | gadgets-prefs.js |
| 26 | LoadoutManager | ロードアウト管理 | advanced | 用途別ロードアウトの保存・複製・適用を管理。 | gadgets-loadout.js |
| 27 | Keybinds | キーボードショートカット | advanced | ショートカットの確認・変更・競合解決を管理。 | gadgets-keybinds.js |
| 28 | PrintSettings | エクスポート | advanced | 印刷プレビューとTXT出力を実行。 | gadgets-print.js |

| # | Name | 状態 | 理由 |
|---|------|------|------|
| - | Clock | 削除 | OS時計で十分 |
| - | Samples | 削除 | 開発専用 |
| - | NodeGraph | 削除 | ニッチ (小説執筆の核ではない) |
| - | GraphicNovel | 削除 | ニッチ (6モジュール含む) |
| - | UIDesign | 無効化 | 背景グラデーション、テーマに概念統合 |
| - | SceneGradient | 無効化 | 3層グラデーション、ニッチ |

#### グループ別集計

| Group | 数 | 主な用途 |
|-------|----|----------|
| structure | 5 | 文書構造・ナビゲーション |
| edit | 5 | 編集・装飾・プレビュー |
| theme | 4 | テーマ・フォント・視覚設定 |
| assist | 6 | 執筆支援・タイマー・集中・リファレンス |
| advanced | 6 | UI設定・グラフ・管理ツール |
| sections | 1 | セクションナビゲーション (SP-052) |

- ロードアウト切替時には `ZWGadgets` が各ガジェットの所属カテゴリを再割り当てし、アコーディオン表示と紐づく。

### Sidebar と ZWGadgets の責務（現行）

#### Sidebar（タブ/パネル管理）

- 主担当: `SidebarManager`（`js/sidebar-manager.js`）。
- DOM:
  - タブ: `.sidebar-tab[data-group="<groupId>"]`
  - パネル: `.sidebar-group[data-group="<groupId>"]`
- 役割:
  - 開閉状態（`open` クラス等）とアクティブ状態（`active`、`aria-selected` / `aria-hidden`）を一元管理する。
  - グループ切替時に `ZWGadgets.setActiveGroup(groupId)` を呼び出し、ガジェット描画の更新をトリガーする（`ZWLoadoutGroupChanged` は `ZWGadgets` 側で発火）。

#### ZWGadgets（ガジェット描画）

- 主担当: `ZWGadgets`（`js/gadgets-core.js`、`js/gadgets-utils.js`、`js/gadgets-loadouts.js`）。
- DOM:
  - コンテナ: `.gadgets-panel[data-gadget-group="<groupId>"]`
  - 各ガジェット: `.gadget-wrapper[data-gadget-name="<Name>"]`
- 役割:
  - `ZWGadgets.register(name, factory, { groups: [...] })` でガジェットを登録。
  - `ZWGadgets.init(selector, { group })` でコンテナに紐づくレンダラを登録し、ロードアウトに応じて再描画。
  - タブや `.sidebar-group` の生成・表示制御は Sidebar 側が担う。動的タブ追加/削除 API は廃止済み（アコーディオンシステムに移行）。

#### data-属性ベースの安定セレクタ

- テストや拡張時には次の data-属性を安定セレクタとして使用する。
  - `data-group="<groupId>"` … Sidebar のタブおよびカテゴリパネル。
  - `data-gadget-group="<groupId>"` … 各カテゴリ内のガジェットコンテナ。
  - `data-gadget-name="<Name>"` … 各ガジェットインスタンス。
- `groupId` は `sections` / `structure` / `edit` / `theme` / `assist` / `advanced` を基準とし、ロードアウト設定のキーと一致。
- 旧グループ名 `typography` / `wiki` / `settings` は互換用に `gadgets-utils.js` の `GADGET_GROUPS` に残存するが、`index.html` のアコーディオンには使用されない。

## ロードアウトプリセット（現行）

- LocalStorage にプリセット一覧を保持する（キー: `zenWriter_gadgets:loadouts`）。
- プリセット構造（例: `novel-standard`）と LocalStorage 書式:

```json
{
  "active": "novel-standard",
  "entries": {
    "novel-standard": {
      "label": "小説・長編",
      "groups": {
        "sections": ["SectionsNavigator"],
        "structure": ["Outline", "Documents"],
        "edit": ["StoryWiki"],
        "theme": ["Themes", "Typography"],
        "assist": ["WritingGoal", "HUDSettings"],
        "advanced": ["PrintSettings"]
      }
    }
  }
}
```

- 実装済みAPI（2025-10-19時点）:
  - `ZWGadgets.getActiveLoadout()` — 現在適用中のロードアウト情報を取得。
  - `ZWGadgets.captureCurrentLoadout(label?)` — DOM上の配置からロードアウト構造を採取。
  - `ZWGadgets.assignGroups(name, groups)` — 既登録ガジェットのカテゴリを動的再設定。
  - `ZWGadgets.setActiveGroup(groupId)` — タブ切替に合わせて描画を更新。
  - 主要イベント: `ZWLoadoutsChanged`, `ZWLoadoutDefined`, `ZWLoadoutApplied`, `ZWLoadoutDeleted`, `ZWLoadoutGroupChanged`。

### ロードアウトUI（現況）

- `index.html` の `.sidebar-loadout` に `js/gadgets-loadout.js` がロードアウトUIを動的生成します。
  - セレクト: `#loadout-select`
  - 名前入力: `#loadout-name`
  - 操作: `#loadout-save`（保存/新規定義）、`#loadout-duplicate`（複製）、`#loadout-apply`（適用）、`#loadout-delete`（削除）
- 保存時は現在のガジェット配置を `captureCurrentLoadout()` で採取し、`defineLoadout()` → `applyLoadout()` の順に反映。
- 複製は「対象を選択→適用→名前を入力→保存」で実現可能（専用ボタンは今後の候補）。
- UI
  - カテゴリタブ右側にプリセットドロップダウンを配置し、「保存」「複製」「削除」操作を提供。
  - プリセット切替後は `ZWGadgets.importPrefs()` に近いフローで order/collapsed/settings を再構成。
- **(将来案)** Embed モードではホストから `sdk.setLoadout(name)` を呼び出すことでロードアウトを同期できるよう、Embed SDK v2 でイベント定義を計画しています。

## 実装概要

- `index.html` に各カテゴリ用の `.gadgets-panel[data-gadget-group]` を配置（例: `sections` / `structure` / `edit` / `theme` / `assist` / `advanced`）
- ガジェット基盤は `js/gadgets-*.js` の複数ファイルで提供され、`index.html` から読み込まれます。
- 初期化は `js/gadgets-init.js` が `data-gadget-group` を基準に各パネルへ `ZWGadgets.init(panel, { group })` を適用します。

## 使い方

```html
<!-- index.html（抜粋） -->
<div id="assist-gadgets-panel" class="gadgets-panel" data-gadget-group="assist"></div>
<script src="js/gadgets-utils.js"></script>
<script src="js/gadgets-loadouts.js"></script>
<script src="js/gadgets-core.js"></script>
<script src="js/gadgets-builtin.js"></script>
<script src="js/gadgets-init.js"></script>
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

1. `js/gadgets-*.js`（例: `js/gadgets-builtin.js` または新規 `js/gadgets-<name>.js`）にガジェットを登録

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

1. ロードアウトへ含める（任意）

```js
// 既定プリセットに含めたい場合は DEFAULT_LOADOUTS を編集
// assist や typography 等の希望グループへガジェット名を追加
```

1. 設定UIを付ける（任意）

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

1. 並び順・折りたたみは自動保存

- ヘッダの「↑/↓」「▼/▶」操作は `prefs.order` / `prefs.collapsed` に自動保存されます。
- ドラッグ＆ドロップでも並び替え可能です。

1. テスト

- 画面で追加ガジェットが表示されること。
- 必要なら `ZWGadgets.assignGroups('MyGadget', ['assist'])` で所属を動的変更。

## テスト

- `scripts/dev-check.js` が以下を自動検証
  - `/` のHTMLに各グループ用ガジェットパネル（例: `#assist-gadgets-panel`）が存在
  - `/js/gadgets-core.js` が 200 で取得可能
  - `/index.html?embed=1` で Outline などの追加スクリプトが読み込まれない（軽量化）

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

- ガジェット単体の開閉（見出しの ▼/▶）の永続化は LocalStorage キー **`zenwriter-gadget-collapsed`**（ガジェット名 → 展開なら `true`）を `gadgets-core.js` が参照する。初回訪問でキーが無い場合のデフォルトは **Documents** と **Themes** のみ展開し、それ以外は閉じる。session 82 以降、**assist** 向けガジェットは `ZWGadgets.register(..., { defaultCollapsed: true })` で上記方針を明示（実効は従来と同様）。
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

## 手動テスト手順（設定保存/折りたたみ/並び替え）

1. `/` を開く
2. サイドバー「ガジェット」セクションで、Clock の「▼」をクリックして本文を表示/非表示できること
3. 「↑」「↓」で順序が変わること（Clock が上下に移動）
4. ページをリロードし、開閉状態と順序が保持されていること
5. `?embed=1` ではガジェットが表示されないことを確認

## ドラッグ＆ドロップ並び替え（Mission 5 / 現行）

- サイドバーの各ガジェットはヘッダ（タイトル行）をドラッグして並び替えが可能です。
- フォールバックとして従来の「↑/↓」ボタンも維持しています（キーボード操作向け）。

### 備考

- 内部的には `dataTransfer.setData('text/gadget-name', <name>)` を用い、`drop` 時に順序配列（prefs.order）を更新します。

## 設定UIフレームワーク（Mission 5 / 現行）

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

物語Wikiは、小説執筆時に登場人物、場所、プロットなどの情報を整理するためのWiki機能を提供します。カテゴリ分類と2ペイン構成（ツリー+詳細）で効率的に管理できます。

### 機能概要

- **カテゴリ分類**: 人物/場所/アイテム/組織/イベント/設定/その他の7種類+カスタムカテゴリ
- **ツリー+詳細ペイン**: 左側にツリー、右側に詳細を表示する2ペイン構成
- **用語自動検出**: エディタ内の用語を自動検出し、Wiki作成を提案
- **エディタ連携**: Wiki項目からエディタ内の該当箇所へジャンプ
- **ローカル保存**: localStorageを使用した永続化
- **E2Eテスト**: `e2e/story-wiki.spec.js` により、カテゴリ分類・ツリー操作・自動検出など Story Wiki の基本フローを自動検証

### ページ構造

各Wikiページは以下のフィールドを持ちます：

```json
{
  "id": "wiki_1640995200000",
  "title": "主人公",
  "content": "主人公の詳細な説明...",
  "category": "character",
  "createdAt": 1640995200000,
  "updatedAt": 1640995200000
}
```

### 使用方法

1. サイドバーの「編集」タブから「Story Wiki」を選択
2. カテゴリを選択（人物/場所/アイテムなど）
3. 「新規作成」ボタンでWikiページを作成
4. 左側のツリーからページを選択、右側の詳細ペインで編集
5. 検索ボックスでページを検索

### カテゴリ

- **人物 (character)**: 登場人物の情報
- **場所 (location)**: 舞台となる場所
- **アイテム (item)**: 重要なアイテム
- **組織 (organization)**: 組織・団体
- **イベント (event)**: 重要な出来事
- **設定 (worldbuilding)**: 世界観・設定
- **その他 (other)**: 未分類
- **カスタム**: ユーザー定義カテゴリ

### プログラムからの操作

```js
// Wikiページを作成
const newPage = window.ZenWriterStorage.createWikiPage({
  title: '魔法の剣',
  content: '古代の魔法が込められた剣。敵を一撃で倒す力を持つ。',
  category: 'item'
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

### 制限事項（SSOT 参照）

- Wiki の未実装項目（AI生成/グラフビュー）は `docs/specs/spec-story-wiki.md` Phase 2 を参照してください。

---

<a id="reference-future" aria-hidden="true"></a>

## 提案・未実装 / 旧メモ（提案）

> 本節は現行コードに未反映の検討事項をまとめています。詳細なタスク/スケジュールは `docs/ROADMAP.md` を参照してください。

### ガジェット/パネル設計の将来タスク (将来案)

1. **柔軟なタブ配置とガジェット動的割当**（`docs/ROADMAP.md` Priority B: サイドバー Phase 2-3）
   - タブを上下左右へ配置するレイアウト拡張や、ガジェットをドラッグで他タブへ移動する体験を計画中。
2. **HUD 拡張とカスタマイズ深化**
   - HUDSettings ガジェットへフォント/幅調整UIなどを段階的に追加済み。
3. **Wiki / ノードグラフ連携**
   - Wiki ノードグラフ化やAIリンク生成は仕様検討済みだが、実装は未着手。
   - 進める際は `docs/ARCHITECTURE.md` の「ガジェットベースアーキテクチャ」と整合を取る。
4. **Embed / SDK 連携の拡張**
   - Embed時のロードアウト反映や HUD の軽量化は `docs/TROUBLESHOOTING.md` を参照。`docs/EMBED_SDK.md` を併読してください。

### 参照ガイド

- 将来仕様の詳細: `docs/ROADMAP.md` を参照してください。
