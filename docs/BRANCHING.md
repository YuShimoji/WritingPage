# BRANCHING — ブランチ運用指針

本プロジェクトの標準的なブランチ戦略を定義します。どこからでも参照できるよう、`README.md` からもリンクされます。

## 方針

- メインラインは `main`（常にデプロイ可能な状態）
- 機能/修正は小さな単位でブランチを切り、Pull Request で `main` に統合
- コミットメッセージは Conventional Commits（例: `feat: ...`, `fix: ...`, `docs: ...`）
- Issue 駆動: すべての作業は必ず Issue に紐づけ、PR/コミットに `#<番号>` を付記

## ブランチ命名規則

- 機能追加: `feat/<簡潔なスラッグ>`
  - 例: `feat/embed-sdk`, `feat/snapshots-diff`
- バグ修正: `fix/<スラッグ>`
  - 例: `fix/toolbar-flicker`, `fix/hud-init`
- リファクタ: `refactor/<スラッグ>`
- ドキュメント: `docs/<スラッグ>`
- チョア/設定: `chore/<スラッグ>`

## Pull Request

- タイトル: `[feat|fix|docs|refactor|chore]: 要約 (#Issue番号)`
- 説明テンプレート（要約/背景/変更点/テスト/リスク/関連Issue）
- `main` へマージする前に以下を確認
  - 変更が小さな単位に分割されている
  - `docs/TESTING.md` に沿った手動テストを実施
  - ドキュメント更新（`USAGE.md`, `CHANGELOG.md` など）

## リリース

- バージョン: `VERSION` に SemVer で記載（例: `0.3.11`）
- `package.json` の `version` も同じ値に同期
- 変更履歴: `CHANGELOG.md` 更新
- タグ付け: `git tag v<version>` → `git push --tags`

## ボード運用

- GitHub Projects（カンバン）で以下の列を使用: `Todo` / `In Progress` / `Review` / `Done`
- Issue 作成時にラベル付与（例: `type:enhancement`, `area:editor`）

## いつブランチを切るか

- 既存機能に影響が出る可能性がある変更（例: エディタ装飾、スナップショット拡張、埋め込みSDK）
- 大きめの UI 変更（設定ハブ/デザイン分離、選択ツールチップ）
- 2ファイル以上/300行を超える変更見込み

## 参考

- Conventional Commits: [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)
