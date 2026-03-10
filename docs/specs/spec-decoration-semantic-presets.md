# 装飾プリセット統合仕様（Draft v0.1）

## 概要

本仕様は `[decor]/[anim]` の単発タグ運用を、意味付きプリセットへ統合する。  
Textbox仕様と自然に接続し、装飾の乱立と運用コストを抑える。

---

## 対象（SP-060）

- semantic preset:
  - `dialogue`
  - `monologue`
  - `narration`
  - `chant`
  - `warning`
- presetごとの `decor-*` / `anim-*` 合成ルール
- Markdown/WYSIWYG round-trip の保証範囲拡張

---

## 非スコープ

- 新規アニメーションエンジン開発
- 作品テンプレート配布システム

## 優先順位（PM判断）

- 優先度: `P3`（中-低）
- 理由:
  - 体験価値は高いが、基盤（`SP-055`, `SP-016`）の安定前に拡張すると運用負債を生みやすい
  - 先に本文可読性（`SP-057`, `SP-058`）を固めた方がプロダクト価値が高い

---

## 実装方針（競合回避）

1. 既存タグは残し、プリセットは薄いラッパーとして導入
2. Textbox preset registry と同じキー体系を採用
3. RichText command adapter への追加は最小化し、Bridge変換中心で実装

---

## Phase

| Phase | 内容 | 依存 |
|------|------|------|
| P1 | semantic preset定義 + 既存タグへの展開規則 | SP-016 |
| P2 | WYSIWYG/Markdown往復保証の明文化とテスト | SP-055 |
| P3 | Textbox presetとの統合UI（重複削減） | P2 |

---

## 受け入れ基準

1. semantic preset適用で既存装飾タグに安定展開される
2. Markdown正本の可読性が維持される
3. Textboxと同時利用しても競合しない
4. `prefers-reduced-motion` 環境でアニメ要素を静的装飾へフォールバックできる

## 実装リスク（CTO観点）

- presetのネスト展開順序によって、`decor-*` と `anim-*` が重複適用されるリスク
- RichTextサニタイズ規則の複雑化に伴うXSS・互換性テストコスト増
- semantic命名が曖昧だとプリセット増殖を再発し、運用ガバナンスが崩れるリスク
