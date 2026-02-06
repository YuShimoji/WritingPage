# EDITOR_EXTENSIONS — 装飾/挿入UI・選択ツールチップ仕様（v1）

本文は `textarea` を用いるため、装飾は Markdown ベースで実現します。テキスト選択に連動するツールチップ（Quick Actions）を提供し、最小の操作で装飾/挿入を可能にします。

## 目的

- ライターがマウス/キーボードで素早く装飾や挿入を行える
- 将来的にプラグインからアクションを拡張できる

## 対象アクション（v1）

- 装飾
  - 強調（太字）: `**選択**`
  - 斜体: `*選択*`
  - 取り消し線: `~~選択~~`
- 挿入
  - リンク: `[text](https://example.com)`（選択文字が text になる。URLは入力ダイアログ）
  - 画像: `![alt](https://example.com/image.png)`（alt は選択文字）
  - 区切り線: `\n\n---\n\n`
  - ルビ: `|漢字《かんじ》`（選択をベース文字としてルビを入力）

## ツールチップ仕様

- 表示条件: `selectionStart !== selectionEnd`（範囲選択あり）
- 位置: 選択範囲の矩形（`getClientRects()`）上方に `position: fixed` で配置
- 追従: スクロール/リサイズ時は再計算
- キー操作: `Esc` で閉じる、`Tab` で次ボタン、`Enter` で確定
- フォーカス管理: ボタン群は `role="toolbar"`、`aria-label="選択ツール"`

## 実装方針

- `js/plugins/registry.js` を活用し、選択系アクションをプラグインとしても登録可能にする
- コア実装は `js/app.js` 側に `SelectionTooltip` モジュールを追加（別ファイルでも可）
- `EditorManager` に最小のヘルパ（選択範囲の文字列の取得/置換）を追加

### 選択範囲の置換（擬似コード）

```js
function wrapSelection(prefix, suffix = prefix) {
  const el = editor;
  const s = el.selectionStart,
    e = el.selectionEnd;
  const text = el.value;
  el.value =
    text.slice(0, s) + prefix + text.slice(s, e) + suffix + text.slice(e);
  el.selectionStart = s + prefix.length;
  el.selectionEnd = e + prefix.length;
  el.focus();
  saveContent();
  updateWordCount();
}
```

## プラグイン連携

- `registry.js` に `actions` をもつプラグインが `type: 'selection'` を指定すると、ツールチップ内にボタンを追加
- 例: 署名テンプレ、脚注、注釈、カンマ整形 など

## 将来拡張

- 絵文字ピッカー、脚注/注釈、引用(`>`)
- 文章校正APIとの連携（提案ハイライト→適用）
- Markdown→HTML ルビのレンダリング（印刷時のみ）
