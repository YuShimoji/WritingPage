# 拡張テキストボックス機能 開発設計

## 対象

- 仕様: `docs/specs/spec-extended-textbox.md`
- 連携仕様: `docs/specs/spec-richtext-enhancement.md`

---

## 設計方針

- Markdown正本を維持し、Textbox DSLを編集互換レイヤとして扱う
- 既存 `EditorCore` の装飾/アニメ処理を壊さず、前段に textbox 処理を追加する
- WYSIWYGは `DOM <-> DSL` 変換を専用ブリッジへ分離する
- 設定は `settings.editor.extendedTextbox` 配下に集約する
- Phase 1 はショートカット依存を避け、UI操作とコマンド経由の適用を優先する

---

## コンポーネント設計

## 1. `TextboxPresetRegistry`（新規）

責務:

- 標準プリセット定義の保持
- ユーザー定義プリセットのロード/検証/マージ
- `resolvePreset(id)` / `listPresets()` API提供

入出力:

- in: `settings.editor.extendedTextbox.userPresets`
- out: 正規化済みプリセット配列

## 2. `TextboxDslParser`（新規）

責務:

- DSL文字列 -> AST
- AST -> DSL文字列
- 属性バリデーション（tilt/scale/range）

データ構造（例）:

```js
{
  type: 'textbox',
  attrs: { preset, role, anim, tilt, scale, sfx, className },
  content: '...'
}
```

## 3. `TextboxEffectRenderer`（新規）

責務:

- AST -> HTML (`div.zw-textbox`) へ変換
- プリセット + 明示属性を合成し `data-*` / class を付与
- `prefers-reduced-motion` 適用

## 4. `TextboxRichTextBridge`（新規）

責務:

- WYSIWYG DOM の textbox要素を DSLへ逆変換
- DSL読込時にDOMへ復元
- 不正ノードのサニタイズ

---

## 既存ファイル改修

## 1. `js/storage.js`

- `DEFAULT_SETTINGS.editor.extendedTextbox` を追加
- `loadSettings()` の nested merge に `extendedTextbox` を追加

## 2. `js/modules/editor/EditorCore.js`

- `processTextboxDsl(text)` を追加
- 呼び出し順:
  1. `processTextboxDsl`
  2. `processTextAnimations`
  3. `processFontDecorations`

理由:

- textbox内コンテンツへ既存装飾/アニメ適用を継承するため

## 3. `js/editor-wysiwyg.js`

- toolbarに Textbox ドロップダウン追加
- コマンド適用時:
  - 選択範囲 -> textbox wrapper DOM作成
- 保存時:
  - `TextboxRichTextBridge.domToDsl()` を通して Markdown へ

## 4. `js/modules/editor/EditorUI.js`

- textarea選択アクションに「Textbox化」追加
- 既存ショートカットとの優先順位調整

## 5. `css/style.css`

- `.zw-textbox` 基本スタイル
- プリセット派生クラス:
  - `.zw-textbox--inner-voice`
  - `.zw-textbox--se-animal-fade`
  - `.zw-textbox--typing-sequence`

---

## イベントフロー

## textarea

1. ユーザー選択
2. Textbox適用アクション
3. 選択範囲を `:::zw-textbox{...}` でラップ
4. `saveContent` / `updateWordCount`

## WYSIWYG

1. ユーザー選択
2. toolbar Textbox適用
3. DOM wrapper 生成
4. 同期時に DOM->DSL 逆変換
5. 保存

---

## マイグレーション設計

- 既存文書は変換不要
- `extendedTextbox` 未設定時はデフォルト補完
- 旧タグから自動変換は行わない（誤変換防止）

---

## バリデーション

- 属性ホワイトリスト以外は破棄
- `tilt`: `[-20, 20]`
- `scale`: `[0.5, 2.0]`
- `role`: 定義済み + `custom`
- `preset`: registry存在確認、未定義は `defaultPreset` へフォールバック

---

## テスト設計

## 1. Unit

- `TextboxDslParser`:
  - 正常パース
  - 不正属性除去
  - round-trip同値
- `TextboxPresetRegistry`:
  - merge順
  - 重複ID解決

## 2. E2E

- textareaでプリセット適用
- WYSIWYG往復保持
- reduce motion
- 設定OFFで無効

---

## リスクと対策

1. Markdown変換時の情報欠落
- 対策: DOM->DSL 逆変換のスナップショットテスト

2. 入力性能低下
- 対策: textboxパースは差分適用（全文再パース回避）をPhase 2で導入

3. ショートカット競合
- 対策: Phase 1 では `Ctrl+Alt+1..3` を導入しない。後続で導入する場合は `app-shortcuts.js` 側に feature flag ガードを追加

---

## 実装タスク分解

1. `storage.js` 設定スキーマ追加
2. `TextboxPresetRegistry` 新規
3. `TextboxDslParser` 新規
4. `EditorCore` 連携
5. `style.css` プリセットスタイル
6. textarea UIアクション追加
7. WYSIWYG bridge連携
8. E2E追加

---

## 実装順推奨

- 先に textarea系（Phase 1）を安定化
- その後 WYSIWYG bridge（Phase 2）
- 最後にユーザープリセット編集UI（Phase 3）
