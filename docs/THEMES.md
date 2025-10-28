# THEMES — テーマ仕様と拡張指針

本プロジェクトの配色/タイポグラフィは CSS カスタムプロパティ（変数）で一元管理しています。プリセット切替とカスタムカラーに対応し、ドキュメント化された拡張ポイントを提供します。

## 変数一覧（`css/style.css`）

- `--bg-color`: 背景色
- `--text-color`: 文字色
- `--sidebar-bg`: サイドバー背景
- `--sidebar-text`: サイドバー文字
- `--toolbar-bg`: ツールバー背景
- `--toolbar-text`: ツールバー文字
- `--border-color`: 罫線色
- `--focus-color`: 強調色/ボタン色
- `--font-family`: ベースフォント
- `--font-size`: ベースフォントサイズ
- `--line-height`: 行間

## プリセット（`data-theme`）

- `light`: デフォルトの明色
- `dark`: 暗色、低照度での利用を想定
- `sepia`: 長文読書に適した暖色系

## カスタムカラー

- サイドバー「背景色」「文字色」のカラーピッカーから `--bg-color` と `--text-color` を上書きします。
- 背景色の明度に応じて `--sidebar-bg`, `--toolbar-bg`, `--border-color` を自動調整（`js/theme.js` の `isLightColor`, `adjustColor`）。

## プリセットの追加手順

1. `css/style.css` に `data-theme="<name>"` セレクタを追加し、上記変数を定義
2. `index.html` のサイドバーにプリセットボタンを追加（`data-theme` 属性に合わせる）
3. `docs/TESTING.md` にプリセットの検証項目を追記
4. `README.md` と本ファイルのプリセット一覧を更新

## 推奨追加プリセット（Issue化済み）

- High Contrast（視認性向上、コントラスト比 WCAG AA/AAA 目標）
- Solarized Light/Dark（目の疲労軽減、定番の配色）

## デザイントーンの指針

- 文章への集中を最優先（背景は中〜低彩度、十分なコントラスト比）
- `--focus-color` はアクセントとして控えめに、リンクやボタンに限定
- フォントは明朝をデフォルト、可読性と可視性のバランスで選択

## 将来拡張

- ユーザー定義プリセットの保存/読み込み（LocalStorage）
- `prefers-color-scheme` への自動追従オプション
- アクセシビリティ検証（コントラスト比の自動チェック）
