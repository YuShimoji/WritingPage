# Project Health

最終更新: 2026-03-30

## Summary

Zen Writer は日常利用に耐える主要フローをかなり備えている一方で、UI の互換レイヤや段階導入中の機能が残っており、「未完の機能が既存 UX を上書きする」種類のバグがまだ起こり得る状態です。直近では執筆集中サイドバーがその代表例でした。

## Health Snapshot

| 項目 | 状態 | コメント |
|------|------|----------|
| 実行基盤 | 安定 | Web / Electron / LocalStorage ベースで継続運用可能 |
| コア編集 | 安定 | textarea / WYSIWYG / autosave / preview / search は概ね稼働 |
| UI 状態管理 | 要継続改善 | 互換レイヤと古い分岐が残る |
| ドキュメント整備 | 改善中 | 再開導線は今回かなり改善、historical entry は残存 |
| 仕様と実装の整合 | 部分的にずれあり | `spec-index` 上の historical/missing doc に注意 |
| 自動検証 | 良好 | 重点 UI suite は通過、全件回帰は適宜必要 |

## Recent Wins

- UI モード切替 API をアプリ側に集約
- 執筆集中サイドバーを `focus` モード限定に局所化
- accessibility / UI regression / command palette / sidebar-writing-focus の重点 suite が通過
- 再開用ドキュメントを `docs/CURRENT_STATE.md` 中心に再編

## Main Risks

| リスク | 内容 | 対応方針 |
|--------|------|----------|
| 古い UI 残骸 | hidden `select` や旧メニュー導線が残っている | SSOT API を優先し、不要 DOM を段階削除 |
| 仕様書の空参照 | `spec-index` や README に missing file が残る | historical 扱いを明記し、現用ドキュメントを分離 |
| 部分実装の常時適用 | 未完機能が default UX を壊す | feature boundary を明文化して scope を限定 |
| Electron 導線のズレ | ブラウザ実装との差分が再発しやすい | `ZenWriterApp` API を共通入口に寄せる |

## Recommended Next Checks

- `npx playwright test` で広い回帰確認
- Electron 実機で `menu:toggle-minimal` と UI モード切替の確認
- 旧 UI 残骸の excise 候補を棚卸しして 1 スライスずつ削除
- `docs/spec-index.json` と実在ファイルの整合監査
