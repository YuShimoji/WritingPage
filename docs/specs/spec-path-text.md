# パステキスト仕様書 (SP-073)

## 概要

ベジェ曲線や自由な曲線に沿ってテキストを配置する機能を提供する。
ポストモダン小説やコンクリートポエトリー、実験的タイポグラフィの表現に使用する。

## ステータス

- Phase 1: done (DSL記法 + SVGレンダリング + プレビュー/エクスポート対応)
- Phase 2: todo (WYSIWYG制御点ハンドルUI)
- Phase 3: todo (プリセットパス / フリーハンド)

---

## Phase 1 実装内容

### 記法

```markdown
:::zw-pathtext{path:"M 10 80 Q 95 10 180 80", font-size:"18px"}
曲線に沿って流れるテキスト
:::
```

### 属性

| 属性 | 説明 | デフォルト |
|------|------|-----------|
| path | SVG path の `d` 属性値 | `M 10 80 Q 95 10 180 80` |
| font-size | フォントサイズ | `16px` |
| text-anchor | start / middle / end | `start` |
| start-offset | パス上の開始位置 (%) | `0%` |
| side | left / right | (なし) |
| viewbox | SVG viewBox | (パスから自動計算) |
| stroke | パス線の色 | `none` |
| stroke-width | パス線の太さ | `0` |

### レンダリング

SVG `<textPath>` を使用してテキストをパスに沿って配置:

```html
<div class="zw-pathtext" data-path="M 10 80 Q 95 10 180 80">
  <svg viewBox="..." class="zw-pathtext__svg" preserveAspectRatio="xMidYMid meet">
    <defs><path id="zw-pathtext-1" d="M 10 80 Q 95 10 180 80" fill="transparent" /></defs>
    <text font-size="18px" fill="currentColor">
      <textPath href="#zw-pathtext-1" text-anchor="start" startOffset="0%">
        曲線に沿って流れるテキスト
      </textPath>
    </text>
  </svg>
</div>
```

### viewBox 自動計算

viewBox が指定されない場合、パスの座標値から自動計算:

- パス内の全座標を抽出 (X座標/Y座標を分離)
- min/max に 20px パディングを追加

### パス線表示

`stroke` 属性を指定するとパスの線が表示される:

```markdown
:::zw-pathtext{path:"M 20 80 Q 100 10 180 80", stroke:"#888", stroke-width:"1"}
パスの線を表示したテキスト
:::
```

### 対応箇所

- DslParser: `BLOCK_TYPES` に `pathtext` 追加、`renderPathtextHtml()` 追加
- TextboxEffectRenderer: `renderPathtext()` 追加
- editor-preview.js: DSL退避正規表現に `pathtext` 追加
- reader-preview.js: DSL退避正規表現に `pathtext` 追加
- CSS: `.zw-pathtext` / `.zw-pathtext__svg` スタイル追加

---

## 未決定事項 (Phase 2以降)

- [ ] WYSIWYG上での制御点ハンドル編集UI
- [ ] パスの最大複雑度（制御点の上限数）
- [ ] 日本語縦書きテキストのパス配置対応
- [ ] パステキスト内でのルビ表示の可否
- [ ] パスの共有・再利用（テンプレート化）
- [ ] パステキストへのアニメーション適用（SP-074 との組み合わせ）
- [ ] モバイル上でのパスハンドル操作の実現可能性
- [ ] プリセットパス（円弧、波線、螺旋等）

---

## 既存仕様との関係

| 仕様 | 関係 |
|------|------|
| SP-016 拡張テキストボックス | 共通のブロック要素基盤。矩形 vs 曲線の違い |
| SP-062 テキスト表現アーキテクチャ | パステキストもTextEffect/Animationの適用対象 |
| SP-074 Web小説演出 | テクスチャやアニメーションとの組み合わせ |

## 影響範囲

- `js/modules/editor/TextboxDslParser.js`: BLOCK_TYPES + renderPathtextHtml
- `js/modules/editor/TextboxEffectRenderer.js`: renderPathtext
- `js/editor-preview.js`: DSL退避正規表現
- `js/reader-preview.js`: DSL退避正規表現
- `css/style.css`: .zw-pathtext スタイル
