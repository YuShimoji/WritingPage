# Task: Wikilinks/バックリンク/グラフ機能実装

Status: OPEN
Tier: 3
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_025.md
## Objective

- Wikilinks/バックリンク/グラフ機能（`[[link]]` 構文や `doc://` の可視化・相互参照グラフ）を実装する
- ドキュメント間の関係を可視化し、ナビゲーションを容易にする

## Context

- `README.md` の「記載漏れの将来拡張アイデア」に「Wikilinks/バックリンク/グラフ: `[[link]]` 構文や `doc://` の可視化・相互参照グラフ」が記載されている
- Wikilinks/バックリンク/グラフ機能は未実装
- 既存のコンテンツリンク機能（`doc://`, `asset://`）を拡張する

## Focus Area

- `js/wiki.js`（Wiki機能の拡張）
- `js/nodegraph.js`（ノードグラフ機能の拡張）
- `js/link-graph.js`（新規作成）
- `index.html`（グラフ表示UI）
- `css/style.css`（グラフスタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のコンテンツリンク機能の破壊的変更

## Constraints

- テスト: E2EテストでWikilinks/バックリンク/グラフ機能を検証
- フォールバック: グラフ表示が無効な場合、通常のリンク表示にフォールバック
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] `[[link]]` 構文のパース機能を実装
- [x] バックリンク検出機能を実装
- [x] 相互参照グラフの可視化機能を実装
- [x] グラフ表示UIを実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 既存のコンテンツリンク機能（`js/wiki.js`, `js/nodegraph.js`）との統合を考慮
- パフォーマンスに注意（大規模ドキュメントでのグラフ生成）
- グラフライブラリの選定が必要（D3.js等）
