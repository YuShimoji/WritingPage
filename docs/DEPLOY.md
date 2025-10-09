# DEPLOY — 配布/公開手順

このプロジェクトはクライアントサイドのみで動作します。`index.html` をブラウザで開けば利用可能です。任意でWeb公開する場合は以下の方法が簡単です。

## ローカルでの利用（推奨）

- `index.html` をダブルクリックで開く（Windows/Mac共通）
- オフラインでも動作します

## GitHub Pages で公開（DocFX サイト）

DocFX によるドキュメントサイトは GitHub Actions で自動ビルドされ、`docs/` 以下のMarkdownと `README.md` などを対象に `_site/` を生成して公開します。

### ローカルビルド手順

1. 依存: [.NET 8 SDK](https://dotnet.microsoft.com/) と `docfx` ローカルツール（`dotnet tool restore`）。
2. ルートで以下を実行。

   ```bash
   dotnet tool restore
   dotnet docfx build
   ```

3. 出力: `_site/` 以下に静的ファイルが生成されます。`npx serve _site` 等で確認可能。

### GitHub Pages 自動デプロイ

1. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が起動。
2. ワークフローは `dotnet docfx build` を実行して `_site/` を生成し、`actions/deploy-pages@v4` で `github-pages` 環境へデプロイ。
3. 公開URLはリポジトリの Pages 設定で確認できます（例: `https://<org>.github.io/WritingPage/`）。

### 既存の `index.html` を公開したい場合

DocFX サイトとは別に、エディタ本体を公開したい場合は従来どおり GitHub Pages の `root` へ静的ファイルを配置するか、別ブランチ/別リポジトリでホストしてください。

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
