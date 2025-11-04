# Zen Writer アーキテクチャドキュメント

## 📋 目次
1. [概要](#概要)
2. [システム構成](#システム構成)
3. [主要コンポーネント](#主要コンポーネント)
4. [データフロー](#データフロー)
5. [重要な設計原則](#重要な設計原則)
6. [既知の問題と対策](#既知の問題と対策)

## 概要

Zen Writerは、小説執筆に特化したWebベースのテキストエディタです。

### 主な特徴
- **ミニマルなUI**: 執筆に集中できるシンプルなインターフェース
- **拡張可能なガジェットシステム**: プラグイン型の機能拡張
- **永続化されたデータ**: LocalStorageによる自動保存
- **リアルタイムMarkdownプレビュー**: 執筆と同時にプレビュー表示

## システム構成

### ディレクトリ構造

```
WritingPage/
├── index.html                 # メインHTML
├── css/
│   └── style.css             # メインスタイル
├── js/
│   ├── app.js                # アプリケーション制御（UI、イベント）
│   ├── editor.js             # エディタ機能（タイプライター、検索）
│   ├── storage.js            # データ永続化
│   ├── theme.js              # テーマ管理
│   ├── hud.js                # ヘッドアップディスプレイ
│   ├── gadgets.js            # ガジェットシステム
│   ├── wiki.js               # Wikiガジェット
│   ├── images.js             # 画像管理
│   └── plugins/              # プラグイン
├── docs/                     # ドキュメント
├── scripts/                  # 開発スクリプト
└── .windsurf/                # OpenSpec（変更管理）
```

### スクリプト読み込み順序

**重要**: スクリプトは以下の順序で読み込まれます：

1. `storage.js` - データ永続化（最優先）
2. `theme.js` - テーマ管理
3. `hud.js` - HUD表示
4. `editor.js` - エディタ機能
5. `app.js` - アプリケーション制御（最後）

## 主要コンポーネント

### 1. ElementManager クラス

**役割**: DOM要素の取得を中央集権的に管理

```javascript
class ElementManager {
    constructor() {
        this.elements = {};
        this.initialize();
    }
    
    get(name) { ... }        // 単一要素を取得
    getMultiple(name) { ... } // 複数要素を配列で取得
}
```

**重要なポイント**:
- `sidebarTabs`, `sidebarGroups`, `themePresets` は複数要素として取得
- その他の要素は単一要素として取得
- 取得失敗時はnullまたは空配列を返す

### 2. サイドバータブシステム

**タブ設定**:
```javascript
const sidebarTabConfig = [
    { id: 'structure', label: '構造', panelId: 'structure-gadgets-panel' },
    { id: 'typography', label: 'タイポ', panelId: 'typography-gadgets-panel' },
    { id: 'assist', label: 'アシスト', panels: ['plugins-panel', 'gadgets-panel'] },
    { id: 'editor', label: 'エディタ', content: 'editor-settings' }
];
```

**切り替えフロー**:
1. `activateSidebarGroup(groupId)` が呼ばれる
2. タブ設定から有効なgroupIdか確認
3. すべてのタブの`active`クラスを更新
4. すべてのグループパネルの表示状態を更新
5. `ZWGadgets.setActiveGroup()` を呼び出し

### 3. サイドバー開閉システム

**ボタンの役割**:
- `#toggle-sidebar`: サイドバーの開閉を切り替え（ツールバー）
- `#sidebar-header-close`: サイドバーを閉じる（サイドバーヘッダー内）
- `#toolbar-close-sidebar`: サイドバーを閉じる（ツールバー内、サイドバーが開いているときのみ表示）

**状態管理**:
```javascript
function forceSidebarState(open) {
    sidebar.classList.toggle('open', !!open);
    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    toolbarCloseSidebar.style.display = open ? '' : 'none';
}
```

### 4. ガジェットシステム

**ガジェット初期化**:
```javascript
window.ZWGadgets.init('#structure-gadgets-panel', { group: 'structure' });
window.ZWGadgets.init('#typography-gadgets-panel', { group: 'typography' });
window.ZWGadgets.init('#gadgets-panel', { group: 'assist' });
```

**アクティブグループ管理**:
```javascript
window.ZWGadgets.setActiveGroup(groupId);
```

## データフロー

### 1. アプリケーション起動

```
DOMContentLoaded
  ↓
デバッグモード設定
  ↓
必要なスクリプト確認
  ↓
ElementManager初期化
  ↓
タブ設定読み込み
  ↓
初期ドキュメント設定
  ↓
UI設定適用
  ↓
イベントリスナー設定
  ↓
ガジェット初期化
```

### 2. タブ切り替え

```
ユーザーがタブをクリック
  ↓
activateSidebarGroup(groupId)
  ↓
タブ設定から有効性確認
  ↓
すべてのタブのactive状態更新
  ↓
すべてのグループの表示状態更新
  ↓
ZWGadgets.setActiveGroup(groupId)
  ↓
applyTabsPresentationUI()
```

### 3. データ保存

```
エディタ入力
  ↓
自動保存トリガー（遅延）
  ↓
ZenWriterStorage.saveContent()
  ↓
LocalStorage保存
  ↓
HUD通知（オプション）
```

## 重要な設計原則

### 1. **ID の一意性**
- HTML内のすべてのIDは一意でなければならない
- 同じ機能を持つ複数のボタンには、異なるIDを付与

### 2. **要素の取得**
- すべての要素取得は`ElementManager`経由で行う
- 直接`document.getElementById()`を使用しない

### 3. **イベントリスナー**
- イベントリスナーは`DOMContentLoaded`内で設定
- 複数要素には`forEach`でリスナーを設定

### 4. **デバッグログ**
- 開発環境でのみログを出力（`localhost` / `127.0.0.1`）
- 本番環境ではエラーと警告のみ出力

### 5. **アクセシビリティ**
- `aria-hidden`, `aria-selected`, `aria-controls` を適切に設定
- `role="tablist"`, `role="tabpanel"` でタブ構造を明示

## 既知の問題と対策

### ❌ 問題1: 重複ID
**症状**: 複数の要素が同じIDを持つ
**原因**: HTML設計の不備
**対策**: すべてのIDを一意にする

### ❌ 問題2: 単一要素として取得された複数要素
**症状**: タブが1つしか動作しない
**原因**: `querySelector`で複数要素を取得
**対策**: `querySelectorAll`を使用し、`ElementManager`で管理

### ❌ 問題3: スコープ外の要素参照
**症状**: `elementManager is not defined`
**原因**: 関数スコープ外からアクセス
**対策**: `window.elementManager`としてグローバルに公開

### ✅ 対策済み
- ElementManagerによる中央集権的な要素管理
- 複数要素の適切な取得と管理
- デバッグログによる動作確認

## グローバルAPI

### ZenWriterAPI
```javascript
window.ZenWriterAPI = {
    getContent(),      // 現在の本文を取得
    setContent(text),  // 本文を設定
    focus(),           // エディタにフォーカス
    takeSnapshot()     // スナップショット作成
}
```

### ZenWriterTabs
```javascript
window.ZenWriterTabs = {
    getAvailableTabs(),  // 利用可能なタブ一覧
    getActiveTab(),      // 現在のアクティブタブ
    activateTab(tabId),  // タブをアクティブ化
    nextTab(),           // 次のタブへ
    prevTab()            // 前のタブへ
}
```

## 開発ガイドライン

### 新しいタブを追加する

1. `sidebarTabConfig` にタブ設定を追加
2. `index.html` にタブボタンとグループパネルを追加
3. 必要に応じてガジェット初期化を追加

### 新しいボタンを追加する

1. `ElementManager` の `elementMap` にボタンを追加
2. イベントリスナーセクションでリスナーを設定
3. 必要に応じてアクセシビリティ属性を設定

### デバッグ方法

1. ブラウザの開発者ツールを開く
2. コンソールで`[Zen Writer]`でフィルタリング
3. `window.elementManager.elements`で要素の取得状態を確認
4. `window.ZenWriterTabs.getAvailableTabs()`でタブの状態を確認

---

**更新日**: 2025-01-04  
**バージョン**: 0.3.14+
