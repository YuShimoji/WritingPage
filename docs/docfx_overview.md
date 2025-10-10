# DocFX 概要とサイト構成

このドキュメントは DocFX によるドキュメントサイト構築の概要をまとめます。

- **ビルドコマンド**: `dotnet docfx build`
- **出力先**: `_site/`
- **トピック構成**はリポジトリ直下の `toc.yml` で制御。
- **テンプレート**は DocFX デフォルト。
- **検索機能**はデフォルト設定で有効化されています（`globalMetadata._enableSearch`）。

## 参照

- `docfx.json`
- `.github/workflows/deploy-pages.yml`
