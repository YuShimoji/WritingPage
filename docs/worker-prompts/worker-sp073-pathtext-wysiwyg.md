# Worker Prompt: SP-073 パステキスト Phase 2 — WYSIWYG制御点ハンドル

> 生成日: 2026-03-23 / 担当: 独立Worker (Opus推奨 / HUMAN_AUTHORITY判断あり)
> 並行実行: 条件付き可 (UIインタラクション設計はコアセッションに確認)

## 概要

パステキスト (`:::zw-pathtext`) のWYSIWYGモード上で、ベジェ曲線の制御点を
マウスでドラッグして編集できるUIを実装する。Phase 1 (DSL + SVGレンダリング) は完了済み。

## 現状

- Phase 1完了: `:::zw-pathtext{path:"M0,100 Q150,0 300,100"}` DSL構文
- SVG `<textPath>` でレンダリング済み
- 仕様: `docs/specs/spec-path-text.md`
- 関連コード: `js/modules/editor/TextboxDslParser.js`, `js/modules/editor/TextboxEffectRenderer.js`

## Phase 2: WYSIWYG制御点ハンドルUI

### ユーザー操作列
1. WYSIWYGモードでパステキストブロックをクリック
2. SVGパス上に制御点ハンドル (ドラッグ可能な小円) が表示される
3. 制御点をドラッグすると、パスがリアルタイムに変形
4. ドラッグ終了時にDSLのpath属性が自動更新される
5. パス外をクリックすると制御点が非表示になる

### 成功条件
- ベジェ曲線の始点/終点/制御点がハンドルとして表示される
- ドラッグで制御点を移動するとSVGパスがリアルタイム変形
- 変形後のパスがDSL (`path:"..."`) に反映される
- 円弧・フリーハンドパスにも対応
- reduced-motion時は静的表示

### HUMAN_AUTHORITY 判断が必要な項目
- ハンドルのビジュアルデザイン (色/サイズ/形状)
- パスプリセット (直線/カーブ/円弧) のUI提供形態
- テキスト配置方向 (パスに沿って/垂直) の切り替えUI

→ 実装前にコアセッション経由でユーザーに確認すること

## 技術的制約

- pointer events ベースのドラッグ
- SVG座標系とDOM座標系の変換 (`getScreenCTM()`)
- パス文字列 (`M`, `Q`, `C`, `A` コマンド) のパース/シリアライズ
- editor-wysiwyg.js の contenteditable 内での SVG overlay

## 検証

- `npm run lint:js:check` パス
- `npx playwright test` 全パス
- 新規E2Eテスト追加 (制御点表示/ドラッグ/パス更新)

## 関連ファイル

- `js/modules/editor/TextboxDslParser.js` -- DSLパーサー
- `js/modules/editor/TextboxEffectRenderer.js` -- レンダラー
- `js/editor-wysiwyg.js` -- WYSIWYGエディタ
- `css/style.css` -- スタイル
- `docs/specs/spec-path-text.md` -- 仕様書 (150行超の詳細仕様)
