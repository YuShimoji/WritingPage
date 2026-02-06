# Task: 柔軟なタブ配置システム (Flexible Tab Placement)

Status: OPEN
Tier: 3
Branch: feat/flexible-tabs
Owner: Worker
Created: 2026-01-30T14:05:00+09:00

## Objective
サイドバー内のタブを上下左右（またはセクション内）で柔軟に配置変更可能にし、ユーザーのワークフローに合わせたレイアウトを実現する。
`docs/BACKLOG.md` の **Phase E-3** に相当する。

## Context
- 現在のサイドバーは `Structure`, `Features` (Themes/Typography/Checks), `Assist` (Wiki) の固定グループ構成となっている。
- ユーザーからは「Wikiを常に見たい」「Structureと比較したい」といった要望があり、固定レイアウトでは対応できない。
- フローティングパネル (Phase E-2) は実装済みだが、ドッキング状態での柔軟性が不足している。

## Focus Area
- `js/sidebar-manager.js` (ドラッグ&ドロップ処理、配置ロジック)
- `js/storage.js` (レイアウト設定の永続化構造拡張)
- `css/style.css` (ドロップゾーンの視覚化)

## Forbidden Area
- `.shared-workflows/**`
- 既存のガジェット内部ロジック（ガジェットはコンテナに依存しないこと）

## Constraints
- **Grid/Flexbox**: CSS Grid または Flexbox を活用し、複雑な計算を避ける。
- **後方互換**: 保存されたレイアウトが無い場合はデフォルト構成（現在の固定順序）で起動する。

## DoD
- [ ] サイドバー内のタブ（アイコン）をドラッグして順序を入れ替えられる。
- [ ] タブを別のグループ（例: 上部->下部）に移動できる（もしUIデザイン上許容されるなら）。
- [ ] 変更した配置が `localStorage` に保存され、リロード後も維持される。
- [ ] `docs/inbox/` にレポートが作成されている。

## 停止条件
- DOM構造の抜本的変更が必要で、既存機能（フローティングパネル等）と競合する場合。
