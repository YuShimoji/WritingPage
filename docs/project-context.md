# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 20 — session 19 検証 (Playwright自動検証13テスト全通過)

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 514 passed / 1 failed (canvas-mode既知) / 5 skipped + 検証spec 13 passed
- spec-index: 54エントリ (done 41, partial 2, removed 10, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- 発見事項: SectionsNavigator が登録済み(28個)だがパネル未配置(配置27個)
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
- 現在のスライス: session 19 ガジェット整理の検証完了
- 今回 (session 20) の変更:
  - Playwright自動検証スクリプト作成 (e2e/session19-verify.spec.js, 13テスト)
  - 全13テスト passed: ガジェット削除/無効化/配置/ロードアウト/ヘルプモーダル/ui-labels
  - スクリーンショット9枚撮影 (e2e/verification-screenshots/)
  - 発見: SectionsNavigator が登録済み(28個)だがどのパネルにも未配置
- 次回最初に確認すべきファイル:
  - e2e/session19-verify.spec.js (検証テスト)
  - e2e/verification-screenshots/ (スクリーンショット)
- 未確定の設計論点: SP-076 Phase 4, SectionsNavigatorの扱い
- 今は触らない範囲: SP-073 Phase 4
