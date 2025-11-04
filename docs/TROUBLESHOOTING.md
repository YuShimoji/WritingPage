# Zen Writer トラブルシューティングガイド

## 🐛 よくある問題と解決方法

### 問題1: サイドバーが閉じ切らない

**症状**:
- サイドバーの閉じるボタンをクリックしても、サイドバーが閉じない
- サイドバーが半開きの状態で固まる

**原因**:
1. 重複IDによる要素取得の失敗
2. イベントリスナーが正しく設定されていない
3. CSSのトランジションが完了していない

**解決方法**:

#### ステップ1: 開発者ツールで確認
```javascript
// ブラウザコンソールで実行
console.log('[Debug] sidebar:', document.getElementById('sidebar'));
console.log('[Debug] close buttons:', {
    header: document.getElementById('sidebar-header-close'),
    toolbar: document.getElementById('toolbar-close-sidebar')
});
```

#### ステップ2: 手動で閉じる
```javascript
// ブラウザコンソールで実行
const sidebar = document.getElementById('sidebar');
sidebar.classList.remove('open');
sidebar.setAttribute('aria-hidden', 'true');
```

#### ステップ3: 要素の状態を確認
```javascript
// ElementManagerの状態を確認
console.log('[Debug] ElementManager:', window.elementManager?.elements);
```

**予防策**:
- HTMLで同じIDを使用しない
- `ElementManager`を使用して要素を取得する
- イベントリスナーの設定を確認する

---

### 問題2: タブ間の移動ができない

**症状**:
- サイドバーのタブをクリックしても切り替わらない
- 一部のタブだけ動作する

**原因**:
1. `sidebarTabs`が単一要素として取得されている
2. イベントリスナーが1つのタブにしか設定されていない
3. `activateSidebarGroup`関数が正しく動作していない

**解決方法**:

#### ステップ1: タブの取得状態を確認
```javascript
// ブラウザコンソールで実行
const tabs = document.querySelectorAll('.sidebar-tab');
console.log('[Debug] Tab count:', tabs.length);
tabs.forEach((tab, i) => {
    console.log(`[Debug] Tab ${i}:`, tab.id, tab.dataset.group);
});
```

#### ステップ2: 手動でタブを切り替える
```javascript
// 構造タブに切り替え
window.ZenWriterTabs.activateTab('structure');

// タイポタブに切り替え
window.ZenWriterTabs.activateTab('typography');
```

#### ステップ3: イベントリスナーの状態を確認
```javascript
// ElementManagerで取得されたタブを確認
console.log('[Debug] sidebarTabs:', window.elementManager?.elements.sidebarTabs);
```

**予防策**:
- `querySelectorAll`で複数要素を取得する
- `forEach`ですべてのタブにイベントリスナーを設定する
- `ElementManager`の`multipleElementKeys`に追加する

---

### 問題3: ガジェットが表示されない

**症状**:
- サイドバーのタブ内にガジェットが表示されない
- ガジェット追加ボタンが動作しない

**原因**:
1. `ZWGadgets`が初期化されていない
2. ガジェットパネルのIDが間違っている
3. ガジェットの初期化タイミングが早すぎる

**解決方法**:

#### ステップ1: ZWGadgetsの状態を確認
```javascript
// ブラウザコンソールで実行
console.log('[Debug] ZWGadgets:', window.ZWGadgets);
console.log('[Debug] ZWGadgets.init:', typeof window.ZWGadgets?.init);
```

#### ステップ2: 手動でガジェットを初期化
```javascript
// ガジェットを手動で初期化
if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
    window.ZWGadgets.init('#structure-gadgets-panel', { group: 'structure' });
    window.ZWGadgets.init('#typography-gadgets-panel', { group: 'typography' });
    window.ZWGadgets.init('#gadgets-panel', { group: 'assist' });
}
```

#### ステップ3: ガジェットパネルの存在を確認
```javascript
console.log('[Debug] Gadget panels:', {
    structure: document.getElementById('structure-gadgets-panel'),
    typography: document.getElementById('typography-gadgets-panel'),
    assist: document.getElementById('gadgets-panel')
});
```

**予防策**:
- ガジェットスクリプト（`gadgets.js`）が読み込まれているか確認
- 初期化を遅延させる（`setTimeout`または`DOMContentLoaded`後）
- エラーログを確認する

---

### 問題4: コンソールにエラーが表示される

**症状**:
- `Uncaught ReferenceError: xxx is not defined`
- `TypeError: Cannot read property 'xxx' of null`

**原因**:
1. 要素が存在しない
2. スクリプトの読み込み順序が間違っている
3. 変数のスコープが間違っている

**解決方法**:

#### よくあるエラーと対処法

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `elementManager is not defined` | グローバルに公開されていない | `window.elementManager`を使用 |
| `ZenWriterStorage is not defined` | storage.jsが読み込まれていない | スクリプトの読み込み順序を確認 |
| `Cannot read property 'classList' of null` | 要素が存在しない | null チェックを追加 |

#### デバッグ手順
1. ブラウザの開発者ツールを開く
2. コンソールタブでエラーメッセージを確認
3. エラーが発生した行番号をクリック
4. 該当する変数や関数を確認

---

### 問題5: LocalStorageが保存されない

**症状**:
- 設定やドキュメントが保存されない
- ページをリロードすると設定が消える

**原因**:
1. プライベートブラウジングモード
2. LocalStorageの容量オーバー
3. セキュリティポリシーによるブロック

**解決方法**:

#### ステップ1: LocalStorageの状態を確認
```javascript
// ブラウザコンソールで実行
console.log('[Debug] LocalStorage available:', typeof Storage !== 'undefined');
console.log('[Debug] LocalStorage size:', JSON.stringify(localStorage).length);
```

#### ステップ2: 保存内容を確認
```javascript
// 保存されているキーを確認
Object.keys(localStorage).filter(key => key.startsWith('zenWriter_')).forEach(key => {
    console.log(`[Debug] ${key}:`, localStorage.getItem(key)?.length, 'bytes');
});
```

#### ステップ3: LocalStorageをクリア（注意: データが消えます）
```javascript
// すべてのZen Writerデータを削除
Object.keys(localStorage).filter(key => key.startsWith('zenWriter_')).forEach(key => {
    localStorage.removeItem(key);
});
```

**予防策**:
- 通常モードでブラウザを使用する
- 定期的にデータをエクスポートする
- LocalStorageの使用量を監視する

---

## 🔍 デバッグ方法

### 開発者ツールの使い方

#### 1. コンソールログの確認
```javascript
// 開発環境では詳細なログが出力される
// [Zen Writer] で検索してフィルタリング
```

#### 2. ElementManagerの状態確認
```javascript
// すべての要素の取得状態を確認
console.table(Object.entries(window.elementManager.elements).map(([key, value]) => ({
    name: key,
    type: Array.isArray(value) ? 'array' : typeof value,
    count: Array.isArray(value) ? value.length : (value ? 1 : 0)
})));
```

#### 3. タブの状態確認
```javascript
// タブの状態を確認
window.ZenWriterTabs.getAvailableTabs().forEach(tab => {
    console.log(`[Debug] Tab "${tab.label}":`, {
        id: tab.id,
        isActive: tab.isActive
    });
});
```

### 一般的なデバッグフロー

```
問題発生
  ↓
開発者ツールを開く
  ↓
コンソールでエラー確認
  ↓
ElementManagerの状態確認
  ↓
該当する要素の存在確認
  ↓
イベントリスナーの設定確認
  ↓
手動で機能を実行して動作確認
  ↓
問題を特定
  ↓
コードを修正
  ↓
ページをリロードして再確認
```

---

## 📞 サポート

### 問題が解決しない場合

1. **GitHub Issueを作成**
   - リポジトリ: `YuShimoji/WritingPage`
   - エラーメッセージをコピーして貼り付け
   - 再現手順を記載

2. **デバッグ情報を収集**
   ```javascript
   // 以下の情報をコピー
   console.log({
       browser: navigator.userAgent,
       screenSize: `${screen.width}x${screen.height}`,
       localStorage: localStorage.length,
       elementManager: !!window.elementManager,
       tabs: window.elementManager?.elements.sidebarTabs?.length
   });
   ```

3. **ARCHITECTURE.mdを確認**
   - システム構成を理解する
   - データフローを確認する

---

**更新日**: 2025-01-04
**対応バージョン**: 0.3.14+
