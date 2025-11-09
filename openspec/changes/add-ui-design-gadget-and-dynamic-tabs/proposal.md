## Why
アプリ全体が単色で灰色寄りに見える点を改善し、現代的なUIの陰影・奥行きをコントロール可能にするため。加えて、サイドバーのタブ管理を柔軟化（追加/名称変更/削除/復元）し、UI設定ガジェットから一元操作できるようにする。

## What Changes
- 新ガジェット `UIDesign` を追加し、アプリ背景のグラデーション（線形/放射、角度、2色、強度）を制御
- CSSに `--app-bg-gradient` を導入し、`body` の `background-image` に適用
- `SidebarManager` にタブ管理API（`addTab/removeTab/renameTab`）を追加し、未登録DOMタブの自動登録を許容
- カスタムタブを `settings.ui.customTabs` に永続化し、起動時に復元
- `UI Settings` ガジェットを拡張（タブ追加/名称変更/削除UI、表示方式変更時の適用関数修正）
- `app.js` 初期化でカスタムタブを復元、`tabManager` が `sidebarManager.sidebarTabConfig` を参照

## Impact
- 影響コード: 
  - css/style.css
  - js/gadgets-editor-extras.js（UIDesign/UI Settings）
  - js/sidebar-manager.js（タブAPI）
  - js/app.js（初期化/TabManager）
- ユーザー設定: `settings.ui.bgGradient` および `settings.ui.customTabs`
- 互換性: 既存テーマ変数と共存。非有効時は `--app-bg-gradient: none`

## Notes
- 将来的にミニマルなアイコンセット（Lucide/Tabler/Heroicons等）の導入を検討
- ガジェット基盤の責務分離/モジュール化を次フェーズで実施
