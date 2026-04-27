# Operator Workflow

人間オペレーターの実ワークフロー・痛点・品質目標を保持する正本。

## 全体フロー

1. 起動: `node scripts/dev-server.js` (port 8080) または Electron
2. 執筆: リッチ編集表示を既定の執筆面とし、Markdown source は確認・修正用に使う
3. 構造化: 章管理 (chapterMode)、セクションナビ
4. 装飾: テーマ・見出しプリセット・傍点・ルビ
5. プレビュー: 再生オーバーレイ（読者視点）・MD プレビュー分割 など（UI モードとしての Reader は廃止。用語は [`INTERACTION_NOTES.md`](INTERACTION_NOTES.md)）
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

## Build Checkpoint Policy (2026-04-16 確立)

Electron パッケージ版 (`npm run build` → `dist/` / `build/win-unpacked/`) はビルドしないと反映されない。コミット基準で再ビルドを走らせる。

### コミット時の再ビルド判定

| コミット内容 | 再ビルド |
|---|---|
| 実行コード (js/ css/ electron/ index.html) を含む | **要** (コミット完了後に自動で `npm run build`) |
| docs/*.md のみ | 不要 |
| samples/ のみ | 不要 |
| e2e/ のみ | 不要 (パッケージ対象外) |
| コメント・typo・lint 自動修正のみ | 不要 |

### 実行手順

1. コミット成立を確認する (pre-commit フック通過含む)
2. 上記表で「要」判定なら、assistant は続けて `npm run build` を `run_in_background: true` で起動する
3. ビルド完了を user に報告し、`.exe` パスを明示する (`dist/win-unpacked/Zen Writer.exe` 等)
4. ビルド失敗時は即座に user に報告し、修正方針を問う

### 複数コミットを連続して作成する場合

- 実行コードに影響するコミットが連続するなら、**最後のコミット後に 1 回だけ** ビルドする (個別コミット毎ビルドは時間コストが重い)
- バッチ途中で中断・方針変更があった場合はその時点の HEAD でビルドする
