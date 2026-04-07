# Operator Workflow

人間オペレーターの実ワークフロー・痛点・品質目標を保持する正本。

## 全体フロー

1. 起動: `node scripts/dev-server.js` (port 8080) または Electron
2. 執筆: WYSIWYG / textarea モードで本文を書く
3. 構造化: 章管理 (chapterMode)、セクションナビ
4. 装飾: テーマ・見出しプリセット・傍点・ルビ
5. プレビュー: Reader モード / 分割ビュー
6. 出力: JSON プロジェクト保存 (.zwp.json)
7. 保存: IndexedDB + localStorage フォールバック

## E2E テスト実行手順

- `npx playwright test --reporter=line` で全件回帰確認
- テスト追加時は beforeEach に `ensureNormalMode(page)` を含める
- サイドバー操作は `openSidebar(page)` (evaluate 経由) を使用する
- ガジェット操作テストでは `enableAllGadgets(page)` で slim モードを解除する
- Visual Audit は `e2e/visual-audit.spec.js` で実 UI フロー + 重複画像検出

## 品質目標

- E2E: 0 failed を維持
- lint: 0 errors / 0 warnings を維持
- テスト追加時は既存パターン (helpers.js) を再利用し、新規ヘルパーは最小限に

## Actor Boundaries

- **user**: 執筆内容、UI 方向性判断 (HUMAN_AUTHORITY)、手動確認、Reader/Focus 体感評価
- **assistant**: テスト修正、コード実装、ドキュメント同期、堆積物削除
- **tool**: E2E テスト、lint、Visual Audit
- **shared**: 次スライス選定、仕様策定

## 手動工程 / 自動化禁止工程

- 執筆内容の判断 (AI は執筆しない)
- UI デザインの方向性判断 (HUMAN_AUTHORITY)
- Reader ボタン / Focus パネル間隔の体感確認 (ユーザーの実ウィンドウサイズ)
- Electron 実機での動作確認

## 検証の原則

- Screenshot refresh だけでは検証にならない。実 UI フローを通じた状態証明が必要
- Reader / Focus の回帰確認は実 entry/exit フローで行う (DOM 直接操作では stale event binding を見逃す)

## 運用ルール

- 一度説明された workflow pain はここへ固定する
- 「本制作へ進む前に workflow proof が必要」な案件では、その proof 条件もここへ残す
- **手動確認依頼と「次に何をするか」の選択肢提示を同一メッセージに混ぜない**（正本: [`docs/INTERACTION_NOTES.md`](INTERACTION_NOTES.md)「手動確認の出し方」）。確認が終わってから別メッセージでアクション候補を出す
