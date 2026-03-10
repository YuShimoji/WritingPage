# テキスト表現アーキテクチャ仕様（SSOT）

## 概要

本仕様は Zen Writer におけるテキスト表現の Tier 1 実装を定義する。
保存形式は宣言的な Markdown / DSL を維持し、preview と WYSIWYG では変換レイヤを経由して DOM / CSS へ投影する。

本ドキュメントをテキスト表現まわりの唯一の SSOT とする。

---

## MVP 範囲

- Tier 1 のみ
- 対象:
  - 既存 inline rich text tag（`[decor]`, `[anim]`）
  - `:::zw-textbox{...}` DSL
  - preset sugar の下位レイヤ展開
  - preview / WYSIWYG の最小 round-trip
  - reduced motion の最小対応
  - plain / backlog 縮退
- 非対象:
  - block ornament の本実装
  - box in box の完全 round-trip
  - 複数 animation の厳密な時間制御

---

## 責務モデル

### 1. Rich Text

- 責務:
  - WYSIWYG 上の編集体験
  - HTML fragment と Markdown の往復
- 代表モジュール:
  - `js/editor-wysiwyg.js`
  - `js/modules/editor/RichTextCommandAdapter.js`
  - `js/modules/editor/TextboxRichTextBridge.js`

### 2. Text Effect

- 責務:
  - 文字単位の装飾 class への写像
- 代表モジュール:
  - `js/modules/editor/TextEffectDictionary.js`

### 3. Animation

- 責務:
  - 文字単位または box 単位 animation class への写像
  - reduced motion 時の drop 規則
- 代表モジュール:
  - `js/modules/editor/TextAnimationDictionary.js`

### 4. Ornament

- 責務:
  - box の静的な見た目 class への写像
  - 将来の block ornament 拡張の受け皿
- 代表モジュール:
  - `js/modules/editor/TextOrnamentDictionary.js`

### 5. Preset Sugar

- 責務:
  - author-facing preset 名を lower layer へ展開する
- 代表モジュール:
  - `js/modules/editor/TextboxPresetRegistry.js`
  - `js/modules/editor/TextExpressionPresetResolver.js`

### 6. Projection

- 責務:
  - 正規化済みモデルを HTML / DOM / CSS class に投影する
- 代表モジュール:
  - `js/modules/editor/TextboxEffectRenderer.js`

---

## データモデル

### 保存形式

- 正本:
  - editor content の Markdown
  - `:::zw-textbox{...}` は宣言的 DSL として保存
- settings:

```json
{
  "editor": {
    "extendedTextbox": {
      "enabled": true,
      "defaultPreset": "inner-voice",
      "showSfxField": true,
      "userPresets": []
    },
    "textExpression": {
      "enabled": true,
      "tier": 1,
      "fallbackMode": "plain",
      "realtimePreview": true
    }
  }
}
```

### Textbox 宣言モデル

```json
{
  "type": "textbox",
  "preset": "inner-voice",
  "role": "monologue",
  "anim": "fadein",
  "tilt": -4,
  "scale": 0.98,
  "sfx": "",
  "content": "..."
}
```

### 内部正規化モデル

```json
{
  "presetId": "inner-voice",
  "role": "monologue",
  "sfx": "",
  "className": "zw-textbox--inner-voice",
  "tilt": -4,
  "scale": 0.98,
  "layers": {
    "textEffects": ["italic"],
    "animations": ["fadein"],
    "ornaments": ["soft"]
  },
  "fallbackMode": "plain",
  "reducedMotion": false
}
```

---

## 演出辞書

### Text Effect

- `bold -> decor-bold`
- `italic -> decor-italic`
- `outline -> decor-outline`
- `black -> decor-black`

### Animation

- `fade -> anim-fade`
- `fadein -> anim-fade-in`
- `shake -> anim-shake`
- `type -> anim-typewriter`
- Tier 1 reduced motion rule:
  - すべて `drop`

### Ornament

- `soft -> zw-ornament-soft`
- `burst -> zw-ornament-burst`
- `mono -> zw-ornament-mono`
- TODO:
  - block ornament は Tier 2 以降

### Preset Sugar

- `inner-voice`
  - textEffects: `italic`
  - animations: `fadein`
  - ornaments: `soft`
- `se-animal-fade`
  - textEffects: `black`, `outline`
  - animations: `shake`, `fade`
  - ornaments: `burst`
- `typing-sequence`
  - animations: `type`
  - ornaments: `mono`

---

## 適用優先順位

1. `settings.editor.textExpression` の global rule
2. DSL 属性 (`preset`, `role`, `anim`, `tilt`, `scale`, `sfx`)
3. preset sugar 展開
4. reduced motion rule
5. fallback rule
6. DOM / CSS projection

---

## 競合ルール

- `anim` 属性は preset animation より優先し、先頭 animation として扱う
- preset sugar は lower layer へ展開されるが、保存時は preset 名を維持する
- inline `[decor]` / `[anim]` は textbox content 内で有効
- box の `tilt`, `scale` は container transform のみを担当し、inline effect へ波及しない
- 同一 category の重複は Tier 1 では重複排除のみ行い、詳細マージはしない

---

## 縮退ルール

- `fallbackMode = plain`
  - 未対応表現は `.zw-textbox--plain` で静的表示
- `fallbackMode = backlog`
  - 静的表示に加えて backlog note を表示
- reduced motion
  - animation layer を drop し、静的 ornament / effect のみ残す

---

## 非対応ケース

- textbox のネスト
- block ornament の保存/編集 UI
- 複数 box animation の時間軸制御
- box 内複雑 block の厳密 round-trip

---

## 受け入れ基準

1. 既存保存データは migration なしで読める
2. preview と WYSIWYG が同じ DSL から投影される
3. preset は内部で lower layer に展開される
4. reduced motion 時に animation を止める
5. 未対応ケースで plain または backlog に縮退する
