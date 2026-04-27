# 手動確認チェックリスト

> **Status: superseded / historical checklist stub**
>
> このファイルは現在の受け入れ確認には使わない。Session 16 の checklist は現行 UI と章管理導線を反映していないため、正本っぽく見せない。

最終更新: 2026-04-27（旧 checklist の正本主張を降格）

## 現行の確認先

| 確認したいこと | 参照先 |
|----------------|--------|
| package / Electron 固有の体感確認 | [`MANUAL_TEST_GUIDE.md`](MANUAL_TEST_GUIDE.md) |
| 最新の検証結果・未確認 gate | [`CURRENT_STATE.md`](CURRENT_STATE.md) |
| 自動化と手動確認の責務境界 | [`AUTOMATION_BOUNDARY.md`](AUTOMATION_BOUNDARY.md) |
| UI 状態モデル・手動確認の出し方 | [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md) |

## 降格理由

- 旧本文は Session 16 の SP-079 / DSL 挿入 GUI 向け checklist であり、統合シェル UI の top chrome / left nav root-category を前提にしていない。
- `Focus モードへ切り替え`、`Readerプレビューモード`、旧フォーマット変換バナーなど、現行判断を古い導線へ引っ張る項目を含んでいた。
- 現在の package / Electron gate は `MANUAL_TEST_GUIDE.md` と `CURRENT_STATE.md` に集約する。

## 扱い

- 新規の手動確認項目はこのファイルへ追記しない。
- 履歴が必要な場合は git history で Session 16 版を参照する。
