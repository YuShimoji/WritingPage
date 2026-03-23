# Worker Prompt: A-4 px→rem Phase 2-3

> 生成日: 2026-03-23 / 担当: 独立Worker (Sonnet推奨)
> 並行実行: 可 (コアセッションと競合しない)

## 概要

CSS の padding / margin / width / height 等のプロパティを px から rem に移行する機械的作業。
Phase 1 (font-size + CSSカスタムプロパティ + JS setProperty) は完了済み。

## スコープ

- Phase 2: padding / margin の rem化
- Phase 3: width / height / gap / border-radius 等の rem化

## 対象ファイル

- `css/style.css` (メイン)
- `css/gadgets.css`
- `css/layout.css`
- `css/common.css`
- `css/special.css`
- `css/graphic-novel.css`
- `css/dock-panel.css`

## 作業ルール

1. **変換基準**: `1rem = 16px` (html font-size: 16px)
2. **変換対象外**:
   - `1px` (border等、デザイン意図で1pxが適切なもの)
   - `0px` → `0` (単位不要)
   - `box-shadow` の値 (ブラウザ互換性)
   - `@media` のブレークポイント値 (px維持が慣例)
3. **変換例**: `padding: 8px 16px` → `padding: 0.5rem 1rem`
4. **CSS変数**: `--var: 12px` → `--var: 0.75rem` (カスタムプロパティも対象)
5. **JS内の `px` 設定**: `js/` 内で `style.xxx = '...px'` としている箇所も確認・変換

## 検証

- `npm run lint:js:check` が通ること
- `npx playwright test` で既存テスト全パス (E2E 447件)
- ブラウザで主要画面が崩れないこと (目視: Normal/Focus/Blank/Reader各モード)

## 注意事項

- Phase 1 で変換済みの箇所を二重変換しないこと
- `variables.css` のカスタムプロパティ定義も確認すること
- 変更量が大きいので、ファイル単位でコミットするのが安全

## 完了条件

- CSS/JS内の px 値が原則 rem に置換されている (除外対象を除く)
- E2Eテスト全パス
- ROADMAP.md の A-4 ステータスを `done` に更新
