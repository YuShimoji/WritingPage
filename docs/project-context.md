# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 24 — session 22-24 レガシー根絶一括コミット + E2E検証

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 555 passed / 1 failed (canvas-mode既知) / 3 skipped + 検証spec 13 passed
- spec-index: 54エントリ (done 39, partial 3, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録 (session 19で33→28整理)
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)

---

## CURRENT DEVELOPMENT AXIS

- 主軸: 残 partial 完了 (SP-076 Phase 4, SP-073 Phase 4) + 保守モード脱出
- この軸を優先する理由: 仕様整理・レガシー根絶完了。保守モード3セッション連続。成果物を前進させるフェーズ
- 今ここで避けるべき脱線: スコープ外項目の復活、追加クリーンアップへの逃避

---

## CURRENT LANE

- 主レーン: Experience Slice (SP-076 Phase 4 / SP-073 Phase 4)
- 副レーン: Visual Audit (stale 3ブロック)
- 今このレーンを優先する理由: レガシー根絶完了。保守モード脱出のため成果物前進を優先
- いまは深入りしないレーン: Acceptance / クリーンアップ (一掃済み)

---

## CURRENT SLICE

- スライス名: (次セッションで選択) SP-076 Phase 4 実装 or SP-073 Phase 4
- 成功状態: SP-076 done/100% (プリセットUI + LoadoutManager統合) or SP-073 done/100%
- 前提: SP-076 Phase 4 は仕様策定済み (docs/specs/spec-dock-panel.md)。SP-073 Phase 4 は仕様策定から

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-076 Phase 4 の実装詳細 (仕様策定済み、プリセットのみ)
  - SP-073 Phase 4 フリーハンド描画の仕様

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

- 現在の主レーン: Experience Slice (保守モード脱出)
- 現在のスライス: 次セッションで SP-076 Phase 4 実装 or SP-073 Phase 4 を選択
- 今回 (session 22-24) の変更:
  - デッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
  - 37ファイル変更、コミット 6e4269b
  - E2E: 555 passed / 1 failed (canvas-mode既知) / 3 skipped
  - 包括調査レポート: docs/verification/session22-investigation.md
- 次回最初に確認すべきファイル:
  - docs/specs/spec-dock-panel.md (SP-076 Phase 4 仕様策定済み)
  - docs/verification/session22-investigation.md (調査全記録)
- 未確定の設計論点: V-2/V-3/V-4 の詳細不明 (Visual Audit 未実施)
- 今は触らない範囲: 追加クリーンアップ (一掃済み)
- 次回推奨:
  - SP-076 Phase 4 実装 (仕様策定済み、成果物前進の最短ルート)
  - Visual Audit (stale 3ブロック、UI変更前に実施推奨)
