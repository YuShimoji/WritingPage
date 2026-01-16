# Task: ガジェット動的割り当て機能実装

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-12T01:00:00+09:00
Report: docs/reports/REPORT_TASK_030_dynamic_gadget_assignment_20260112_0255.md
## Objective

- ドラッグ&ドロップでガジェットをタブに追加する機能を実装する
- ガジェット移動時の設定自動保存機能を実装する
- ユーザーが自由にガジェットをタブ間で移動・配置できるようにする

## Context

- `docs/BACKLOG.md` の「フェーズ E-4: ガジェット動的割り当て」に記載されている
- `README.md` の「左サイドバーをガジェット単位で組み替え可能に」という構想に合致
- 現在のガジェットシステムは、ロードアウト（プリセット）経由でのみタブに割り当て可能
- プロジェクトの「ガジェットベースアーキテクチャ」の完成形として重要

## Focus Area

- `js/gadgets-core.js`（ガジェット登録・管理機能の拡張）
- `js/sidebar-manager.js`（タブとガジェットの連携）
- `js/gadgets-loadouts.js`（ロードアウトシステムとの統合）
- `index.html`（ガジェットドラッグ&ドロップUI）
- `css/style.css`（ドラッグ&ドロップスタイル、ドロップゾーン表示）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のガジェット登録システム（`ZWGadgets.register`）の破壊的変更
- 既存のロードアウトシステムの破壊的変更（既存ロードアウトは動作し続けること）

## Constraints

- テスト: E2Eテストでガジェット動的割り当て機能を検証
- フォールバック: ドラッグ&ドロップが無効な場合、既存のロードアウト経由の割り当てにフォールバック
- 外部通信: 不要（クライアントサイドのみ）
- データ永続化: LocalStorageにガジェット配置を保存（ロードアウトに反映）

## DoD

- [x] ドラッグ&ドロップでガジェットをタブに追加する機能を実装
  - 根拠: `js/gadgets-core.js` に `_setupGadgetDragHandlers` と `_setupPanelDropHandlers` を実装
- [x] ガジェットをタブ間で移動する機能を実装
  - 根拠: `_setupPanelDropHandlers` の `drop` イベントで `assignGroups` を呼び出し、ガジェットを新しいグループに割り当て
- [x] ガジェット移動時の設定自動保存機能を実装（ロードアウトに反映）
  - 根拠: `_updateLoadoutFromCurrentState` メソッドで `captureCurrentLoadout` を使用してロードアウトを自動更新
- [x] ドラッグ&ドロップUIを実装（ドラッグ可能なガジェット、ドロップゾーン表示）
  - 根拠: ガジェットラッパーに `draggable="true"` を設定し、CSSで `cursor: grab` / `cursor: grabbing` を追加。既存の `.is-dragging` と `.drag-over-tab` スタイルを活用
- [x] 既存のロードアウトシステムとの互換性を維持（既存ロードアウトは動作し続ける）
  - 根拠: 既存のロードアウトシステムを破壊せず、`captureCurrentLoadout` と `saveLoadouts` を使用して更新
- [x] ガジェットの配置情報をLocalStorageに永続化
  - 根拠: `_updateLoadoutFromCurrentState` で `saveLoadouts` を呼び出し、LocalStorageに保存
- [x] E2Eテストを追加
  - 根拠: `e2e/gadgets.spec.js` に3つのテストケースを追加（タブ間移動、視覚的フィードバック、ドロップゾーンフィードバック）
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_030_dynamic_gadget_assignment_20260112_0255.md` を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: Report欄に `docs/inbox/REPORT_TASK_030_dynamic_gadget_assignment_20260112_0255.md` を追記

## Notes

- HTML5 Drag and Drop API を活用して実装
- ガジェットの配置情報は、既存のロードアウトシステムに統合（`settings.loadouts`）
- ドラッグ可能なガジェットには `draggable="true"` 属性を追加
- ドロップゾーンは、タブパネル内に表示（視覚的フィードバック）
- ガジェット移動時は、`ZWGadgets` の `move` メソッドを活用
- パフォーマンスに注意（多数のガジェットがある場合の動作確認）

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存のガジェットシステムを破壊する変更が必要
