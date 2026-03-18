# 装飾プリセット統合仕様

## 概要

本仕様は `[decor]/[anim]` の単発タグ運用を、意味付きプリセットへ統合する。
Textbox仕様と自然に接続し、装飾の乱立と運用コストを抑える。

---

## 対象（SP-060）

- semantic preset 5種 + 既存 legacy preset 3種
- presetごとの `decor-*` / `anim-*` / `ornament` 合成ルール
- Markdown/WYSIWYG round-trip の保証
- CSS クラスによるビジュアル表現

---

## 非スコープ

- 新規アニメーションエンジン開発
- 作品テンプレート配布システム
- Phase 3 統合UI (将来)

---

## Semantic Preset 一覧

### Legacy Presets (後方互換維持)

| ID | label | role | textEffects | animations | ornaments | tilt | scale |
|----|-------|------|-------------|------------|-----------|------|-------|
| `inner-voice` | 心の声 | monologue | italic | fadein | soft | -4 | 0.98 |
| `se-animal-fade` | 動物SE | sfx | black, outline | shake, fade | burst | 0 | 1.0 |
| `typing-sequence` | タイピング | system | (なし) | type | mono | 0 | 1.0 |

### Semantic Presets (Phase 1 追加)

| ID | label | role | textEffects | animations | ornaments | tilt | scale | 用途 |
|----|-------|------|-------------|------------|-----------|------|-------|------|
| `dialogue` | 台詞 | dialogue | (なし) | (なし) | (なし) | 0 | 1.0 | 通常の会話文。最もプレーンな装飾 |
| `monologue` | 独白 | monologue | italic | fadein | soft | -2 | 0.98 | 内面描写。inner-voice の semantic 版 |
| `narration` | 語り | narration | (なし) | (なし) | mono | 0 | 0.95 | ナレーション・地の文の強調 |
| `chant` | 詠唱 | custom | bold, outline | shake | burst | 0 | 1.05 | 呪文・詩・呼びかけ |
| `warning` | 警告 | system | bold | shake | burst | 2 | 1.02 | システム警告・危険表示 |

---

## 実装方針

1. 既存タグは残し、プリセットは薄いラッパーとして導入
2. Textbox preset registry と同じキー体系を採用
3. RichText command adapter への追加は最小化し、Bridge変換中心で実装
4. ALLOWED_ROLES に `chant` は追加せず `custom` で吸収 (role 乱立防止)

---

## CSS クラス

各 semantic preset は `zw-textbox--{id}` のクラスを持つ。

- `.zw-textbox--dialogue`: accent カラー左ボーダー
- `.zw-textbox--monologue`: 透過 + イタリック
- `.zw-textbox--narration`: やや小さいフォント + 薄い透過
- `.zw-textbox--chant`: 字間広め + 中央揃え + ボールド
- `.zw-textbox--warning`: danger カラー左ボーダー + 薄い赤背景

---

## Phase

| Phase | 内容 | 状態 |
|------|------|------|
| P1 | semantic preset 5種定義 + CSS + TextboxPresetRegistry | done |
| P2 | WYSIWYG/Markdown round-trip テスト (E2E 7件) | done |
| P3 | 統合UI: TB ドロップダウン (8プリセット一覧 + role バッジ) | done |

---

## 受け入れ基準

1. [x] semantic preset適用で既存装飾タグに安定展開される
2. [x] Markdown正本の可読性が維持される
3. [x] Textboxと同時利用しても競合しない
4. [x] `prefers-reduced-motion` 環境でアニメ要素を静的装飾へフォールバックできる
5. [x] 既存 legacy preset との後方互換が維持される
6. [x] Phase 3: TB ドロップダウンで8プリセットを統一アクセス (旧4ボタン → 1ドロップダウン)

---

## Phase 3: 統合UI

### 選択ツールチップの TB ドロップダウン

- 旧: TB / 声 / SE / Type の4ボタンがフラットに並ぶ
- 新: 「TB ▼」ボタン1つ、クリックで全8プリセットのドロップダウン表示
- 各項目: ラベル (左) + role バッジ (右、薄い表示)
- ドロップダウンは下方向に展開
- 外側クリックで閉じる
- textbox 機能が無効時はドロップダウンごと非表示

### 実装ファイル

- `js/app-editor-bridge.js`: TB ドロップダウン生成 + プリセット動的ビルド
- `css/style.css`: `.tb-dropdown-*` スタイル

---

## DSL 記法

```markdown
:::zw-textbox{preset:"dialogue"}
「こんにちは」と彼女は言った。
:::

:::zw-textbox{preset:"warning"}
危険区域に侵入しました。
:::
```

---

## 実装リスク

- presetのネスト展開順序によって、`decor-*` と `anim-*` が重複適用されるリスク → 重複排除で対応済み
- semantic命名が曖昧だとプリセット増殖を再発するリスク → 5種に絞り込み済み
