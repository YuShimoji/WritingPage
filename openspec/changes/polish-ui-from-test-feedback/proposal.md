## Why

テストフィードバックに基づき、UI/UXの洗練を進める。左サイドバーの展開時のメインエリア隠れ、カラーパレットの色反映、エディタのスクロール振動、折り返し設定、文字数表示、ファイル一覧、破棄確認などの改善を体系的に実装。

## What Changes

- パネルレイアウトの調整（左サイドバー展開時のメインエリア保護）
- カラーパレットの現在の色反映機能
- エディタスクロール挙動の改善（ガクガク振動修正）
- 折り返し文字数指定機能
- 文字数表示スタンプ機能（区切り・段落集計）
- 編集ファイル/章の表示・一覧機能（UX向上）
- 破棄確認・復元機能の強化（変更追跡）

## Impact

- Affected specs: workspace-ui, editor-markdown, panels-layout
- Affected code: js/editor.js, js/app.js, css/style.css
- Testing: E2E（Playwright）、dev-check拡張
