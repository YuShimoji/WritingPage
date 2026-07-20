# RELEASE — リリース手順

## バージョニング

- `VERSION` ファイルにセマンティックバージョンを記載（例: 0.1.0）
- `package.json` の `version` も同じ値に同期
- 変更は `CHANGELOG.md` に追記

## 手順

1. Playwright E2E テストを実行し、全テストがパスすることを確認
2. 変更点の最終確認（README/USAGE/THEMES/TESTING の差分）
3. `CHANGELOG.md` 更新、`VERSION` 更新、`package.json` の `version` 同期
4. Gitコミット（`chore(release): vX.Y.Z`）

## Release readiness evidence

`npm run release:checkpoint` がclean committed sourceに結び付いたmachine checkpointと
exact-hash packageを生成する。人間のElectron観察はbase checkpointへ追記せず、次のderivative
routeで取り込む。

```powershell
npm run release:observe -- --checkpoint "<checkpoint.json>" --package "<Zen Writer.exe>" --observation "<observation.json>" --out "<new sibling review folder>"
```

ordinary repeated PASSは
`PASS。package起動・主要操作に重大問題なし。保存復帰は既存確認を継承。` を既定入力にできる。
ただし、現在報告された起動・aggregate-only主要操作と、過去反復確認を継承した保存復帰は
provenanceを分け、継承にはsupervisorの明示承認が必要。FAIL/HOLD、storage/autosave/document
model/Electron lifecycle変更、新しいpersistence問題、明示された最終配布候補では詳細記録と
必要なfresh replayへ戻す。

`READY_FOR_INTERNAL_RELEASE_REVIEW` は内部レビューへ進める意味だけを持つ。tag、sign、publish、
upload、external distributionの承認にはならない。

## 判定基準

- TESTINGのチェックリストが全てPASS
- 既知の制約に大きな追加がない
- external releaseへ進む場合は、Electron derivative READYとは別にsigning/publication/distribution gateが承認済み

## 補足

- 外部公開する場合はライセンス/セキュリティガイドの整備を行うこと
