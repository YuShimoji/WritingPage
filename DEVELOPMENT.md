# 開発ガイド

## キャッシュの問題を解決する

開発中に「更新が反映されない」問題が発生した場合：

### 方法1: URLパラメータでキャッシュをクリア

- **localStorageをクリア**: `http://localhost:8080?reset=1`
- **Service Workerとキャッシュをクリア**: `http://localhost:8080?clearCache=1`

### 方法2: デバッグUIを使用

1. ブラウザで `http://localhost:8080/debug-ui.html` を開く
2. 「アプリを開く（キャッシュクリア）」ボタンをクリック

### 方法3: ブラウザの開発者ツール

1. F12で開発者ツールを開く
2. Applicationタブ > Storage > Clear site data

## Service Workerの動作

- **開発モード** (localhost): ネットワーク優先戦略
  - 常に最新のファイルを取得
  - キャッシュはフォールバックのみ

- **本番モード** (https): キャッシュ優先戦略
  - オフライン対応
  - 高速な読み込み

## 表示不具合のデバッグ

### スクリーンショットの撮影

```bash
npx playwright test e2e/test-ui-debug.spec.js --headed
```

スクリーンショットは以下に保存されます：
- `debug-screenshot-full.png` - ページ全体
- `debug-screenshot-toolbar.png` - ツールバーのみ

### ブラウザコンソールでのデバッグ

debug-ui.htmlからコードスニペットをコピーして、開発者ツールのコンソールで実行できます。

## 開発サーバー

```bash
npm run dev
```

サーバーは `http://localhost:8080` で起動します。
