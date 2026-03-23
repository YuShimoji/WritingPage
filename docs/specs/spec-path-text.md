# パステキスト仕様書 (SP-073)

## 概要

ベジェ曲線や自由な曲線に沿ってテキストを配置する機能を提供する。
ポストモダン小説やコンクリートポエトリー、実験的タイポグラフィの表現に使用する。

## ステータス

- Phase 1: done (DSL記法 + SVGレンダリング + プレビュー/エクスポート対応)
- Phase 2: done (WYSIWYG制御点ハンドルUI + パスコマンドパーサー + Bridge pathtext serialize)
- Phase 3: done (プリセットパス7種 + 右クリックメニュー + side切替 + パス線トグル)
- Phase 4: todo (フリーハンド描画)

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

## Phase 2 実装内容

### WYSIWYG制御点ハンドルUI

WYSIWYGモードでパステキストブロックをクリックすると、ベジェ曲線の制御点をドラッグ編集できる。

#### ユーザー操作

1. パステキストブロックをクリック → 制御点ハンドルが表示
2. ハンドルをドラッグ → パスがリアルタイム変形
3. ドラッグ終了 → `data-path` 属性と DSL が自動更新
4. パス外をクリック → ハンドル非表示

#### ハンドルの種類

| 種類 | CSS クラス | 表示 |
|------|-----------|------|
| 端点 (M/L/Q終点/C終点/A終点) | `zw-pathtext-handle--endpoint` | 塗り潰し円 (6px) |
| 制御点 (Q制御/C制御1,2/S制御) | `zw-pathtext-handle--control` | 中空円 (6px) |
| ガイドライン | `zw-pathtext-handle__guide` | 点線 |

#### 対応パスコマンド

M, L, Q, C, S, T, A (H/V は非対応)

### 対応箇所

- `js/modules/editor/PathHandleOverlay.js`: パスコマンドパーサー + ハンドルオーバーレイ UI
- `js/editor-wysiwyg.js`: クリック検出 + オーバーレイ attach/detach
- `js/modules/editor/TextboxRichTextBridge.js`: pathtext シリアライズ追加
- `js/modules/editor/TextboxDslParser.js`: `stringifyAttrs` に pathtext 属性キー追加
- `css/style.css`: ハンドルスタイル (accent-color, reduced-motion 対応)
- `e2e/pathtext-handles.spec.js`: E2E 20件

### 暗黙仕様

- ハンドルデザイン: シンプル円方式 (端点=塗り潰し, 制御点=中空, ガイドライン=点線)。色は `--accent-color`
- パスプリセットUI: Phase 3 に送る
- テキスト配置方向切り替えUI: Phase 3 で右クリックメニューに実装済み
- viewBox はドラッグ中に自動再計算される

---

## Phase 3 実装内容

### プリセットパス & コンテキストメニュー

パステキスト上で右クリックすると、パスの形状変更・テキスト配置方向・パス線表示をコントロールできるコンテキストメニューが表示される。

#### プリセット一覧 (7種)

| 名前 | ラベル | パスコマンド |
|------|--------|-------------|
| line | 直線 | M + L |
| curve | 上カーブ | M + Q |
| sCurve | S字カーブ | M + C |
| arc | 円弧 | M + A |
| wave | 波線 | M + Q + Q |
| curveDown | 下カーブ | M + Q |
| step | 階段 | M + L + L + L |

#### コンテキストメニュー構成

1. **パスの形状を変更** (ヘッダー) → 7種プリセットボタン
2. **テキスト配置方向** (ヘッダー) → 左(デフォルト) / 右
3. **パス線を表示/非表示** → stroke トグル

#### 暗黙仕様

- プリセット適用時、viewBox は自動再計算
- プリセット適用時、ハンドルオーバーレイは自動再アタッチ
- コンテキストメニューは `cl-context-menu` パターン (BEM, viewport clamping, role=menu)
- フリーハンド描画は Phase 4 に送る (ベジェ近似アルゴリズムの工数大)

### 対応箇所

- `js/modules/editor/PathHandleOverlay.js`: PRESETS / PRESET_LABELS / generatePresetPath 追加
- `js/editor-wysiwyg.js`: contextmenu リスナー + _showPathtextContextMenu + _applyPresetPath + side/stroke操作
- `css/style.css`: `.cl-context-menu__header` スタイル追加
- `e2e/pathtext-handles.spec.js`: Phase 3 E2E 8件追加 (合計20件)

---

## 未決定事項 (Phase 4以降)

- [ ] フリーハンド描画 (ポインタ追跡 + Ramer-Douglas-Peucker簡略化 + ベジェ近似)
- [ ] パスの最大複雑度（制御点の上限数）
- [ ] 日本語縦書きテキストのパス配置対応
- [ ] パステキスト内でのルビ表示の可否
- [ ] パスの共有・再利用（テンプレート化）
- [ ] パステキストへのアニメーション適用（SP-074 との組み合わせ）
- [ ] モバイル上でのパスハンドル操作の実現可能性

---

## 既存仕様との関係

| 仕様 | 関係 |
|------|------|
| SP-016 拡張テキストボックス | 共通のブロック要素基盤。矩形 vs 曲線の違い |
| SP-062 テキスト表現アーキテクチャ | パステキストもTextEffect/Animationの適用対象 |
| SP-074 Web小説演出 | テクスチャやアニメーションとの組み合わせ |

## 影響範囲

- `js/modules/editor/TextboxDslParser.js`: BLOCK_TYPES + renderPathtextHtml + stringifyAttrs pathtext属性
- `js/modules/editor/TextboxEffectRenderer.js`: renderPathtext
- `js/modules/editor/PathHandleOverlay.js`: パスコマンドパーサー + ハンドルオーバーレイUI (Phase 2)
- `js/modules/editor/TextboxRichTextBridge.js`: pathtext シリアライズ (Phase 2)
- `js/editor-wysiwyg.js`: pathtext クリック検出 + オーバーレイ統合 (Phase 2)
- `js/editor-preview.js`: DSL退避正規表現
- `js/reader-preview.js`: DSL退避正規表現
- `css/style.css`: .zw-pathtext スタイル + ハンドルスタイル (Phase 2)
- `e2e/pathtext-handles.spec.js`: Phase 2 E2E 20件
