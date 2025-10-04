# CONTRIBUTING — コントリビューションガイド

ありがとうございます！このプロジェクトへの貢献方法をまとめます。

## 開発フロー（推奨）
1. Issue を作成/アサイン
2. ブランチ作成（例: `feat/theme-presets`, `fix/autosave-timing`）
3. 小さなコミットで進める（日本語の明確なメッセージ歓迎）
4. テスト手順（`docs/TESTING.md`）に従い手動検証
5. Pull Request 作成（テンプレート利用）

### PR ガイド
- テンプレートの「中断可能点」を必ず記載（どこで安全に止められるか）
- 「CI 連携マージ」を遵守（CI 成功後に Squash Merge）
- 参照: `AI_CONTEXT.md`, `DEVELOPMENT_PROTOCOL.md`, `docs/Windsurf_AI_Collab_Rules_v1.1.md`

## コーディング方針
- 単一責任・関心毎の分離（SRP/SoC）
- KISS, DRY, YAGNI の徹底
- 名前重要（意味が直感的な命名）
- CSS変数で配色・タイポグラフィを一元管理

## コミットメッセージの例
- `feat: add high-contrast theme preset`
- `fix: prevent toolbar flicker on toggle`
- `docs: update testing checklist`
- `chore: init repository and add docs`

## ディレクトリ構成
- 主要ファイルは README を参照

## 中央ワークフロー
- 本リポジトリは中央リポジトリの再利用可能ワークフローを参照します。
  - `uses: YuShimoji/shared-workflows/.github/workflows/*.yml@v0.1.0`
- 運用の詳細は `DEVELOPMENT_PROTOCOL.md` を参照

## 問い合わせ
Issue にてお願いします。
