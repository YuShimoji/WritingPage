# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 26 — デッドコード根絶(-1,121行) + Visual Audit + ドキュメント同期

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 542 passed / 0 failed / 3 skipped (63 spec files)
- spec-index: 54エントリ (done 40, partial 2, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 25: SP-076 done確認、レガシー最終掃除、包括調査表作成
- session 26: デッドコード根絶(-1,121行)、deprecated API削除、Visual Audit実施、V-2/V-3/V-4解消見込み

---

## CURRENT DEVELOPMENT AXIS

- 主軸: 安定版完成 + 残 partial 完了 + WP-001 再訪
- この軸を優先する理由: SP-076 done, レガシー根絶完了。残 partial は SP-005/SP-073 のみ。WP-001 のトリガー条件成立
- 今ここで避けるべき脱線: スコープ外項目の復活、新規大型機能の追加

---

## CURRENT LANE

- 主レーン: Advance (次の前進方向を選択)
- 副レーン: なし
- 今このレーンを優先する理由: Excise 2ブロック連続完了。保守モード脱出が必要
- いまは深入りしないレーン: Excise (一掃済み)、追加テスト

---

## CURRENT SLICE

- スライス名: (次セッションで選択) SP-073 Phase 4 仕様策定 or WP-001 再訪 or 創造的機能提案
- 成功状態: SP-073 done/100% or WP-001 方向性確定 or 新規 Advance 開始
- 前提: Excise 完了。Visual Audit fresh。全 E2E 通過

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-073 Phase 4 フリーハンド描画の仕様 (未策定)
  - WP-001 執筆ワークフロー統合の方向性

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold → **トリガー成立** | Experience Slice | SP-076 done (session 25 確認) |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance 待ち (Excise 完了、保守モード脱出)
- 現在のスライス: 次セッションで選択
- 今回 (session 26) の変更:
  - デッドコード根絶 (-1,121行): nodegraph API, deprecated タブ管理, 非機能UI
  - テスト整理: 3ファイル削除、visual-audit修正、canvas-mode skip化
  - Visual Audit: 20枚更新、V-2/V-3/V-4 解消見込み
  - ドキュメント同期: ISSUES.md archive, ROADMAP/README更新
  - E2E: 542 passed / 0 failed / 3 skipped
- 次回最初に確認すべきファイル:
  - docs/specs/spec-path-text.md (SP-073 Phase 4 仕様策定が必要)
  - WRITING_PIPELINE.md (WP-001 再訪の基盤)
- 未確定の設計論点:
  - SP-073 Phase 4 フリーハンド描画のUX (HUMAN_AUTHORITY)
  - WP-001 方向性 (HUMAN_AUTHORITY)
- 今は触らない範囲: 追加クリーンアップ (一掃済み)
- 次回推奨:
  - [Advance] SP-073 Phase 4 仕様策定 + 実装
  - [Unlock] WP-001 再訪 (トリガー成立)
  - [Advance] visual-audit テスト品質改善 (サンプル読込/モーダル開封)
