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

## Phase 3（完了）— H4-H6 + 詳細プロパティ

### 実装内容

**H1-H3 詳細プロパティ追加:**

- `lineHeight` スライダー: 1.0 - 2.5（step 0.05）
- `letterSpacing` スライダー: -0.05em - 0.2em（step 0.01em）
- H1-H3 各レベルに4コントロール（size/weight/lineHeight/letterSpacing）

**H4-H6 簡易調整セクション:**

- 折りたたみ式（`localStorage: zenwriter-heading-h46-open`）
- `size` スライダーのみ: 0.8em - 2em（step 0.05）

**プレビュー拡張:**

- H1-H6 全レベルのミニプレビュー（fontSize/fontWeight/letterSpacing/lineHeight 反映）

**印刷連携:**

- `print.css` は同一CSS変数を使用済み → 追加コード不要で印刷にも自動反映

### E2Eテスト（4件追加、計10件）

1. H1 lineHeight カスタムでCSS変数が変わる
2. H1 letterSpacing カスタムでCSS変数が変わる
3. H4 size カスタムでCSS変数が変わり、リロード後も復元される
4. H4-H6 size スライダーと H1 lineHeight/letterSpacing スライダーがUI上に存在する

## ユーザー操作ワークフロー

見出しタイポグラフィの利用場面を具体的なシナリオで示す。

### WF-1: 長編小説の章立て（プリセット選択のみ）

**ユーザー像**: 長編小説を執筆中。章タイトル (H1) を目立たせたい。
**操作手順**:

1. サイドバー「テーマ・フォント」セクションを開く
2. 「見出しスタイル」ガジェットのプリセットを「章扉」に変更
3. ミニプレビューで H1 が大きく、字間が広がったことを確認
4. そのまま執筆を続行

**結果**: H1=2em/字間0.08em、H2=1.4em、H3=1.15em。章タイトルが視覚的に際立ち、節見出しは控えめに。印刷時も同じバランスが維持される。

### WF-2: エッセイ・随筆（本文重視プリセット + 微調整）

**ユーザー像**: 短いエッセイを書いている。見出しが目立ちすぎず本文に没入したい。
**操作手順**:

1. プリセットを「本文重視」に変更（H1=1.25em、全体的に控えめ）
2. ミニプレビューで確認 — H1 がもう少し太い方がよいと感じる
3. H1 の weight スライダーを「太字」→「極太(800)」に変更
4. カスタムオーバーライドとして保存される

**結果**: 本文重視ベースだが H1 だけ太字が強調された独自バランス。リセットボタンでいつでもプリセット値に戻せる。

### WF-3: ゲームシナリオ・脚本（H4-H6 活用）

**ユーザー像**: ゲームシナリオで H1=章、H2=シーン、H3=ビート、H4=ト書き区切り を使い分けている。
**操作手順**:

1. プリセット「標準」のまま開始
2. 「H4-H6 詳細」セクションを展開
3. H4 size を 1.1em → 1.0em に縮小（ト書き区切りなので控えめに）
4. H1-H3 の letter-spacing を各 0.02em に統一（シーン番号の視認性向上）

**結果**: 深い階層構造でも各レベルが明確に区別でき、ト書き区切りは本文に溶け込む。

### WF-4: 校正・レビュー時（一時的な設定変更）

**ユーザー像**: 構成を俯瞰するため、見出しを一時的に大きくして全体構造を確認したい。
**操作手順**:

1. 現在の設定を覚えておく（または後でリセットする前提）
2. プリセットを「章扉」に変更（H1=2em で視認性最大）
3. Outline ガジェットと併用して構成を確認
4. 確認後、リセットボタンまたは元のプリセットに戻す

**結果**: 見出しの視覚的階層が強調され、構成の弱い箇所（レベル飛び、見出し連続等）を発見しやすい。

### サンプルファイル

見出しプリセットの効果を確認するためのサンプル Markdown を同梱:

- `samples/heading-typography-novel.md` — 長編小説の章構成サンプル
- `samples/heading-typography-scenario.md` — ゲームシナリオ/脚本の多階層サンプル

ファイルインポート機能が整った段階で「読込」ボタンからインポートし、プリセット切り替えの視覚的差異を即座に体験できる。

## Phase 4（完了）— ユーザープリセット + 整合チェック

### 実装内容

**ユーザープリセット保存・管理:**

- `HeadingPresetRegistry` に `listAllPresets(settings)`, `saveUserPreset(storage, label, values)`, `deleteUserPreset(storage, id)`, `isUserPreset(id)`, `isBuiltInPreset(id)` を追加
- `MAX_USER_PRESETS = 20`（上限）
- ユーザープリセットID形式: `user-{timestamp}`
- `storage.js`: `DEFAULT_SETTINGS.heading.userPresets = []`、`normalizeSettingsShape` に Array.isArray ガード追加
- `gadgets-heading.js`: プリセット select を `<optgroup>`（組み込み / カスタム）で分離、「保存」「削除」ボタン追加
- `theme.js`: `applyHeadingSettings` で `userPresets` 配列を保全するパッチ構造に変更

**見出しレベル整合バッジ（Sections Navigator 拡張）:**

- `gadgets-sections-nav.js`: 見出しツリーのレベル飛び（H1→H3 等）を検出し `.sections-level-warning` クラスを付与
- ツールチップ: 「H{prev} → H{current}: レベルが飛んでいます」
- CSS: `.sections-level-warning` — 黄色（#e8a838）、font-weight: 600

**見送り:**

- margin-top / margin-bottom の UI 化（CSS 変数で制御可能だが UI 需要が不明。必要時に別途対応）

### E2Eテスト（4件追加、計14件）

1. ユーザープリセット保存 → listAllPresets に含まれる
2. ユーザープリセット削除 → listAllPresets から消える
3. ユーザープリセットがリロード後も保持される
4. 組み込みプリセットは削除不可

## 優先順位

- 優先度: `P1`（高）
- 理由: 長編執筆で見出しの情報設計品質が直接 UX に効く。既存変数があり実装コストが低い。

## 依存関係

- 前提: `SP-054`（Typography 設定責務の明確化）
- 連携: `SP-052`（見出しナビ）, `SP-055`（WYSIWYG block editing）
- 出力連携: `print.css` 反映ルール

## 受け入れ基準

1. H1-H6 の調整値が編集画面と印刷プレビューで一致する。 **[Phase 3 達成: CSS変数共有]**
2. 見出しプリセット適用後、個別微調整が可能。 **[Phase 2 達成]**
3. 見出し設定変更が本文フォント設定を破壊しない。 **[Phase 1 達成]**
4. 設定 JSON に未設定レベルがあっても既定値フォールバックで崩れない。 **[Phase 1 達成]**
5. ユーザーが独自の見出しスタイルを保存・再利用できる。 **[Phase 4 達成]**
6. 組み込みプリセットは編集・削除不可。 **[Phase 4 達成]**
7. 見出しレベルの構造的問題を執筆中に検出できる。 **[Phase 4 達成: Sections Nav 警告バッジ]**

## 実装リスク（CTO観点）

- 6レベル全項目のUIは操作負荷が高い → Phase 2 で H1-H3 に絞り段階導入で対処済み
- Preview/Print/Embed でスタイル適用順序がずれると表示不一致が発生 → Phase 3 で対応予定
- WYSIWYG の `h1-h3` 制限（`SP-055`）との差分が UX 混乱を招く可能性 → 同じ H1-H3 範囲で整合
