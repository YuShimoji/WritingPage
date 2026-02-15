# TASK_055: WYSIWYG即時プレビュー・リッチテキスト体験の改善

## ステータス: OPEN（P1）

## 問題

### 1. WYSIWYGモードでHTMLタグが直接表示される

リッチテキストエディタ（`#wysiwyg-editor`）に切り替えると、Markdown が HTML に変換されて `contenteditable` な div に挿入される。しかし、初期状態でテキストが空または少量の場合、HTML タグ（`<p>`, `<br>` 等）が生のまま見え、ユーザーにとって意味不明な表示になる。

### 2. 執筆即プレビューの一画面完結エディタが未完成

- 現在のフローは「textarea（プレーン）→ WYSIWYG 切替（ツールバーボタン）」の2ステップ
- 「書きながらリアルタイムにリッチ表示を確認」する統合体験が実現されていない
- スプリットビュー（編集/プレビュー）はあるが、左が textarea で右が Markdown プレビューのため、リッチテキスト編集とは別の機能

### 3. switchToWysiwyg が多重呼び出しされている

コンソールログに `[RichTextEditor] switchToWysiwyg called` が6回連続出力されている。イベントリスナーの重複登録またはリアクティブ更新ループが疑われる。

## 根本原因

- `editor-wysiwyg.js` の `switchToWysiwyg()` は `isWysiwygMode` チェックで重複実行を防いでいるが、`mousedown` イベントが複数回発火している可能性
- WYSIWYG エディタ (`contenteditable`) は基本的な太字/斜体/下線/リンクのみ対応。見出し、リスト、コードブロック等の構造化編集は未実装
- Markdown → HTML 変換は `markdown-it`、HTML → Markdown 変換は `TurndownService` で行われるが、双方向変換のロスが発生しうる

## 修正方針

### 短期（Phase 1 — 執筆を妨げない最低限）
1. WYSIWYG 切替の多重呼び出しを修正（イベントリスナー重複の排除）
2. WYSIWYG モード初期表示の改善（空の場合はプレースホルダ表示）
3. WYSIWYGツールバーの視認性向上

### 中期（Phase 2 — 執筆即プレビュー体験）
1. スプリットビューの「編集/プレビュー」モードを WYSIWYG 対応に拡張
2. Markdown Live Preview（textarea に入力しながら横にリアルタイムプレビュー）の安定化
3. `contenteditable` エディタに見出し・リスト・引用の構造化編集を追加

### 長期（Phase 4 のロードマップ項目）
1. 完全な WYSIWYG エディタ（ProseMirror/Tiptap 等の導入検討）
2. グラフィックノベル向けリッチ表現（画像挿入、レイアウト制御）

## 依存

- TASK_053（エディタスクロール修正）— WYSIWYG エディタも同じコンテナ内にあるため
