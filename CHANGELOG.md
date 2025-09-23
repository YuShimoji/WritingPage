# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-09-23

### Added

- ツールバー（文字数バー）の開閉と表示状態の保存（Alt+W ショートカット）
- ミニHUD（左下に文字数/語数をフェード表示、拡張可能）
- テーマセクションの折りたたみ（details）で左サイドバーのUIを極小化
- アウトライン項目の上下並び替え（保存/反映）

### Changed

- CSS: toolbar-hidden時のエディタ全高、detailsスタイル、ミニHUDスタイル、小ボタン汎用スタイル
- Docs: USAGE/TESTING 更新

## [0.2.1] - 2025-09-23

### Fixed

- storage.js の構文エラー（saveContent の閉じカッコ欠落）を修正
- これにより `window.ZenWriterStorage` が未定義になる連鎖エラー（theme.js / editor.js / outline.js）を解消
- アプリ初期化時の依存エラーで UI が反応しない問題を解消

## [0.2.0] - 2025-09-22

### Added

- テーマ適用の改善（カスタム色の上書き制御、リセットボタン追加）
- ツールバー復帰用フローティングボタン（⌨️ FAB）
- ファイル読み込み（.txt/.md）機能
- フローティングフォントパネル（⚙️）と数値/スライダーでの全体フォント調整
- フォントサイズショートカット（Ctrl/Cmd + + / - / 0）
- アウトライン（部/章/節 等）プリセットの作成・切替・色変更・挿入
- GitHub Pages 用ワークフロー（.github/workflows/deploy-pages.yml）

### Docs

- USAGE/TESTING/README を新機能に合わせて更新
- ISSUES に階層テンプレート、賞データの演出、自動配色抽出、高度なテーマプリセットを追加

## [0.1.0] - 2025-09-18

### Added (initial release)

- 初版: Zenライク執筆ページを作成（HTML/CSS/JS）
- 自動保存、文字数/語数、プリセットテーマ、カラーピッカー、フォント調整
- エクスポート（TXT/MD）、サイドバー、ツールバー、フルスクリーン
- ドキュメント（README, DESIGN, TESTING, ROADMAP, Choices-Driven Development）
- Issueテンプレート雛形
