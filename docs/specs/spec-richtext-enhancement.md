# リッチテキスト強化 仕様書

## 概要

既存の WYSIWYG エディタ（`js/editor-wysiwyg.js`）を「実験的機能」から日常利用レベルへ引き上げる。  
本文保存形式は引き続き Markdown を正とし、WYSIWYG は編集体験レイヤとして強化する。

---

## 背景課題

- 現状は `document.execCommand` 依存が中心で、ブラウザ実装差・将来互換性リスクが高い
- HTML⇔Markdown 変換で、装飾は保持できても構造（リスト・引用・見出し）の編集導線が弱い
- ペースト時に常にプレーンテキスト化され、外部テキストの整形取り込みが難しい
- コマンドパレット上では WYSIWYG が「実験的機能」として扱われている

---

## 目的

- 長文執筆で常用できる安定したリッチテキスト体験を提供する
- Markdown 正本の互換性を維持したまま、編集操作の直感性を向上させる
- 実装・テスト・運用の観点で段階的に安全に導入できる仕様にする

---

## WP-004 Phase 3 との関係

- **WP-004 Phase 3**（`docs/INTERACTION_NOTES.md`）は **MD プレビューと読者プレビュー向けの共通 HTML 後処理**（`js/zw-postmarkdown-html-pipeline.js`, `js/zw-inline-html-postmarkdown.js` 等）の整合が対象である。
- **本仕様（リッチテキスト・プログラム）**は **WYSIWYG 編集層**（コマンド・ブロック UI・ペースト・MD 往復）が対象である。
- **ブロック段落の左・中・右揃え**（`spec-rich-text-paragraph-alignment.md`）は本プログラムの **P2** として扱い、WP-004 Phase 3 の単発スライスには含めない。

---

## 実装の正（canonical paths）


| 責務                                                   | 実ファイル                                                                                                | メモ                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| コマンド集約・`sanitizeHtml`・`insertHtml`・ブロック `applyBlock` | `[js/modules/editor/RichTextCommandAdapter.js](../../js/modules/editor/RichTextCommandAdapter.js)`   | 設計書 `RichTextSanitizer.js` 相当のサニタイズは **本クラス内**の `sanitizeHtml` に実装済み |
| 既存 WYSIWYG へのフック                                     | `[js/modules/editor/RichTextEnhancedRuntime.js](../../js/modules/editor/RichTextEnhancedRuntime.js)` |                                                                      |
| オーケストレーション・ツールバー・ペーストハンドラ                            | `[js/editor-wysiwyg.js](../../js/editor-wysiwyg.js)`                                                 |                                                                      |
| 旧表記                                                  | `js/richtext-command-adapter.js` 等                                                                   | **廃止・未使用**。検索ヒットしたら本表に置き換える                                          |


---

## 能力階層（優先度の目安）


| 層             | 内容                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **P0（日常執筆）**  | Markdown 正本、インライン/ブロック操作、スマートペースト、主要ブロックの MD 往復（上記受け入れ基準 1〜6）                                                                    |
| **P1（品質）**    | 下記「Phase 4（表）」の未着手（Undo 粒度、短文時カーソル位置など）                                                                                          |
| **P2（レイアウト）** | 段落ブロックの `text-align`（左・中央・右）。Reader/エクスポートまでのパイプライン通過は `spec-rich-text-paragraph-alignment.md` に従い、**永続化方針を仕様で固定してから** 実装スライスを切る |

**P2 の着手順**: [`spec-rich-text-paragraph-alignment.md`](spec-rich-text-paragraph-alignment.md) の「推奨実装スライス順」に従う（永続化モデル → WYSIWYG コマンド → プレビュー/Reader → E2E）。

---

## 非スコープ

- 完全な HTML ドキュメントエディタ化
- Word 互換の高度レイアウト（表組み、段組み、脚注番号管理）
- クラウド共同編集

---

## 機能仕様

## 1. 編集コマンド層の標準化

- `execCommand` を直接散在利用せず、`RichTextCommandAdapter` に集約する
- Adapter は以下を提供する:
  - `toggleInline('bold' | 'italic' | 'underline' | 'strike')`
  - `wrapSpan(className)`
  - `applyBlock('p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'ul' | 'ol')`
  - `insertLink(url, text)`
  - `removeFormat()`
- 実装方式:
  - 既定は `Selection/Range API` ベース
  - 既存互換のため、一部で `execCommand` フォールバックを許容

## 2. ブロック編集導線の追加

- WYSIWYG フローティングツールバーにブロック操作を追加:
  - 見出し（H1/H2/H3）
  - 箇条書き（UL/OL）
  - 引用（blockquote）
  - 段落戻し（P）
- 既存の装飾/アニメーションドロップダウンは維持
- 追加UIは既存 `#wysiwyg-toolbar` 内に統合し、新規常設バーは作らない

## 3. ペーストポリシー（2モード）

- 既定: `スマートペースト`
  - 安全な最小タグのみ許可して貼り付け
  - 許可タグ: `p, br, strong, em, u, s, a, h1-h3, ul, ol, li, blockquote, span`
  - 許可クラス: `decor-`*, `anim-*`（`span` のみ）
- 代替: `プレーンテキストペースト`
  - `Ctrl+Shift+V` または設定で明示選択時に使用
- 禁止/除去:
  - `script`, `style`, `on*` 属性、未知クラス、危険URLスキーム

## 4. Markdown ラウンドトリップ品質向上

- `htmlToMarkdown()` と `markdownToHtml()` に block 系ルールを追加し、往復で崩れにくくする
- 変換保証レベル:
  - 保証: 見出し、段落、強調、リンク、リスト、引用、既存装飾タグ
  - 非保証: 表、ネスト複雑な混在ブロック（将来拡張）
- 変換不能要素は無言で破棄せず、可能な限りプレーンテキストに退避する

## 5. 操作状態と可観測性

- WYSIWYG ON/OFF は既存 `localStorage('zenwriter-wysiwyg-mode')` を継続利用
- 新規設定キー:
  - `zenwriter-wysiwyg-paste-mode` (`smart` | `plain`)
  - `settings.editor.richtextEnhanced`（障害時ロールバック用の最小フラグ）
- 変換失敗時は `console.warn` に加え、開発時のみ `window.dispatchEvent('ZWRichTextWarning')` を発火

## 6. コマンドパレット表記更新

- `WYSIWYG エディタ` のカテゴリを `実験的機能` から `編集` に変更
- 説明文の「実験的」を削除し、通常機能として扱う

---

## 互換性方針

- 保存フォーマット（Markdown本文）を変更しない
- 既存ドキュメントは移行不要
- 既存ショートカット（Ctrl+B/I/U, Ctrl+K）を維持

---

## 受け入れ基準（Acceptance Criteria）

1. WYSIWYG で見出し/リスト/引用/段落の切り替え操作が可能
2. スマートペーストで危険属性が除去され、本文が破損しない
3. HTML⇔Markdown 往復で、見出し・リスト・引用・既存装飾が保持される
4. `zenwriter-wysiwyg-paste-mode` の設定変更が次回起動後も維持される
5. コマンドパレットで WYSIWYG が通常編集カテゴリに表示される
6. 既存の textarea モード編集・保存・プレビュー挙動に回帰がない

---

## 段階導入（推奨）


| Phase   | 内容                            | 判定  | 状態  |
| ------- | ----------------------------- | --- | --- |
| Phase 1 | コマンドAdapter導入、既存操作の置換、回帰テスト追加 | 必須  | 完了  |
| Phase 2 | ブロック編集UI追加、変換ルール拡張            | 必須  | 完了  |
| Phase 3 | スマートペースト実装、設定UI連携             | 必須  | 完了  |
| Phase 4 | 品質改善（選択範囲維持、Undo粒度最適化）        | 推奨  | 未着手 |


---

## 決定事項（2026-03-10）

- D1. `img` は Phase 1-3 のスマートペースト許可対象に含めない
- D2. 見出し操作は H1-H3 に限定して開始する
- D3. ペースト初期モードは `smart` とする

---

## 実装進捗

### Phase 1: コマンドAdapter導入（完了）

**実装日**: 2026-03-11以前
**主要ファイル**: `js/modules/editor/RichTextCommandAdapter.js`, `js/modules/editor/RichTextEnhancedRuntime.js`（旧草案パス `js/richtext-command-adapter.js` は未使用）

#### 完了内容

- `RichTextCommandAdapter` クラス実装
  - `toggleInline(type)`: bold, italic, underline, strikethrough に対応
  - `wrapWithClass(className)`: span 装飾クラス適用
  - `insertLink(url, text)`: リンク挿入
  - `insertText(text)`: テキスト挿入
  - `removeFormat()`: 書式解除
  - `execute(command, ...args)`: 統一実行インターフェース
- `RichTextEnhancedRuntime` による既存メソッドのフック化
  - `richtextEnhanced` フラグで拡張機能の有効化制御
  - 既存 WYSIWYG エディタとの互換性維持

### Phase 2: ブロック編集UI（完了）

**実装日**: 2026-03-11
**主要ファイル**: `js/modules/editor/RichTextCommandAdapter.js`, `js/editor-wysiwyg.js`

#### 完了内容

- `applyBlock(blockType)` メソッド実装
  - 対応ブロックタイプ: h1, h2, h3, p, ul, ol, blockquote
  - Selection/Range API ベースの実装
  - リスト（ul/ol）では `<li>` 要素の自動生成
- WYSIWYG ツールバーへの UI 追加
  - 見出しドロップダウン（H2/H3/段落）
  - リストドロップダウン（箇条書き/番号付き）
  - 引用ボタン
  - 既存の `data-block` 属性パターンと統一したUI設計
- E2E テスト追加（2件）
  - H2 見出し適用テスト
  - UL 箇条書き適用テスト

### Phase 3: スマートペースト（完了）

**実装日**: 2026-03-11
**主要ファイル**: `js/modules/editor/RichTextCommandAdapter.js`, `js/editor-wysiwyg.js`

#### 完了内容

- `sanitizeHtml(html)` メソッド実装
  - DOMParser + TreeWalker ベースの安全なHTMLサニタイズ
  - 許可タグ: `p, br, strong, em, u, s, a, h1, h2, h3, ul, ol, li, blockquote, span`
  - `span` の許可クラス: `decor-`*, `anim-*` のみ
  - `a` の許可URLスキーム: `http`, `https`, `mailto` のみ
  - `on*` イベント属性の除去
- `insertHtml(html)` メソッド実装
  - `execCommand('insertHTML')` + Range API フォールバック
  - サニタイズ済みHTML挿入
- ペーストハンドラ実装
  - `localStorage('zenwriter-wysiwyg-paste-mode')` による設定保存（`smart` | `plain`）
  - スマートペーストモード: サニタイズ処理適用
  - プレーンテキストモード: テキストのみ抽出
  - `Ctrl+Shift+V`: プレーンテキスト強制ペースト
- E2E テスト追加（2件）
  - スマートペースト動作テスト
  - プレーンテキストペースト動作テスト

### ツールバー・入力 UX 改善（2026-03-14 完了）

（下記「段階導入」表の **Phase 4（Undo 等）** とは別。表の Phase 4 は未着手のまま。）

#### 実装済み

- **フローティングツールバーのサイドバー考慮** — `_showFloatingToolbar()` が `.sidebar.open` の右端を左端クランプの基準に使用
- **装飾適用後の選択範囲復元** — `wrapSelectionWithSpan()` で DOM 操作後に `selection.addRange()` で再選択。ラップ時は span 内容、アンラップ時は展開テキスト全体を再選択
- **プリフォーマット対応** — `executeCommand()` の `isCollapsed` ガード除去 (execCommand 標準動作でプリフォーマット)。`wrapSelectionWithSpan()` で選択なし時にゼロ幅スペース付き空 SPAN を挿入+トグル OFF 対応
- **タイプライターモード** — カーソル行をビューポートのアンカー位置に維持するスクロール制御。anchorRatio/stickiness 設定、input/keyup/click で requestAnimationFrame 経由の追従。WYSIWYG 専用
- **ドロップダウンメニューのビューポートクランプ** — 画面端でメニューが見切れる問題を修正

#### 未着手

- Undo 粒度の最適化
- カーソル位置の下部固定問題（コンテンツが少ない場合）