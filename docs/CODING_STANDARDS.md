# コーディング規約（Coding Standards）

本ドキュメントは、WritingPageプロジェクトにおけるコード品質と一貫性を確保するためのコーディング規約を定義します。

## 目次

1. [概要](#概要)
2. [ツール設定](#ツール設定)
3. [命名規則](#命名規則)
4. [コードスタイル](#コードスタイル)
5. [ベストプラクティス](#ベストプラクティス)
6. [使用方法](#使用方法)

## 概要

本プロジェクトでは、コード品質の向上と一貫性の確保のため、以下のツールを使用しています：

- **ESLint**: JavaScriptの静的解析ツール
- **Prettier**: コードフォーマッター

これらのツールにより、コードの品質チェックと自動フォーマットが可能になります。

## ツール設定

### ESLint

ESLintの設定は `.eslintrc.js` に記載されています。

**主要な設定:**
- 環境: Browser, ES2020, Node.js
- 推奨ルール: `eslint:recommended` を継承
- カスタムルール:
  - セミコロン必須 (`semi: 'always'`)
  - シングルクォート使用 (`quotes: 'single'`)
  - 未使用変数の検出（`_`で始まる引数は除外）

**除外パターン:**
- `node_modules/`
- `test-results/`
- `playwright-report/`
- `dist/`

### Prettier

Prettierの設定は `.prettierrc` に記載されています。

**主要な設定:**
- セミコロン: あり
- クォート: シングルクォート
- タブ幅: 2スペース
- 行の長さ: 80文字
- 末尾カンマ: すべて（`all`）
- 改行コード: LF

**除外ファイル:**
`.prettierignore` に記載されたファイルはフォーマット対象外です。

## 命名規則

### ファイル名

- **形式**: `kebab-case`（ハイフン区切り）
- **例**: `theme-manager.js`, `editor-preview.js`, `gadgets-core.js`

### 変数・関数名

- **形式**: `camelCase`（キャメルケース）
- **例**: `editorInstance`, `applyUILabels()`, `toggleSidebar()`

### 定数

- **形式**: `UPPER_SNAKE_CASE`（大文字のスネークケース）
- **例**: `MAX_ITEMS`, `DEFAULT_THEME`, `API_BASE_URL`

### クラス名

- **形式**: `PascalCase`（パスカルケース）
- **例**: `EditorManager`, `ThemeRegistry`, `GadgetCore`

### CSSクラス名

- **形式**: `kebab-case`（ハイフン区切り）
- **例**: `editor-container`, `sidebar-group`, `toolbar-actions`

## コードスタイル

### JavaScript

#### 基本原則

- **厳格モード**: ES6+の機能を積極的に使用
- **モジュール分割**: IIFEパターンでグローバル汚染を回避
- **イベント駆動**: CustomEventでコンポーネント間通信
- **設定管理**: localStorage + デフォルトマージ

#### コメント

- **言語**: 日本語で簡潔に記載
- **目的**: 「動作（What）」ではなく「意図（Why）」や「注意点」を記述
- **JSDoc**: 関数の説明にはJSDoc形式を推奨

```javascript
/**
 * UIラベルを適用する
 * @param {Object} labels - ラベルオブジェクト
 */
function applyUILabels(labels) {
  // 実装
}
```

#### エラー処理

- `try-catch`で適切にエラーを捕捉
- 開発者向けログ（詳細な原因）とユーザー向けフィードバック（UI表示用）を明確に区別
- エラーの握りつぶし（Silent Failure）は厳禁

```javascript
try {
  const data = JSON.parse(raw);
  // 処理
} catch (error) {
  console.error('[Zen Writer] 設定の読み込みに失敗しました:', error);
  // ユーザー向けのフォールバック処理
}
```

### CSS

- **CSS変数**: 配色・タイポグラフィを一元管理
- **命名**: BEM風の命名規則を推奨（例: `.editor-container__preview`）

### HTML

- **セマンティックHTML**: 適切なHTML要素を使用
- **アクセシビリティ**: ARIA属性を適切に使用
- **i18n**: `data-i18n`属性で多言語対応

## ベストプラクティス

### 設計原則

以下の原則を遵守してください：

- **SRP (Single Responsibility Principle)**: 単一責任の原則
- **SoC (Separation of Concerns)**: 関心の分離
- **KISS (Keep It Simple, Stupid)**: シンプルに保つ
- **DRY (Don't Repeat Yourself)**: 重複を避ける
- **YAGNI (You Aren't Gonna Need It)**: 不要な機能を追加しない

### コード品質

- **可読性**: 意味が直感的な命名を心がける
- **保守性**: 1ファイルが300行を超える場合は分割を検討
- **パフォーマンス**: 無駄な再レンダリングやN+1問題を避ける
- **セキュリティ**: 外部入力は厳格にバリデーション

### テスト

- **E2Eテスト**: Playwrightでブラウザテストを実施
- **スモークテスト**: `dev-check.js`で基本機能を確認
- **CI**: GitHub Actionsで自動テストを実行

## 使用方法

### インストール

依存関係のインストール:

```bash
npm install
```

### リント（コード品質チェック）

すべてのファイルをチェック:

```bash
npm run lint
```

JavaScriptのみをチェック:

```bash
npm run lint:js:check
```

Markdownのみをチェック:

```bash
npm run lint:md
```

### リントの自動修正

ESLintで自動修正可能な問題を修正:

```bash
npm run lint:fix
```

または:

```bash
npm run lint:js:fix
```

### フォーマット

すべてのファイルをフォーマット:

```bash
npm run format
```

フォーマットのチェック（修正は行わない）:

```bash
npm run format:check
```

### エディタ統合

#### Visual Studio Code

以下の拡張機能をインストールしてください：

- ESLint
- Prettier - Code formatter

設定例（`.vscode/settings.json`）:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### その他のエディタ

各エディタのPrettier/ESLintプラグインをインストールし、保存時の自動フォーマットを有効にしてください。

### CI/CD統合

GitHub ActionsなどのCIパイプラインで、以下のコマンドを実行してコード品質をチェックできます：

```yaml
- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check
```

## 段階的導入

既存のコードに対して、一度にすべてのファイルをリント/フォーマットするのではなく、段階的に導入することを推奨します：

1. 新規ファイルは必ずリント/フォーマットを適用
2. 既存ファイルを修正する際に、そのファイルのみリント/フォーマットを適用
3. 時間をかけて既存ファイルを段階的に更新

## トラブルシューティング

### ESLintエラーが発生する場合

1. エラーメッセージを確認
2. 自動修正可能な場合は `npm run lint:fix` を実行
3. 手動で修正が必要な場合は、エラーメッセージに従って修正

### PrettierとESLintの競合

PrettierとESLintの競合を避けるため、以下の設定を推奨します：

- ESLintのフォーマット関連ルールは無効化（Prettierに委譲）
- `eslint-config-prettier`を使用する場合は、`extends`に追加

### 特定のファイルを除外する場合

- **ESLint**: `.eslintrc.js`の`ignorePatterns`に追加
- **Prettier**: `.prettierignore`に追加

## 参考資料

- [ESLint公式ドキュメント](https://eslint.org/)
- [Prettier公式ドキュメント](https://prettier.io/)
- [プロジェクト規約（CONVENTIONS.md）](./CONVENTIONS.md)
- [コントリビューションガイド（CONTRIBUTING.md）](../CONTRIBUTING.md)

## 更新履歴

- 2026-01-18: 初版作成（ESLint/Prettier導入）
