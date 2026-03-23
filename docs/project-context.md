# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 19 — ガジェット大整理(33→27) + MarkdownReference配置修正 + help/reference分離 + legacy仕様7件removed化

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 514 passed / 1 failed (canvas-mode既知) / 3 skipped
- spec-index: 54エントリ (done 41, partial 2, removed 10, superseded 1)
- Q1/Q2/Q3 全解決済み。残: Q4(サンプル位置づけ)
- EPUB: スコープ外 (2026-03-23 除外決定)

---

## CURRENT DEVELOPMENT AXIS

- 主軸: UI/UX磨き上げ (サイドバー/ドック体験設計 + ガジェット整理)
- この軸を優先する理由: 機能は95%揃っている。残りは「どう使わせるか」の体験設計と partial 2件 (SP-073/076)
- 今ここで避けるべき脱線: スコープ外項目の復活、新規大型機能の追加

---

## CURRENT LANE

- 主レーン: Authoring / Experience Slice
- 副レーン: Acceptance / E2E
- 今このレーンを優先する理由: パイプライン定義完了 (WRITING_PIPELINE.md)。Q1-Q3解決済み。残りはQ4決定+partial2件+ガジェット整理
- いまは深入りしないレーン: Runtime Core (ストレージ/モード基盤は安定)

---

## CURRENT SLICE

- スライス名: ガジェット整理 + レガシー仕様クリーンアップ (session 19)
- ユーザー操作列: RESUME → ガジェット33→27削減 → MarkdownReference修正 → help/reference分離 → legacy仕様removed化
- 成功状態: ガジェットがシンプルモダンに整理され、MarkdownReferenceが到達可能、legacy仕様が解消
- 次スライス候補: SP-076 Phase 4 (上下ドック) / SP-073 Phase 4 (フリーハンド)

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-076 Phase 4 (上下ドック+プリセット) の体験ゴール

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold | Experience Slice | サイドバー/ドック表示品質スライス完了後 |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Experience Slice / Authoring
- 現在のスライス: ガジェット整理 + レガシー仕様クリーンアップ
- 今回 (session 19) の変更:
  - ガジェット整理: 33→27 (Clock/Samples/NodeGraph/GraphicNovel削除、UIDesign/SceneGradient無効化)
  - ロードアウト再構成: graphic-novelプリセット削除、全プリセットにMarkdownReference追加、ミニマル/脚本の不要ガジェット除去
  - gadgets-help.js: ヘルプからリファレンスを分離、Lucideアイコン除去、Wiki手順を現行UIに更新、セクション9→6に削減
  - ui-labels.js: 「ヘルプ / リファレンス」→「ヘルプ」
  - legacy仕様7件: SP-003/006/014/015/021/031/032/047を全てremoved化
  - spec-index.json: legacy→removed一括変更、SP-004 summary更新
  - GADGETS.md: ガジェット一覧27個に更新、削除/無効化の理由記載
- E2E: 要確認 (ガジェット削除でテスト影響の可能性あり)
- 未確定の設計論点: SP-076 Phase 4
- 今は触らない範囲: SP-073 Phase 4
