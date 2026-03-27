# Session 28 発見バグパターン

> 2026-03-27 session 28 の Visual Audit + 手動確認で発見。
> 4件修正済み、1件未修正。共通パターンとして記録。

---

## 修正済み

### BP-1: execCommand 直接呼び問題

- 箇所: editor-wysiwyg.js setupToolbarButtons の `[data-block]` ハンドラ
- 症状: 見出し (H1-H3) / 段落 / 引用 / リストボタンが押しても適用されない
- 原因: `document.execCommand('h1')` のように data-block 値をそのまま渡していた。`execCommand` は "h1" をコマンドとして認識しない
- 修正: 見出し/段落/引用は `formatBlock` + `<h1>` 値、リストは `insertUnorderedList` / `insertOrderedList` に変更
- 教訓: `execCommand` のコマンド名は Web 標準で定義されたもののみ。カスタム名は無効。今後 `execCommand` を使う場合は MDN の対応コマンド一覧を参照すること

### BP-2: CSS overflow-x:auto によるスクロールバー出現

- 箇所: css/style.css `.wysiwyg-toolbar`
- 症状: WYSIWYG ツールバーにスクロールバーが表示され、一部ボタンが見切れる
- 原因: `overflow-x: auto` + `white-space: nowrap` + `max-width` 制約。ボタン数が多いと溢れる
- 修正: `overflow: hidden` + `flex-wrap: wrap` で折り返し表示に変更
- 教訓: ツールバー系コンポーネントで `overflow-x: auto` は原則避ける。ボタン数が動的に変わる場合は `flex-wrap` を使う

### BP-3: モード切替の復帰導線欠如

- 箇所: editor-wysiwyg.js switchToTextarea / index.html
- 症状: `<>` ボタン (ソース表示切替) をクリックすると textarea モードに入るが、WYSIWYG に戻るボタンが画面上に存在しない
- 原因: WYSIWYG ツールバーが textarea モードでは非表示になるため、切り替えトリガーも一緒に消える。メインツールバーの `#toggle-wysiwyg` はフォーカスモードでは隠れている
- 修正: textarea モード時に「ソース表示モード / リッチテキストに戻る」バナーを表示
- 教訓: モード切替 UI は「行きの導線」だけでなく「帰りの導線」を必ずセットで設計する。特にフォーカスモード等で UI が隠れる環境では、モード切替状態を示すインジケータを常に残す

### BP-4: contenteditable カーソル配置ミス

- 箇所: editor-wysiwyg.js _applyRuby
- 症状: ルビ挿入後にカーソルが ruby 要素の内部に残り、続けてタイプすると ruby 内にテキストが追加される。ルビ表示がズレる
- 原因: `selectNodeContents(ruby)` + `collapse(false)` は ruby 要素の内部末尾にカーソルを置く。`<rt>` の後ろだが、まだ `<ruby>` タグの中
- 修正: `setStartAfter(ruby)` + `collapse(true)` で ruby 要素の外側にカーソルを配置
- 教訓: contenteditable でインライン要素を挿入した後は `setStartAfter(element)` で要素の外にカーソルを出す。`selectNodeContents` + `collapse(false)` は要素の内部末尾であり外側ではない

---

## 未修正

### BP-5: 構造アコーディオン展開ループ (textarea モード)

- 箇所: sidebar-manager.js _toggleAccordion / _ensureAccordionGadgetInitialized
- 症状: textarea モードで左サイドバーの「構造」アコーディオンを展開すると、展開/折りたたみがループする
- 推定原因: `switchToTextarea()` が `ZWSectionCollapse.clear()` → `renderMarkdownPreview()` を実行し、これがセクション自動検出を走らせ、アコーディオン状態変更を再帰的にトリガーする可能性
- 調査方針: `_toggleAccordion` 内の `_ensureAccordionGadgetInitialized` がレンダラーを呼び、レンダラーがアコーディオン状態を変えるループを特定する。再入防止フラグの追加が有力
- 優先度: 中 (textarea モードは主要ワークフローではないが、`<>` ボタンの復帰導線ができたことでアクセス頻度が上がる)

---

## 共通の教訓

1. **Web API は正確なコマンド名を使う**: `execCommand` のような低レベル API はカスタム引数を受け付けない。ラッパーを書くなら変換テーブルを明示する
2. **CSS overflow は意図的に制御する**: `auto` はデフォルト的に使いがちだが、ツールバー/パネル系では予期しないスクロールバーを生む
3. **モード切替は双方向導線を保証する**: 特に UI 要素が隠れるモード (フォーカスモード等) との組み合わせで、片方向のみの導線が盲点になる
4. **contenteditable のカーソル配置は外側/内側を区別する**: `selectNodeContents` は内側、`setStartAfter` は外側。インライン要素挿入後は外側が正解
