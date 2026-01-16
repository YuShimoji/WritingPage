# Task: 柔軟なタブ配置システム実装

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-12T01:00:00+09:00
Report: docs/reports/REPORT_TASK_029_flexible_tab_placement_20260112_0254.md
## Objective

- タブを上下左右に配置可能にする機能を実装する
- サイドバー内でのタブ順序変更機能を実装する
- ユーザーが自由にタブの配置と順序をカスタマイズできるようにする

## Context

- `docs/BACKLOG.md` の「フェーズ E-3: 柔軟なタブ配置システム」に記載されている
- `README.md` の「フレキシブルレイアウト」構想に合致
- 現在のタブシステムは左サイドバーに固定配置のみ
- プロジェクトの「左サイドバーをガジェット単位で組み替え可能に」という構想を実現するための基盤機能

## Focus Area

- `js/sidebar-manager.js`（タブ管理機能の拡張）
- `js/app.js`（タブ配置UIの統合）
- `index.html`（タブ配置設定UI）
- `css/style.css`（タブ配置スタイル、上下左右配置対応）
- `js/gadgets-editor-extras.js`（タブ管理UIの拡張）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のタブ機能の破壊的変更（既存のタブは動作し続けること）
- 既存のガジェットシステムの破壊的変更

## Constraints

- テスト: E2Eテストでタブ配置機能を検証
- フォールバック: タブ配置が無効な場合、既存の左サイドバー固定配置にフォールバック
- 外部通信: 不要（クライアントサイドのみ）
- データ永続化: LocalStorageにタブ配置と順序を保存

## DoD

- [x] タブを上下左右に配置可能にする機能を実装
  - 根拠: `js/sidebar-manager.js` に `applyTabPlacement()`, `saveTabPlacement()` を実装。`css/style.css` に配置スタイルを追加。
- [x] サイドバー内でのタブ順序変更機能を実装（ドラッグ&ドロップまたは設定UI）
  - 根拠: `js/gadgets-editor-extras.js` にタブ順序変更UI（上下ボタン）を実装。`js/sidebar-manager.js` に `saveTabOrder()`, `getTabOrder()` を実装。
- [x] タブ配置と順序の設定をLocalStorageに永続化
  - 根拠: `js/storage.js` に `tabPlacement` と `tabOrder` を追加。`js/sidebar-manager.js` で保存・読み込みを実装。
- [x] タブ配置設定UIを実装（上下左右の選択、順序変更）
  - 根拠: `js/gadgets-editor-extras.js` にタブ配置セレクトとタブ順序変更UIを追加。
- [x] 既存のタブ機能との互換性を維持（既存タブは動作し続ける）
  - 根拠: 既存の `addTab`, `removeTab`, `renameTab` 機能を変更せず、新機能を追加のみ。E2Eテストで互換性を確認。
- [x] E2Eテストを追加
  - 根拠: `e2e/flexible-tab-placement.spec.js` を作成し、タブ配置変更、順序変更、互換性のテストを実装。
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
  - 根拠: `docs/inbox/REPORT_TASK_029_flexible_tab_placement_20260112_0254.md` を作成。
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - 根拠: 本チケットの Report 欄に `docs/inbox/REPORT_TASK_029_flexible_tab_placement_20260112_0254.md` を追記。

## Notes

- 既存の `sidebar-manager.js` の `addTab`, `removeTab`, `renameTab` 機能を拡張
- タブ配置の設定は `settings.sidebar.tabPlacement` のような形式で保存
- 上下左右配置の実装は、CSS Grid または Flexbox を活用
- タブ順序変更は、HTML5 Drag and Drop API または設定UIで実装
- レスポンシブデザインを考慮（小画面では左サイドバー固定にフォールバック）

## 停止条件

- Forbidden Area に触れないと完遂できない
- 仕様の仮定が 3 つ以上必要
- 既存のタブ機能を破壊する変更が必要
