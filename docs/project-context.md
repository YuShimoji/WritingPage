# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 25 — レガシー最終掃除 + 包括調査表 + SP-076 done確認

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 535 passed / 0 failed / 3 skipped + 検証spec 13 passed
- spec-index: 54エントリ (done 40, partial 2, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録 (session 19で33→28整理)
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 25: SP-076 done確認、レガシー最終掃除、包括調査表作成

---

## CURRENT DEVELOPMENT AXIS

- 主軸: 残 partial 完了 (SP-073 Phase 4) + WP-001 再訪 (SP-076 done トリガー)
- この軸を優先する理由: SP-076 done で保守モード脱出。残 partial は SP-005 (ROADMAP連動) と SP-073 のみ
- 今ここで避けるべき脱線: スコープ外項目の復活、追加クリーンアップへの逃避

---

## CURRENT LANE

- 主レーン: Experience Slice (SP-073 Phase 4 or WP-001 再訪)
- 副レーン: Visual Audit (stale 4ブロック)
- 今このレーンを優先する理由: SP-076 done。保守モード脱出完了。残は SP-073 Phase 4 (仕様未策定) or WP-001 再訪
- いまは深入りしないレーン: Acceptance / クリーンアップ (一掃済み)

---

## CURRENT SLICE

- スライス名: (次セッションで選択) SP-073 Phase 4 仕様策定+実装 or WP-001 再訪
- 成功状態: SP-073 done/100% or WP-001 の方向性確定
- 前提: SP-076 done (session 25 確認)。SP-073 Phase 4 は仕様策定から。WP-001 は SP-076 done がトリガー

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-073 Phase 4 フリーハンド描画の仕様 (未策定)

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

- 現在の主レーン: Experience Slice (保守モード脱出完了)
- 現在のスライス: SP-073 Phase 4 仕様策定+実装 or WP-001 再訪
- 今回 (session 25) の変更:
  - レガシー最終掃除 (ui-labels.js Clock ラベル、storage.js nodegraph キャッシュ初期化)
  - 包括調査表作成: docs/verification/session25-status-matrix.md
  - SP-076 Phase 4 が既に実装済みであることを確認、done/100% に更新
  - E2E: 535 passed / 0 failed / 3 skipped
- 次回最初に確認すべきファイル:
  - docs/verification/session25-status-matrix.md (包括調査表)
  - docs/specs/spec-path-text.md (SP-073 Phase 4 仕様策定が必要)
- 未確定の設計論点: V-2/V-3/V-4 の詳細不明 (Visual Audit 未実施、stale 4ブロック)
- 今は触らない範囲: 追加クリーンアップ (一掃済み)
- 次回推奨:
  - Visual Audit (stale 4ブロック、V-2/V-3/V-4 特定)
  - SP-073 Phase 4 仕様策定 (フリーハンド描画、HUMAN_AUTHORITY)
  - WP-001 再訪 (SP-076 done がトリガー)
