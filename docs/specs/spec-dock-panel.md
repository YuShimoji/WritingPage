# ドックパネルシステム仕様書 (SP-076)

## 概要

現在のサイドバー固定配置を拡張し、ガジェットパネルを上下左右の任意の位置に
ドッキングできるシステムを提供する。
ユーザーが自分の作業スタイルに合わせてUI配置をカスタマイズできるようにする。

SP-070 (モードアーキテクチャ) の **Editor モード** 専用の拡張機能として位置づける。

---

## 背景課題

- 現在のサイドバーは右固定のみで、左利きユーザーやマルチモニタ環境に対応できない
- Wiki、設定、構造管理など異なる用途のパネルを同一サイドバーに詰め込んでいる
- フローティングパネルは存在するが、ドッキング（スナップ）できない
- IDEのようなパネル配置の自由度がない

---

## 目的

- パネルを上下左右にドッキングできるようにする
- 複数パネルを同時に表示できるようにする（例: 左にチャプターリスト、右にWiki）
- パネル配置をユーザー設定として保存する
- Editor モード専用とし、Focus / Blank では非表示

---

## 機能仕様

### 1. ドック位置

```
        ┌──── top ────┐
        │             │
  left  │   editor    │  right
        │             │
        └── bottom ───┘
```

| 位置 | 用途の例 |
|------|----------|
| left | チャプターリスト、構造ガジェット |
| right | 現行サイドバー（ガジェット群）、Wiki |
| top | ツールバー拡張（将来） |
| bottom | ステータスバー拡張、ターミナル的UI（将来） |

### 2. パネル操作

| 操作 | 動作 |
|------|------|
| ドラッグ | パネルヘッダーをドラッグしてドック位置を変更 |
| リサイズ | パネル境界をドラッグしてサイズ変更 |
| 切り離し | パネルヘッダーをダブルクリックでフローティングに変換 |
| ドッキング | フローティングパネルをエッジにスナップしてドッキング |
| 折りたたみ | パネルヘッダーをクリックで最小化（タブのみ表示） |
| タブ化 | 同一位置に複数パネルを重ねるとタブグループになる |

### 3. デフォルト配置

初期状態（現行互換）:

| 位置 | パネル |
|------|--------|
| right | サイドバー（全ガジェット） |
| bottom | ステータスバー |

ユーザーが配置を変更すると、その状態が保存される。

### 4. プリセット配置

よく使う配置パターンをプリセットとして提供:

| プリセット名 | 配置 |
|-------------|------|
| デフォルト | right: サイドバー |
| 執筆ワイド | left: チャプターリスト, right: なし |
| リサーチ | left: チャプターリスト, right: Wiki |
| フル装備 | left: 構造, right: ガジェット, bottom: Wiki |

ユーザーカスタム配置も名前をつけて保存可能。

---

## データモデル

```
// localStorage key: "zenwriter-dock-layout"
{
  "activePreset": "default" | "custom-name",
  "panels": {
    "left": {
      "visible": true,
      "width": 280,
      "tabs": [
        { "id": "chapter-list", "title": "チャプター", "type": "builtin" },
        { "id": "sections-nav", "title": "セクション", "type": "gadget" }
      ],
      "activeTab": 0
    },
    "right": {
      "visible": true,
      "width": 320,
      "tabs": [
        { "id": "sidebar-gadgets", "title": "ガジェット", "type": "sidebar" }
      ],
      "activeTab": 0
    },
    "top": null,
    "bottom": {
      "visible": true,
      "height": 28,
      "tabs": [
        { "id": "status-bar", "title": "ステータス", "type": "builtin" }
      ],
      "activeTab": 0
    }
  },
  "floating": [
    {
      "id": "wiki-panel",
      "title": "Wiki",
      "x": 100,
      "y": 200,
      "width": 400,
      "height": 500
    }
  ],
  "userPresets": {}
}
```

---

## モードとの関係

| モード | ドックパネルの動作 |
|--------|-------------------|
| Editor | フル機能。全パネル表示。配置変更可能 |
| Focus | ドックパネル非表示。左パネルはFocus専用のChapterList |
| Blank | ドックパネル非表示 |

Editor モードからFocusに切り替えた場合:

- ドックパネルの状態は保持（非表示になるだけ）
- Editor に戻ると元の配置が復元

---

## 段階的実装

### Phase 1: 左右ドック [done]

- 現行の右サイドバーを「右ドックパネル」として扱う
- 左ドックパネルを新設（ChapterList等の配置先）
- サイドバーの左右移動（ボタン操作）
- リサイズハンドルによる幅調整
- レイアウト永続化（localStorage）
- E2E: 13件

### Phase 2: タブグループ [done]

- 同一ドック位置に複数パネルをタブとして重ねる
- タブの切り替え・並び替え（HTML drag API）
- タブバーは2タブ以上で自動表示（上部タブ形式）
- タブごとのコンテンツパネル切り替え
- ヘッダータイトルがアクティブタブ名に連動
- タブ状態（配列+activeTab）の永続化
- 決定: 上部タブ / 既存ドックに追加 / 全ガジェット可
- API: addTab / removeTab / setActiveTab / reorderTabs / getTabs / getActiveTabIndex
- E2E: 13件

### Phase 3: フローティング & スナップ [done]

- パネルの切り離し（floatTab → フローティングパネル化）
- フローティングパネルのポインターイベントベースドラッグ
- フローティングパネルの右下リサイズハンドル
- 左端スナップゾーン（40px閾値）でドック復帰
- フローティング位置・サイズの永続化
- Focus/Blank/Readerモードでフローティングも非表示
- 最後のタブをfloat時に左パネル自動非表示
- API: floatTab / snapToDock / closeFloating / getFloating
- E2E: 10件

### Phase 4: ドックレイアウトプリセット [todo]

> 決定 (2026-03-24): top/bottom ドックはスコープ外。プリセットのみ実装。
> 決定 (2026-03-24): UIは既存 LoadoutManager ガジェットに統合。

既存のガジェットロードアウトシステムにドックレイアウト状態を統合し、
一つのプリセットでガジェット配置 + ドックレイアウトの両方を保存・復元する。

#### 体験ゴール

ユーザーが「執筆モード」「リサーチモード」等の作業スタイルをワンクリックで切り替えられる。
切り替え時にガジェット構成とパネル配置が同時に変わり、作業コンテキストに最適化されたUIになる。

#### ユーザー操作列

1. サイドバー advanced → ロードアウト管理 を開く
2. ドロップダウンからプリセットを選択 → 「適用」で即座にレイアウト切替
3. 現在のレイアウトを「保存」で名前を付けて保存 (ガジェット+ドック状態の両方)
4. 不要なカスタムプリセットを「削除」で消去

#### 機能仕様

##### 4-1. ロードアウトデータモデル拡張

既存の `{label, groups}` 構造に `dockLayout` フィールドを追加:

```javascript
// localStorage key: 'zenWriter_gadgets:loadouts'
{
  active: 'novel-standard',
  entries: {
    'novel-standard': {
      label: '小説・長編',
      groups: { /* 既存: ガジェット配置 */ },
      dockLayout: {
        sidebarDock: 'right',        // サイドバー位置
        leftPanel: {
          visible: false,            // 左パネル表示
          width: 280,                // 左パネル幅
          tabs: [],                  // 左パネルタブ構成
          activeTab: 0
        },
        rightPanel: {
          width: 320                 // サイドバー幅
        }
        // floating は含めない (フローティング状態はレイアウトプリセットに不向き)
      }
    }
  }
}
```

**後方互換**: `dockLayout` が undefined のプリセットは、ドックレイアウトを変更せず
ガジェット配置のみ適用する (既存動作を維持)。

##### 4-2. 組み込みプリセットのドックレイアウト定義

| プリセット名 | ガジェット | ドックレイアウト |
|-------------|-----------|----------------|
| novel-standard (小説・長編) | 既存21個 | right: sidebar(320px), left: 非表示 |
| novel-minimal (ミニマル) | 既存10個 | right: sidebar(280px), left: 非表示 |
| vn-layout (ビジュアルノベル) | 既存20個 | right: sidebar(320px), left: 非表示 |
| screenplay (脚本・シナリオ) | 既存13個 | right: sidebar(300px), left: 非表示 |

> 注: 組み込みプリセットは現行互換 (右サイドバーのみ) を維持する。
> 左パネル活用プリセットは、ユーザーが自作するか、将来追加する。

##### 4-3. captureCurrentLoadout 拡張

`ZWGadgets.captureCurrentLoadout(label)` が返すオブジェクトに
`dockLayout` を含めるよう拡張する:

```javascript
captureCurrentLoadout(label) {
  const groups = /* 既存: 現在のガジェット配置をキャプチャ */;
  const dockLayout = window.ZenDockManager
    ? ZenDockManager.captureLayout()  // 新規API
    : undefined;
  return { label, groups, dockLayout };
}
```

##### 4-4. applyLoadout 拡張

`ZWGadgets.applyLoadout(name)` がドックレイアウトも適用するよう拡張:

```javascript
applyLoadout(name) {
  const entry = /* 既存: ロードアウトエントリ取得 */;
  /* 既存: ガジェット配置の適用 */;
  if (entry.dockLayout && window.ZenDockManager) {
    ZenDockManager.applyLayout(entry.dockLayout);  // 新規API
  }
}
```

##### 4-5. DockManager 新規 API

| メソッド | 説明 |
|---------|------|
| `captureLayout()` | 現在のドックレイアウト状態をオブジェクトとして返す (floating除外) |
| `applyLayout(layout)` | ドックレイアウトを適用 (サイドバー位置/左パネル状態/幅) |

##### 4-6. UI変更 (LoadoutManager ガジェット)

**変更なし**: 既存の save/load/delete/duplicate ボタンがそのまま機能する。
`captureCurrentLoadout` が自動的にドックレイアウトを含めるため、
ユーザーは意識せずにレイアウト状態を保存・復元できる。

唯一の追加: プリセット選択時のツールチップまたは説明に
「ガジェット構成とパネル配置を復元します」の文言を追加。

#### 成功条件

1. プリセット適用時にガジェット配置とドックレイアウト (サイドバー位置/左パネル表示/幅) が同時に切り替わる
2. 「保存」で現在のガジェット+ドックレイアウトが名前付きプリセットとして保存される
3. `dockLayout` がないレガシープリセットはガジェットのみ適用 (後方互換)
4. プリセット切替時にフローティングパネルの状態は維持される (プリセットに含めない)
5. Focus/Blank/Reader モードではプリセット切替の効果が Editor 復帰時に反映される

#### 影響範囲

- `js/gadgets-core.js`: captureCurrentLoadout / applyLoadout の拡張
- `js/dock-manager.js`: captureLayout / applyLayout API追加
- `js/loadouts-presets.js`: 組み込みプリセットに dockLayout 追加
- `js/gadgets-loadout.js`: ツールチップ文言追加 (最小変更)
- E2E: 新規テスト 5-8件

#### 実装タスク (別Worker向け)

1. DockManager に captureLayout / applyLayout API 追加
2. gadgets-core.js の captureCurrentLoadout / applyLoadout 拡張
3. loadouts-presets.js の組み込みプリセットに dockLayout 追加
4. normalizeLoadouts で dockLayout の正規化 (undefined許容)
5. E2E テスト作成
6. 手動確認: プリセット切替でサイドバー位置+左パネルが連動変更されること

---

## 成功状態

- サイドバーを左に移動できる
- 左にチャプターリスト、右にWikiを同時表示できる
- パネル配置が保存され、次回起動時に復元される
- Focusモードに切り替えるとパネルが非表示になり、戻ると復元される

---

## 未決定事項

- [x] ドラッグ時のドロップターゲットの視覚表現 → スナップゾーン（左端40px、アクセントカラー半透明）
- [x] モバイル / タブレットでのドックパネルの扱い → レスポンシブ時は無効化（768px以下）
- [x] ガジェットのドックパネル対応改修の範囲 → 全ガジェット可（HUMAN_AUTHORITY決定済み）
- [x] パネルの最小幅 / 最大幅の制約値 → min:180px / max:50vw (ドック), min:200x150 (フローティング)
- [ ] 右端スナップゾーンの追加（現在は左端のみ）
- [ ] ドラッグ中のゴースト表示改善
- [x] ユーザープリセットの保存 → Phase 4 で LoadoutManager に統合 (2026-03-24)
- [ ] top/bottom ドック → スコープ外 (2026-03-24: ユースケース不明のため延期)

---

## 既存仕様との関係

| 仕様 | 関係 |
|------|------|
| SP-070 モードアーキテクチャ | Editorモード専用機能 |
| SP-051 ガジェットUX改善 | ガジェットのパネル化に影響 |
| SP-071 チャプター管理 | ChapterListパネルの配置先 |

---

## 影響範囲

- 新規 `js/dock-manager.js`: ドックレイアウト管理
- `js/sidebar-manager.js`: ドックパネルの一種として再定義
- `css/style.css`: ドックレイアウトのCSS Grid / Flexbox
- `index.html`: ドック位置のマウントポイント追加
