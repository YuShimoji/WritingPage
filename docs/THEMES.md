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
- `--focus-color`: 強調色/ボタン色（アクセント色のベース）
- `--accent-color`: ボタン/リンク/フォームコントロール用アクセント色（通常は `--focus-color` と同一）
- `--font-family`: ベースフォント
- `--font-size`: ベースフォントサイズ
- `--line-height`: 行間

## プリセット（`data-theme`）

- `light`: デフォルトの明色
- `dark`: 暗色、低照度での利用を想定
- `night`: ダークより一段階明るいモノクロ暗色テーマ
- `sepia`: 長文読書に適した暖色系
- `high-contrast`: 視認性向上を重視した高コントラストテーマ
- `solarized`: Solarized 系の配色をベースにしたテーマ

## カスタムカラー

- サイドバー「背景色」「文字色」のカラーピッカーから `--bg-color` と `--text-color` を上書きします。
- 背景色の明度に応じて `--sidebar-bg`, `--toolbar-bg`, `--border-color` を自動調整（`js/theme.js` の `isLightColor`, `adjustColor`）。

## プリセットの追加手順

1. `css/style.css` に `data-theme="<name>"` セレクタを追加し、上記変数を定義
2. `index.html` のサイドバーにプリセットボタンを追加（`data-theme` 属性に合わせる）
3. `docs/TESTING.md` にプリセットの検証項目を追記
4. `README.md` と本ファイルのプリセット一覧を更新

## 推奨追加プリセット（検討用メモ）

- 追加のハイコントラスト系バリエーション（例: 文字サイズ拡大型、色覚多様性に配慮したプリセット）
- モノクロ寄りや配色パターンを変えた派生テーマ（必要になった時点で BACKLOG.md に具体案を追加）

## デザイントーンの指針

- 文章への集中を最優先（背景は中〜低彩度、十分なコントラスト比）
- `--focus-color` はアクセントとして控えめに、リンクやボタンに限定
- フォントは明朝をデフォルト、可読性と可視性のバランスで選択

## 将来拡張

- ユーザー定義プリセットの保存/読み込み（LocalStorage）
- `prefers-color-scheme` への自動追従オプション
- アクセシビリティ検証（コントラスト比の自動チェック）

## 設計メモ: テーマ集中管理と UI/エディタ配色分離

### 目的

- テーマ定義（プリセットID・ラベル・色パレット）を **単一のレジストリ** で集中管理し、ThemeManager / Themes ガジェット / CSS / ドキュメントの不整合を防ぐ。
- UI（サイドバー/ツールバー/ボタン等）とエディタ本文エリアの配色レイヤを分離し、将来的に「UI はダーク＋本文はライト」など柔軟な組み合わせを可能にする。

### 想定アーキテクチャ（ドラフト）

- 中央レジストリ（仮称 `ThemeRegistry`）
  - 配置候補: `js/theme.js` 内、もしくは `js/theme-registry.js` のような専用モジュール。
  - 各プリセットは次のような構造を持つ想定:
    - `id`: `"light" | "dark" | "night" | "sepia" | "high-contrast" | "solarized" | ...`
    - `labelKey`: `ui-labels.js` のラベルキー（例: `THEME_NAME_NIGHT`）
    - `uiColors`: サイドバー/ツールバー/ボタン等 UI 向けの色セット
    - `editorColors`: 本文エリア向けの色セット
  - 公開インターフェース例:
    - `getPreset(id)` / `listPresets()` / `resolvePresetFromSettings(settings)` など。

- UI レイヤとエディタレイヤ
  - 既存の CSS では `--bg-color` / `--text-color` などを UI+エディタ兼用で使っているが、段階的に分離する。
  - 分離案（例）:
    - UI 用: `--ui-bg`, `--ui-text`, `--ui-accent` など
    - エディタ用: `--editor-bg`, `--editor-text`, `--editor-accent` など
  - 初期段階では、既存変数との **後方互換 alias** を維持しつつ内部的にレイヤを分離する（例: `--bg-color` を `--editor-bg` に alias）。

### 実装フェーズ案（BACKLOG との対応）

- C-1: 設計メモ作成（本セクション）✅ 完了
  - BACKLOG.md の以下タスクに対応:
    - テーマプリセット拡張のための集中管理機構
    - UI配色と執筆エリア配色の分離

- C-2: レジストリ導入（非破壊）✅ 完了（2025-12-08）
  - `js/theme-registry.js` を新規作成し、`ThemeRegistry` オブジェクトを公開。
  - `js/theme.js`: `ThemeManager.themeColors` を `ThemeRegistry.toThemeColorsMap()` から取得するよう変更（フォールバック付き）。
  - `js/gadgets-themes.js`: `themePresets` を `ThemeRegistry.listPresets()` から取得、`refreshState` 内の色取得も `ThemeRegistry.getColors()` 経由に変更（フォールバック付き）。
  - `index.html`: `theme-registry.js` を `theme.js` より前に読み込むよう追加。
  - `npm run test:smoke` で **ALL TESTS PASSED** を確認。

- C-3: UI/エディタ配色のレイヤ分離
  - CSS に UI 用/エディタ用の変数を追加し、`data-theme` ごとの定義をレジストリと 1:1 で対応させる。
  - Themes ガジェットのカラーピッカーが「UI 全体」ではなく「本文エリア」を主に操作するように整理し、UI 側のトーンはプリセットで制御する方向に寄せる。

- C-4: マイグレーションとテスト
  - 既存設定（テーマIDやカスタムカラー）が新レジストリ/変数に正しくマッピングされるようにマイグレーションロジックを追加。
  - `docs/TESTING.md` にテーマ・配色レイヤ分離用のテストシナリオを追記し、`npm run test:smoke` で基本的な整合性（CSS変数の存在・主要テーマの適用可否）を継続的に検証できるようにする。

### 今後の検討ポイント

- Visual Profile ガジェットとの役割分担
  - テーマ（UI/エディタのベース配色）と Visual Profile（本文のタイポグラフィ/装飾）の境界をどこまで明確に分けるか。
- 将来的な「テーマ編集 UI」
  - ユーザー定義プリセットの保存/読み込みを行う際、どこまでをテーマ側（ThemeRegistry）で扱い、どこからを Visual Profile や別ガジェットに委ねるか。

