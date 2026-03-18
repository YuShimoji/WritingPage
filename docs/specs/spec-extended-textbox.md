# 拡張テキストボックス機能 仕様書（Draft v0.2）

## 概要

本仕様は、Zen Writer の `textarea` / WYSIWYG の両編集モードで利用できる「演出付きテキストボックス」を定義する。  
目的は、単なる装飾タグでは表現しにくい **テキストボックス単位の演出プリセット**（心の声、効果音、タイピング演出など）を、執筆フローの中で高速かつ再利用可能にすること。

---

## 背景

現状は以下が可能:

- 文字単位装飾: `[bold]...[/bold]`, `[outline]...[/outline]` など
- 文字単位アニメーション: `[shake]...[/shake]`, `[fade]...[/fade]` など

一方で不足している点:

- 「この塊は心の声」「この塊はSE」のような**意味付きボックス表現**
- ボックス単位のプリセット再利用
- 文字効果 + ボックス効果 + 効果音メタデータの一元管理
- リッチテキスト連携時の互換仕様

---

## 目的

1. テキスト単位とボックス単位の演出を両立する
2. プリセットで反復作業を削減する
3. Markdown正本を維持したまま、WYSIWYGと双方向互換を持たせる
4. 将来的なプラグイン拡張の受け皿を用意する

---

## 想定ユースケース

- 心の声: 斜体 + 淡色 + ゆるいフェード
- 動物の鳴き声: 太字 + 揺れ + フェードアウト
- タイピング演出: 等幅寄りフォント + タイプアニメーション + 効果音メタデータ
- 同一作品で「セリフ」「モノローグ」「SE」ボックスを切替

---

## スコープ

### In Scope（Phase 1-2）

- テキストボックスDSL（Markdown互換の軽量構文）
- ボックスプリセット（標準3種 + ユーザー定義）
- テキスト単位効果（既存 `[decor]/[anim]`）との合成
- WYSIWYG連携（読み込み/編集/保存）
- 設定永続化（有効化、既定プリセット、詳細表示）

### Out of Scope（現フェーズ）

- 音声ファイルの自動再生（ブラウザ制約とUX負荷のため）
- タイムライン同期（動画編集レベル）
- 外部オーディオライブラリ連携

---

## 表現モデル

## 1. レイヤー定義

- L1: インライン効果（既存）
  - `[wide]`, `[shake]`, `[fade]` など
- L2: ボックス効果（新規）
  - 背景、枠線、傾き、拡大率、ボックス全体アニメーション
- L3: 意味メタデータ（新規）
  - `role`（monologue/se/dialogue 等）、`sfx`（効果音識別子）

## 2. DSL仕様（Markdown正本）

```md
:::zw-textbox{preset:"inner-voice", role:"monologue", tilt:-4, scale:0.98}
[italic]……本当にこれで良かったのかな。[/italic]
:::

:::zw-textbox{preset:"se-animal-fade", role:"sfx", sfx:"animal-fadeout"}
[black][shake]ガルルル……[/shake][/black]
:::
```

### 2.1 属性

- `preset`: プリセットID
- `role`: `dialogue | monologue | narration | sfx | system | custom`
- `anim`: ボックスアニメーションID
- `tilt`: `-20..20`（deg）
- `scale`: `0.5..2.0`
- `sfx`: 文字列ID（再生トリガーではなく意味タグ）
- `class`: 追加クラス（拡張用）

### 2.2 互換性

- DSLが無効な環境でも本文テキストは損失しない
- 不正属性は破棄し、本文は保持

---

## プリセット仕様

## 1. 標準プリセット（初期搭載）

1. `inner-voice`
- 用途: 心の声
- 既定: italic寄り、opacity低め、fade-in

2. `se-animal-fade`
- 用途: 動物の鳴き声
- 既定: outline/black、shake、fade-out

3. `typing-sequence`
- 用途: タイピング画面演出
- 既定: monospace寄り、type animation、sfx=`typing-loop`

## 2. ユーザー定義プリセット

- 保存先: `settings.editor.extendedTextbox.userPresets`
- 最大件数: 100
- スキーマ検証失敗時は保存拒否

---

## UI仕様

## 1. textareaモード

- 選択ツールチップに「テキストボックス化」アクションを追加
- クイック適用:
  - 選択ツールチップ上のプリセットボタン（inner-voice / se-animal-fade / typing-sequence）
  - コマンドパレット経由のプリセット適用

## 2. WYSIWYGモード

- フローティングツールバーに「Textbox」ドロップダウンを追加
- 適用時は内部HTMLを `div.zw-textbox[data-*]` で管理
- 保存時に DSL へ逆変換

## 3. 設定UI

- 「Editor Extras」内に新セクション `TextBox Effects`
  - 機能ON/OFF
  - 既定プリセット
  - プリセット管理（作成/複製/削除）
  - `sfx` フィールド表示ON/OFF

---

## リッチテキスト連携仕様

## 1. 正本

- 正本は常に Markdown（DSL含む）

## 2. 変換

- Markdown -> WYSIWYG
  - `:::zw-textbox{...}` を `div.zw-textbox` に変換
- WYSIWYG -> Markdown
  - `div.zw-textbox` を DSLへ戻す

## 3. 変換保証

- 保証対象:
  - `preset`, `role`, `anim`, `tilt`, `scale`, `sfx`
  - 内部の `[decor]/[anim]` タグ
- 非保証（Phase 3候補）:
  - 複雑ネストしたボックス内ボックス

## 4. 既存 richtext 強化仕様との関係

- `docs/specs/spec-richtext-enhancement.md` の Adapter/Bridge方針に従う
- 本機能は以下の拡張として実装:
  - `RichTextMarkdownBridge` に textbox DSL ルール追加
  - `RichTextCommandAdapter` に textbox 適用コマンド追加

---

## データ仕様

```json
{
  "editor": {
    "extendedTextbox": {
      "enabled": true,
      "defaultPreset": "inner-voice",
      "showSfxField": true,
      "userPresets": []
    }
  }
}
```

### バリデーション

- `defaultPreset` は標準IDまたは `userPresets[].id` のみ
- `tilt` / `scale` は範囲外を clamp
- 未知キーは保存時に削除

---

## 技術設計（要約）

## 1. 新規モジュール

- `js/modules/editor/TextboxPresetRegistry.js`
  - 標準/ユーザー定義プリセットの統合
- `js/modules/editor/TextboxDslParser.js`
  - DSL <-> AST
- `js/modules/editor/TextboxEffectRenderer.js`
  - AST -> HTML（preview/wysiwyg）
- `js/modules/editor/TextboxRichTextBridge.js`
  - WYSIWYG DOM <-> DSL

## 2. 既存改修

- `js/storage.js`
  - `DEFAULT_SETTINGS.editor.extendedTextbox` 追加
  - `loadSettings` の nested merge対応
- `js/editor-wysiwyg.js`
  - Textboxドロップダウン追加
  - 変換ブリッジ呼び出し
- `js/modules/editor/EditorCore.js`
  - `processTextboxDsl` を `processTextAnimations` 前段へ挿入
- `css/style.css`
  - `.zw-textbox`, `.zw-textbox--inner-voice`, `.zw-textbox--se-animal-fade` 等

---

## 非機能要件

- 入力遅延増加: 既存比 +10ms以内（通常テキスト入力）
- パース失敗は graceful fallback（本文維持）
- アクセシビリティ:
  - 動き削減設定時はボックスアニメーション停止
  - roleに応じた `aria-label` 付与

---

## テスト設計

## 1. Unit相当

- DSLパース/逆変換
- clamp/validation
- preset統合ロジック

## 2. E2E（Playwright）

- textarea: 選択 -> プリセット適用 -> DSL挿入確認
- WYSIWYG: Textbox適用 -> 切替保存 -> DSL往復保持
- 既存装飾との混在（shake + textbox）
- reduce motion時のアニメ停止

候補:

- `e2e/editor-extended-textbox.spec.js`（新規）

---

## 受け入れ基準

1. テキストボックスをプリセット1操作で適用できる
2. 既存 `[decor]/[anim]` と同時利用して崩れない
3. WYSIWYG/textarea の往復で主要属性が保持される
4. `sfx` などメタデータが失われない
5. 設定OFF時は textbox 拡張UIと適用処理が停止する
6. 既存ドキュメント（textbox未使用）に回帰がない

---

## 導入フェーズ

### Phase 1

- DSL + 標準3プリセット + textarea適用

### Phase 2

- WYSIWYG連携 + 設定UI + E2E

### Phase 3 (2026-03-18 実装完了)

- ユーザー定義プリセット管理UI（作成/編集/複製/削除）
  - gadgets-editor-extras.js 内の TextBox Effects セクションに統合
  - ID/表示名/役割/アニメーション/傾き/スケール/SFX の各フィールド
  - 組み込みプリセットとのID重複チェック、入力バリデーション
  - 最大100件のユーザープリセット
- WYSIWYG フローティングツールバーに TB ドロップダウン追加
  - 選択テキストをテキストボックスで囲む/解除
  - プリセット変更（既存テキストボックス内で選択時）
  - テキストボックス機能無効時は自動非表示
- E2E テスト 9件追加（Phase 3 合計）
- プラグイン注入（将来）

---

## 決定事項（2026-03-10）

1. `sfx` は Phase 1-3 では識別子保存のみとし、実音再生は後続フェーズで検討する
2. 標準プリセットIDは固定し、表示ラベルは日本語を初期値として管理する
3. `Ctrl+Alt+1..3` はOS競合リスクを優先し、Phase 1では採用しない（UI操作とコマンド経由を優先）
