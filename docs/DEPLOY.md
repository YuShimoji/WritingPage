# DEPLOY — 配布/公開手順

このプロジェクトはクライアントサイドのみで動作します。`index.html` をブラウザで開けば利用可能です。任意でWeb公開する場合は以下の方法が簡単です。

## ローカルでの利用（推奨）

- `index.html` をダブルクリックで開く（Windows/Mac共通）
- オフラインでも動作します

## GitHub Pages で公開

1. GitHubに新規リポジトリを作成し、本フォルダの内容を push
2. リポジトリ設定 → Pages → Branch を `main`/`master` の `root` に設定
3. 数分後、`https://<your-account>.github.io/<repo-name>/` でアクセス可能

## Netlify で公開

1. Netlify にサインイン
2. 「Add new site」→「Deploy manually（ドラッグ&ドロップ）」
3. 本フォルダ全体をドロップ（ビルド不要）

## Vercel で公開

1. Vercel にサインイン
2. New Project → Git リポジトリをインポート
3. フレームワークは「Other」、Build Command/Outputは空でOK（静的配信）

## 注意

- LocalStorage はドメインごとに分離されます。公開URLが変わると保存内容は共有されません。
- ダウンロード（エクスポート）をブラウザがブロックする場合は、ポップアップ/自動ダウンロード設定を許可してください。
