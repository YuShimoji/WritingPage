# RELEASE — リリース手順

## バージョニング
- `VERSION` ファイルにセマンティックバージョンを記載（例: 0.1.0）
- 変更は `CHANGELOG.md` に追記

## 手順
1. `docs/test-reports/` にスモークテストレポートを作成し、主要チェック項目を実施
2. 変更点の最終確認（README/USAGE/THEMES/TESTING の差分）
3. `CHANGELOG.md` 更新、`VERSION` 更新
4. Gitコミット（`chore(release): vX.Y.Z`）

## 判定基準
- TESTINGのチェックリストが全てPASS
- 既知の制約に大きな追加がない

## 補足
- 外部公開する場合はライセンス/セキュリティガイドの整備を行うこと
