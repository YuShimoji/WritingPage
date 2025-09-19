# DESIGN — 設計方針

## 目的
- 集中して書ける Zen ライクな執筆体験
- サーバー不要で即利用可能
- 最小構成での拡張容易性

## アーキテクチャ
- `index.html`: レイアウトと要素の定義
- `css/style.css`: CSS変数（カスタムプロパティ）で配色/タイポグラフィを一元管理
- `js/storage.js`: LocalStorage の読み書きとテキストエクスポート
- `js/theme.js`: テーマ/配色/フォント適用（明度判定・色調整補助含む）
- `js/editor.js`: 入力、保存、カウンタ、通知、ショートカット
- `js/app.js`: UI イベント配線、初期化

## 設計原則
- SRP/SoC: 各ファイルは単一責務
- KISS/YAGNI: フレームワーク不使用、DOM API ベース
- DRY: CSS変数とユーティリティ関数で重複低減

## テーマ適用
- ルート要素に `data-theme` を付与（light/dark/sepia）
- カスタムカラーは `--bg-color`, `--text-color` を上書き
- 背景の明度からサイドバー/ツールバー/境界色を自動調整

## 永続化
- `settings` と `content` を LocalStorage に保存
- JSON 直列化により設定を保持

## 将来拡張の考慮
- 複数ドキュメント管理（LocalStorage にインデックスを保持）
- 印刷用スタイル、PDFエクスポート（ブラウザの印刷機能利用）
- 執筆目標/進捗、セクション/シーン管理
