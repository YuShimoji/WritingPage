# Project Health

最終更新: 2026-04-01 (session 39)

## Summary

Zen Writer は日常利用に耐える主要フローを備えており、E2E テストスイート (542 passed / 0 failed) が回帰バリアとして機能している。session 39 で slim モード導入に伴う 42 件のテスト失敗を修正し、テスト基盤の信頼性が向上した。

## Health Snapshot

| 項目 | 状態 | コメント |
| ---- | ---- | -------- |
| 実行基盤 | 安定 | Web / Electron / IndexedDB ベースで継続運用可能 |
| コア編集 | 安定 | textarea / WYSIWYG / autosave / preview / search は稼働 |
| UI 状態管理 | 安定 | `setUIMode` 一本化完了、slim モード導入済み |
| E2E テスト | 良好 | 542 passed / 0 failed / 3 skipped。ensureNormalMode 統一 |
| ドキュメント整備 | 良好 | canonical docs 体制確立。FEATURE_REGISTRY / AUTOMATION_BOUNDARY が未作成 |
| 仕様と実装の整合 | 概ね良好 | spec-index: 44 done / 11 removed / 1 superseded |

## Recent Wins

- session 39: E2Eテスト42件の失敗を一括修正 (slim モード + viewport 外問題)
- session 39: `ensureNormalMode` / `openSidebar` ヘルパーで E2E テストパターンを標準化
- session 38: エディタ下部ナビ完全撤去 + Focus 描画最適化 + IntersectionObserver
- session 37: Focus / Reader / visual-audit hardening
- session 36: lint 根絶 (0 errors / 0 warnings) + hidden ui-mode-select 削除
- session 34: Reader モードスイッチ統合

## Main Risks

| リスク | 内容 | 対応方針 |
| ------ | ---- | -------- |
| 装飾グループ / Canvas Mode | session 40 で装飾グループ削除、session 43 で Canvas Mode 完全削除済み | 解消 |
| canonical docs 未完 | FEATURE_REGISTRY / AUTOMATION_BOUNDARY が未作成 | 次回以降の docs スライスで作成 |
| 手動確認 deferred | Reader ボタンスタイル / Focus 左パネル間隔 | ユーザーの実使用サイズで確認 |
| Electron 導線のズレ | ブラウザ実装との差分が再発しやすい | `ZenWriterApp` API を共通入口に維持 |

## Recommended Next Checks

- WP-001 次スライスの方向選定 (ツールバー整理 / 装飾グループ削除)
- Reader ボタン / Focus 左パネル間隔の手動確認
- `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` 作成
