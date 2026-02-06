# Task: Wikilinks/バックリンク/グラフ機能実装

Status: DONE
Tier: 3
Branch: feat/wikilinks-backlinks
Owner: Worker
Created: 2026-01-30T11:45:00+09:00
Completed: 2026-01-30T13:58:00+09:00
Report: docs/reports/REPORT_TASK_044_wikilinks_backlinks_20260130.md

## Objective
[[link]] 構文のサポート、記事間の相互参照リンク、およびバックリンク（逆リンク）情報の管理を実装し、ドキュメント間のネットワーク化を促進する。

## Context
- docs/BACKLOG.md の長期課題に「Wikilinks/バックリンク/グラフ」が記載されている。
- 現在の Wiki 機能は独立したページ管理のみであり、ページ間の関連付けが手動テキストのみとなっている。
- データの相互参照を自動化することで、情報の整理効率を向上させる。

## Focus Area
- js/wiki-manager.js (if exists) or js/gadgets-builtin.js (Wikiガジェット)
- js/storage.js (データ構造の拡張)
- css/style.css (リンクの強調表示)

## Forbidden Area
- .shared-workflows/**
- 既存の Wiki データの破壊的変更。

## Constraints
- **Markdown パーサーとの統合**: [[...]] を <a> タグに変換する仕組みを既存の Markdown 処理に組み込む。
- **動的解決**: リンク先が未作成の場合のハンドリング（プレビュー等）。

## DoD
- [x] [[タイトル]] 構文がエディタおよびプレビューでリンクとしてレンダリングされる。
- [x] リンクをクリックすると該当する Wiki ページに遷移、またはポップアップ表示される。
- [x] Wiki ページの下部に、そのページを参照している他ページの一覧（バックリンク）が表示される。
- [x] グラフ表示の基礎（リンクマップ）のデータ構造が作成されている。
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている。

## 停止条件
- 既存のストレージ構造と互換性が取れない場合。
- Markdown パーサーの変更が他の構文に影響を与える場合。
