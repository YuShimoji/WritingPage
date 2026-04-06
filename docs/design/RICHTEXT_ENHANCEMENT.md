# リッチテキスト強化 開発設計

> **ステータス（2026-04）**: コマンド Adapter・スマートペースト等の実体は [`docs/specs/spec-richtext-enhancement.md`](../specs/spec-richtext-enhancement.md) 記載のとおり主に [`js/modules/editor/RichTextCommandAdapter.js`](../../js/modules/editor/RichTextCommandAdapter.js) / [`RichTextEnhancedRuntime.js`](../../js/modules/editor/RichTextEnhancedRuntime.js) に集約済み。本ファイルの「新規モジュール名」は当初の分割案であり、**以降の正本・変更判断は `spec-richtext-enhancement.md` を優先**する。

## 対象

- 仕様: `docs/specs/spec-richtext-enhancement.md`
- 既存実装: `js/editor-wysiwyg.js`, `index.html`, `css/style.css`, `js/command-palette.js`

---

## 設計方針

- Markdown 正本は維持し、WYSIWYG は双方向変換レイヤで実装する
- 既存 UI を活かして段階導入し、破壊的変更を避ける
- 変換失敗・サニタイズ除去が起きても入力内容を極力喪失させない

---

## 現行課題（設計観点）

- `execCommand` 依存でコマンド挙動の制御性が低い
- 入力・貼り付け・変換処理が `RichTextEditor` 単一クラスに集中している
- ブロック編集（見出し/リスト/引用）が仕様上未定義
- ペーストサニタイズ境界がない

---

## 新規/変更モジュール

## 1. `js/modules/editor/RichTextCommandAdapter.js`（新規）

責務:

- Selection/Range の正規化
- インライン/ブロック操作APIの提供
- 必要時のみ `execCommand` フォールバック

主要API:

- `toggleInline(type)`
- `applyBlock(type)`
- `wrapWithClass(className)`
- `insertLink(url, text)`
- `removeFormat()`

## 2. `js/modules/editor/RichTextSanitizer.js`（新規）

責務:

- スマートペースト時の許可タグ/属性フィルタ
- URLスキーム検証（`http`, `https`, `mailto`）
- 未許可要素のテキスト退避
- Phase 1-3 は `img` 非許可（テキスト中心運用を優先）

実装メモ:

- 依存追加を避けるため、初期は `DOMParser + 手動フィルタ` で実装
- 許可対象は tag と class prefix を分離して判定（`span` + `decor-*`/`anim-*`）
- 将来、必要なら DOMPurify 採用を再評価

## 3. `js/modules/editor/RichTextMarkdownBridge.js`（新規）

責務:

- `markdownToHtml`, `htmlToMarkdown` の変換責務を分離
- 既存 `processFontDecorations/processTextAnimations` との接続点を提供
- block 系往復ルールの一元管理

## 4. `js/editor-wysiwyg.js`（改修）

変更点:

- 初期化、イベント束ね、ツールバー制御のオーケストレーションに限定
- 変換処理/コマンド処理/サニタイズ処理を新規モジュールへ委譲
- `syncToMarkdown()` の呼び出しタイミングを入力・コマンド完了時に統一

---

## UI設計

## 1. `index.html`

- `#wysiwyg-toolbar` に block 操作用ドロップダウン（または横並びボタン）を追加
- 既存ID規約を踏襲:
  - `wysiwyg-block-h1`
  - `wysiwyg-block-h2`
  - `wysiwyg-block-h3`
  - `wysiwyg-block-ul`
  - `wysiwyg-block-ol`
  - `wysiwyg-block-quote`
  - `wysiwyg-block-p`

## 2. `css/style.css`

- 既存 `.wysiwyg-toolbar` 系スタイルを拡張し、モバイル時に折り返し崩れを抑制
- ドロップダウン項目のフォーカス可視化（`focus-visible`）を追加

---

## データ・イベント設計

## localStorage

- 既存:
  - `zenwriter-wysiwyg-mode`
- 新規:
  - `zenwriter-wysiwyg-paste-mode`: `smart` / `plain`

## settings

- 新規:
  - `settings.editor.richtextEnhanced`: `true` / `false`（障害時ロールバック）

## カスタムイベント

- `ZWRichTextWarning`
  - 発火条件: サニタイズで危険要素を除去した時、または変換失敗時
  - payload 例: `{ type: 'sanitize-drop', removedCount: 3 }`

---

## 実装ステップ

1. `RichTextCommandAdapter` 導入 + 既存コマンド置換
2. `storage.js` に `settings.editor.richtextEnhanced` を追加
3. `RichTextMarkdownBridge` 切り出し + 既存変換ロジック移植
4. ブロック編集UI追加 + Adapter接続
5. `RichTextSanitizer` 導入 + ペーストモード分岐実装
6. コマンドパレット表記修正
7. E2E/ユニットテスト追加

---

## テスト設計

## 1. 単体（新規推奨）

- `RichTextCommandAdapter`
  - インラインON/OFFトグル
  - ブロック切替
- `RichTextMarkdownBridge`
  - Markdown→HTML→Markdown 往復同値（代表ケース）
- `RichTextSanitizer`
  - 危険属性除去
  - 許可タグ保持

## 2. E2E（Playwright）

- WYSIWYGで見出し/リスト/引用を適用し、保存後再読込で保持される
- スマートペースト時に script 属性が除去される
- プレーンペースト時にタグがテキスト化される
- textarea モード切替後も内容が崩れない

---

## リスクと対策

- リスク: Range操作で選択崩れが発生
  - 対策: 操作前後の Selection snapshot を取り、最小限復元
- リスク: 既存Markdown資産で変換差分が増える
  - 対策: 既存ドキュメントのサンプル回帰セットを用意
- リスク: ペースト処理で予期せぬデータ欠落
  - 対策: サニタイズ除去時の警告イベントで観測可能にする

---

## ロールアウト

- 破壊的障害に備え、`settings.editor.richtextEnhanced` の最小フラグを導入してロールバック可能にする
- 各Phaseで E2E グリーンを必須条件にする
- 既存の「WYSIWYG 自動ON」挙動は維持し、UI変更コストを抑える
