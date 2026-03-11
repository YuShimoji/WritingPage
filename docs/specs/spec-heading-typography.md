# SP-058 見出しタイポグラフィ仕様 v1.0

## 目的

既存の `--heading-h1...h6-*` CSS変数を UI から操作可能にし、章タイトルや節構造の可読性・演出力を高める。

## 背景（現状）

- H1-H6 の変数は既に定義済み（`css/style.css`, `css/variables.css`）。
- 印刷スタイル（`css/print.css`）でも同変数を使用しており、編集時と出力時の統合余地が大きい。

## 対象CSS変数

H1-H6 各レベルに以下のCSS変数を提供:

- `--heading-h{N}-size` — フォントサイズ（em単位）
- `--heading-h{N}-weight` — フォントウェイト
- `--heading-h{N}-line-height` — 行間
- `--heading-h{N}-margin-top` — 上マージン
- `--heading-h{N}-margin-bottom` — 下マージン
- `--heading-h{N}-letter-spacing` — 字間

## アーキテクチャ

### データ層

| コンポーネント | ファイル | 責務 |
| --- | --- | --- |
| `HeadingPresetRegistry` | `js/heading-preset-registry.js` | プリセット定義の中央管理 |
| `applyHeadingSettings()` | `js/theme.js` | CSS変数適用 + 設定保存 + イベント発火 |
| `settings.heading` | `js/storage.js` | `{ preset, custom }` の永続化 |

### UI層

| コンポーネント | ファイル | 責務 |
| --- | --- | --- |
| `HeadingStyles` ガジェット | `js/gadgets-heading.js` | プリセット選択・プレビュー・個別調整UI |

### プリセット定義（HeadingPresetRegistry）

3プリセットを提供:

| ID | ラベル | H1 size | H2 size | H3 size | 特徴 |
| --- | --- | --- | --- | --- | --- |
| `default` | 標準 | 1.5em | 1.3em | 1.15em | バランス型 |
| `chapter-title` | 章扉 | 2em | 1.5em | 1.2em | H1を大きく強調、letter-spacing広め |
| `body-emphasis` | 本文重視 | 1.3em | 1.15em | 1.05em | 見出しを控えめにし本文に集中 |

各プリセットは H1-H6 全レベルの `size`, `weight`, `lineHeight`, `marginTop`, `marginBottom`, `letterSpacing` を定義。

### 設定構造（storage.js）

```json
{
  "heading": {
    "preset": "default",
    "custom": {
      "h1": { "size": "2.5em", "weight": "800" }
    }
  }
}
```

- `preset`: 適用中のプリセットID
- `custom`: プリセット値に対するユーザーオーバーライド（レベル×プロパティ）

### 適用フロー（theme.js applyHeadingSettings）

1. `preset` のベース値を `HeadingPresetRegistry.getValues(id)` から取得
2. `custom` オーバーライドをレベル単位でマージ
3. マージ結果を `document.documentElement.style.setProperty()` でCSS変数に反映
4. `storage.saveSettings({ heading: { preset, custom } })` で永続化
5. `ZenWriterSettingsChanged` イベントを発火

## Phase 1（完了）— データ層 + API

### 実装内容

- `HeadingPresetRegistry`: 3プリセットの定義・取得API
  - `listPresets()`, `getPreset(id)`, `getValues(id)`, `LEVELS`
- `theme.js`: `applyHeadingSettings(presetId, customOverrides)` メソッド追加
  - CSS変数適用・設定保存・イベント発火を一括処理
- `storage.js`: `heading: { preset, custom }` 構造の永続化対応
- 起動時復元: `theme.js init` で保存済み見出し設定を自動適用

### E2Eテスト（3件）

1. プリセット適用でCSS変数が変わる
2. 設定がリロード後に復元される
3. 見出し設定変更が本文フォント設定を破壊しない

## Phase 2（完了）— UIガジェット + プレビュー

### 実装内容

`HeadingStyles` ガジェット（`js/gadgets-heading.js`）を `theme` グループに登録。

**UI構成:**

1. **プリセット選択** — `<select id="heading-preset-select">`
   - `HeadingPresetRegistry.listPresets()` から動的生成
   - 変更時に `applyHeadingSettings(presetId, custom)` 呼び出し

2. **ミニプレビュー** — プリセット+カスタム適用後の見た目を即時確認
   - H1/H2/H3 の3行をプリセットの相対サイズでレンダリング
   - 背景 `rgba(128,128,128,0.08)`, border-radius: 6px
   - カスタム調整時もマージ後の値でリアルタイム更新

3. **H1-H3 個別調整**
   - `size` スライダー: 0.8em - 3em（step 0.05）、`data-level` / `data-prop` 属性付き
   - `weight` セレクト: normal / 500 / 600 / bold / 800 / 900
   - 値変更時に `custom` オーバーライドとして即時保存

4. **リセットボタン** — `<button id="heading-reset-btn">`
   - `custom` を `{}` に戻しプリセット値に復帰

**設定同期:**

- `ZenWriterSettingsChanged` / `ZWLoadoutsChanged` / `ZWLoadoutApplied` イベントで `refreshState()` 呼び出し

### E2Eテスト（3件追加、計6件）

1. ガジェット内プリセットselect変更でCSS変数が変わる
2. H1 sizeスライダー操作でカスタムオーバーライドが保存される
3. リセットボタンでプリセット値に復帰する

## Phase 3（未着手）— 拡張

### 計画内容

- H4-H6 の個別調整UI（簡易版）
- `line-height` / `margin-top` / `margin-bottom` / `letter-spacing` スライダー追加
- Outline（SP-052）との見出しレベル整合チェック
- 印刷プレビュー（`print.css`）への反映確認UI
- プリセットのユーザー定義・保存

## 優先順位

- 優先度: `P1`（高）
- 理由: 長編執筆で見出しの情報設計品質が直接 UX に効く。既存変数があり実装コストが低い。

## 依存関係

- 前提: `SP-054`（Typography 設定責務の明確化）
- 連携: `SP-052`（見出しナビ）, `SP-055`（WYSIWYG block editing）
- 出力連携: `print.css` 反映ルール

## 受け入れ基準

1. H1-H6 の調整値が編集画面と印刷プレビューで一致する。
2. 見出しプリセット適用後、個別微調整が可能。 **[Phase 2 達成]**
3. 見出し設定変更が本文フォント設定を破壊しない。 **[Phase 1 達成]**
4. 設定 JSON に未設定レベルがあっても既定値フォールバックで崩れない。 **[Phase 1 達成]**

## 実装リスク（CTO観点）

- 6レベル全項目のUIは操作負荷が高い → Phase 2 で H1-H3 に絞り段階導入で対処済み
- Preview/Print/Embed でスタイル適用順序がずれると表示不一致が発生 → Phase 3 で対応予定
- WYSIWYG の `h1-h3` 制限（`SP-055`）との差分が UX 混乱を招く可能性 → 同じ H1-H3 範囲で整合
