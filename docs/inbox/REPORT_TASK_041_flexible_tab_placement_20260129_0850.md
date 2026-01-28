# Report: Flexible Tab Placement (Phase E-3)

**Timestamp**: 2026-01-29T08:50:00+09:00
**Actor**: Worker (Antigravity)
**Ticket**: TASK_041
**Type**: Worker
**Reference**: TASK_029 (Integrated)

## 概要
サイドバーの配置を「左（左端）」「右（右端）」「上（上部）」「下（下部）」の4方向に切り替えられる機能を実装しました。
既存の `SidebarManager` のロジックを活かし、CSSによるレイアウトオーバーライドを追加することで実現しました。

## 現状
- **UI**: 「Assist」タブ > 「UI Settings」ガジェット > 「タブ配置」プルダウンから変更可能。
- **配置**:
  - **Left**: デフォルト。従来通り。
  - **Right**: 右端に固定。エディタは左側に配置される。
  - **Top**: 上部に固定（高さ300px）。エディタはその下に配置。
  - **Bottom**: 下部に固定（高さ300px）。エディタはその上に配置。
- **永続化**: `localStorage` に `ui.tabPlacement` として保存され、次回起動時も維持されます。

## 次のアクション
- **TASK_042**: Dynamic Gadget Drag&Drop (Phase E-4) - ガジェットのDnD割り当ての実装へ移行可能。
- **Verification**: Browser tool環境が復旧次第、E2Eテストでの動作確認を推奨。

## Changes
- `js/sidebar-manager.js`: `document.documentElement` に `data-tab-placement` 属性を付与するように修正（CSSセレクタの簡略化のため）。
- `css/style.css`:
  - `:root` に `--sidebar-height: 300px` を追加。
  - `.sidebar` に `transition` プロパティの対象を `all` に変更。
  - `html[data-tab-placement="..."]` に基づく `.sidebar` および `.editor-container` のレイアウトオーバーライドを追加。

## Decisions
- **CSS駆動**: JS側で複雑なスタイル操作を行わず、属性変更のみを行い、CSSでレイアウトを制御する設計を採用。
- **Top/Bottomの高さ固定**: 現状は `300px` 固定とし、リサイズ機能は将来の拡張（Panels機能などとの統合）に委ねる。

## Verification
- **Browser Tool**: Failed (System Error: `$HOME` not set).
- **Code Audit**: `style.css` のロジック適合性と `sidebar-manager.js` の属性付与ロジックを確認済み。

## Risk
- モバイル表示時のオーバーレイ挙動との兼ね合い（Top/Bottom配置時もモバイルではLeft/Overlayになるようにレスポンシブ対応済み）。

## Remaining
- なし
