# Live Preview 差分適用 設計ドキュメント

## 概要

Markdownライブプレビューのパフォーマンスを向上させるため、DOM差分適用を導入する。
現状の `innerHTML` 全置換方式から、morphdom を用いた差分更新方式に移行する。

## 現状の問題

### 現在の実装 (`js/editor.js`)

```javascript
_renderMarkdownPreviewImmediate() {
    if (!this.markdownPreviewPanel || !this.editor) return;
    const src = this.editor.value || '';
    this.markdownPreviewPanel.innerHTML = '';  // 全クリア
    // ... markdown-it でレンダリング ...
    this.markdownPreviewPanel.innerHTML = html;  // 全置換
}
```

### 問題点

1. **スクロール位置のリセット**: 更新のたびにスクロール位置が失われる
2. **パフォーマンス**: 長文ドキュメントでは DOM 全体の再構築が重い
3. **フォーカス喪失**: プレビュー内の選択状態やフォーカスがリセットされる
4. **視覚的なちらつき**: 全置換による画面のちらつきが発生

## 解決策: morphdom による差分適用

### morphdom とは

- 軽量な DOM 差分/パッチライブラリ（約 4KB gzipped）
- 仮想 DOM を使わず、実 DOM 同士を比較して最小限の変更を適用
- スクロール位置、フォーカス、選択状態を保持
- CDN から簡単にロード可能

### 導入方法

#### 1. CDN からロード

```html
<script src="https://cdn.jsdelivr.net/npm/morphdom@2.7.2/dist/morphdom-umd.min.js"></script>
```

#### 2. 差分適用の実装

```javascript
_renderMarkdownPreviewImmediate() {
    if (!this.markdownPreviewPanel || !this.editor) return;
    const src = this.editor.value || '';

    let html = '';
    try {
        if (window.markdownit) {
            if (!this._markdownRenderer) {
                this._markdownRenderer = window.markdownit({
                    html: false,
                    linkify: true,
                    breaks: true,
                });
            }
            html = this._markdownRenderer.render(src);
        } else {
            // フォールバック
            html = (src || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
        }
    } catch (e) {
        html = '';
    }

    // morphdom による差分適用
    if (window.morphdom) {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        morphdom(this.markdownPreviewPanel, tempContainer, {
            childrenOnly: true  // コンテナ自体は変更せず、子要素のみ更新
        });
    } else {
        // フォールバック: 従来の全置換
        this.markdownPreviewPanel.innerHTML = html;
    }
}
```

### morphdom のオプション

```javascript
morphdom(fromNode, toNode, {
    childrenOnly: true,  // コンテナ自体は変更しない
    onBeforeElUpdated: (fromEl, toEl) => {
        // 特定の要素の更新をスキップする条件を指定可能
        return true;  // true を返すと更新を続行
    },
    onNodeAdded: (node) => {
        // 新しいノードが追加されたときの処理
    },
    onNodeDiscarded: (node) => {
        // ノードが削除されたときの処理
    }
});
```

## 実装計画

### Phase 1: 基本実装

1. `index.html` に morphdom CDN を追加
2. `_renderMarkdownPreviewImmediate()` を morphdom 版に更新
3. フォールバック処理を維持（morphdom がロードされない場合）

### Phase 2: 最適化

1. スクロール同期との連携確認
2. 大規模ドキュメントでのパフォーマンス計測
3. 必要に応じて部分更新の最適化

### Phase 3: 拡張

1. 画像プレビューとの連携
2. Content Linking のホバープレビューとの統合

## テスト項目

- [ ] 短文ドキュメントでの動作確認
- [ ] 長文ドキュメント（10,000文字以上）でのパフォーマンス
- [ ] スクロール位置の保持
- [ ] 画像埋め込みの正常動作
- [ ] リンクのクリック動作
- [ ] ダークテーマでの表示

## リスクと対策

### リスク1: morphdom のロード失敗

- **対策**: フォールバックとして従来の innerHTML 方式を維持

### リスク2: 特殊な Markdown 要素での不具合

- **対策**: onBeforeElUpdated で問題のある要素を特定し、個別対応

### リスク3: パフォーマンス改善が期待ほどでない

- **対策**: デバウンス時間の調整、部分更新の検討

## 参考資料

- [morphdom GitHub](https://github.com/patrick-steele-idem/morphdom)
- [morphdom npm](https://www.npmjs.com/package/morphdom)

---

**作成日**: 2025-12-03
**ステータス**: 設計完了、実装待ち
