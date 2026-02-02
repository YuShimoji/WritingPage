# Project Context - WritingPage (執筆支援ツール/テキストエディタプロジェクト)

## Purpose
- 執筆支援ツール: 小説・長編執筆に特化したテキストエディタ
- 機能: エディタ、テーマ切り替え、ガジェット（HUD、執筆目標、印刷設定など）、埋め込み対応
- 目標: 執筆体験の向上、ミニHUDによる通知表示、設定のカスタマイズ

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- ビルドツール: npm, Playwright (E2Eテスト)
- デプロイ: GitHub Pages, Netlify対応
- 埋め込み: postMessage API, CORS対応

## Project Conventions

### Code Style
- 言語: JavaScript (ES6+), 厳格モード使用
- フォーマッタ: Prettier, ESLint
- 命名規則: camelCase (変数/関数), PascalCase (クラス), kebab-case (CSSクラス)
- コメント: 日本語で簡潔に記載

### Architecture Patterns
- モジュール分割: IIFEパターンでグローバル汚染回避
- イベント駆動: CustomEventでコンポーネント間通信
- 設定管理: localStorage + デフォルトマージ
- プラグイン: ZWGadgetsレジストリで拡張可能

### Testing Strategy
- E2E: Playwrightでブラウザテスト
- スモークテスト: dev-check.js で基本機能確認
- CI: GitHub Actions (Smoke, E2E)
- カバレッジ: HUD設定、テーマ切り替え、スナップショット

### Git Workflow
- ブランチ: main (安定), develop (統合), feat/* (機能), fix/* (修正)
- マージ: Squash Merge
- コミット: 英語で簡潔、変更内容を明記
- PR: テンプレート使用、Mission番号記載

## Domain Context
- ターゲット: 作家、小説家、執筆者
- 主要機能: エディタ、HUD通知、テーマ、ガジェット
- 拡張性: 埋め込み対応、プラグイン追加

## Important Constraints
- ブラウザ互換: モダンブラウザ対応（IE非対応）
- パフォーマンス: 軽量実装、動的ロード
- セキュリティ: 埋め込み時 origin 検証
- UI/UX: シンプル、キーボードショートカット重視

## External Dependencies
- Google Fonts: テーマ切り替え時動的ロード
- GitHub Pages: ドキュメント/デモデプロイ
- Playwright: E2Eテスト実行
- Netlify: 代替デプロイオプション
