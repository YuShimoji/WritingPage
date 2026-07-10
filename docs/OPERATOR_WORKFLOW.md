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

## Macro Workflow Lens

Assistant の報告・提案は、局所差分をこの全体フローへ接続する。たとえば gadget cleanup は「執筆中の視界を軽くする」、Reader / Replay 修正は「プレビュー判断を安全にする」、docs hygiene は「次スライス選定の誤誘導を減らす」のように、どの制作段階の摩擦が減るかを明示する。

次の一手が開いている場合は、単一の安全案だけに圧縮せず、実装前進・監査・削除・探索・検証のように意味が違う入口を提示する。人間の創造判断が必要な箇所では、assistant は比較材料・プロトタイプ・狭い検証を用意し、判断そのものを奪わない。

## 監修 AI → 開発 AI の反復

監修側は手順を小分けして渡すのではなく、`docs/ai/prompts/supervisor_to_codex.md`
の outcome package を 1 本作る。package はユーザー成果、現在の bottleneck、
最大 3 件の密結合した変更、Codex が自律判断できる範囲、hard stop、受入証拠を
含む。開発側はその範囲の調査、実装、関連修正、検証、live state 更新、通常の
Git follow-through までを所有する。

作業単位は「1ファイル」「1修正」「次の1 action」ではなく、ユーザーが効果を
確認できる **1 outcome slice** とする。分離すると未完成になる code / test / docs /
review access は同じ slice に含めてよい。別の製品判断を混ぜることはしない。

主観性が高い UI / language / content / typography / motion は、完成品を突然実装せず
`Explore -> Choose -> Build -> Review` を使う。assistant が 2〜4 案と推奨案を
低コストで作り、user が明示された implementation decision gate で選ぶ。その選択は
package 内の実装承認を兼ねるため、同じ方向について再承認を求めない。

完成後の preference 修正は 1 回分をまとめる。2 回の修正でも収束しない場合は、
3 回目の個別修正を足さず、比較軸を作り直して方向転換・既知 debt 受容・lane 停止の
いずれかを決める。

## Review / Autonomy Loop

レビューが必要なときは、assistant は固定文回答を要求せず Review Card を出す。Review Card は対象、見るポイント 3 個以内、自由文でよいこと、自由文例、assistant がどう解釈して続行するかを含める。詳細は [`OPERATOR_REVIEW_UX.md`](OPERATOR_REVIEW_UX.md)。

user の自由文レビューは target / intent / constraints / confidence に整理する。confidence が high / medium なら、assistant は可逆で狭い作業へ戻る。confidence が low で誤読が artifact 方向を変える場合だけ、Review Clarification Card を 1 回だけ出す。

assistant-owned の docs hygiene / 実装 / 検証では、accepted outcome checkpoint までの経路が明確で可逆かつスコープ内なら、action 数で止めずに実行する。報告は checkpoint、Review Card、真の停止条件、または同じ blocker の反復時に絞る。

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

- **user**: 執筆内容、提示された創造方向の最終選択と受入、手動確認、Reader/Focus 体感評価
- **assistant**: 調査、創造方向の比較案・推奨・低コスト prototype、テスト修正、コード実装、ドキュメント同期、堆積物削除
- **tool**: E2E テスト、lint、Visual Audit
- **shared**: outcome slice 選定、方向 gate、仕様策定

## 手動工程 / 自動化禁止工程

- 執筆内容の判断 (AI は執筆しない)
- UI デザイン方向の最終選択 (比較案・推奨・prototype の作成は assistant-owned)
- Reader ボタン / Focus パネル間隔の体感確認 (ユーザーの実ウィンドウサイズ)
- Electron 実機での動作確認

## 検証の原則

- Screenshot refresh だけでは検証にならない。実 UI フローを通じた状態証明が必要
- Reader / Focus の回帰確認は実 entry/exit フローで行う (DOM 直接操作では stale event binding を見逃す)

## 運用ルール

- 一度説明された workflow pain はここへ固定する
- 「本制作へ進む前に workflow proof が必要」な案件では、その proof 条件もここへ残す
- 手動確認と次方向は同じ問いに混ぜない。同一報告内では別節として併記してよく、独立した assistant-owned lane はレビュー待ちの間も進める

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
