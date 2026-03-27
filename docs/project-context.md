# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 28 — SP-073 Phase 4 フリーハンド描画 + WYSIWYG バグ5件修正

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 60件通過確認 (主要4スイート)。全体は 542+ passed / 0 failed / 3 skipped
- spec-index: 55エントリ (done 42, partial 1, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 25: SP-076 done確認、レガシー最終掃除、包括調査表作成
- session 26: デッドコード根絶(-1,121行)、deprecated API削除、Visual Audit実施、V-2/V-3/V-4解消見込み
- session 27: JSONプロジェクト保存(zenwriter-v1形式)、フォーカスモードデフォルト化、Electron JSON保存メニュー、SP-080追加

---

## CURRENT DEVELOPMENT AXIS

- 主軸: ミニマル執筆体験の深化 + WP-001 再訪
- この軸を優先する理由: JSONプロジェクト保存+フォーカスモードデフォルト化で基盤完成。執筆ワークフロー統合(WP-001)の具体化が次の焦点
- 今ここで避けるべき脱線: スコープ外項目の復活、新規大型機能の追加

---

## CURRENT LANE

- 主レーン: Advance (ミニマル執筆体験)
- 副レーン: なし
- 今このレーンを優先する理由: JSONプロジェクト保存+フォーカスモード改善完了。次は実使用フローの深化
- いまは深入りしないレーン: Excise (一掃済み)、追加テスト

---

## CURRENT SLICE

- スライス名: SP-073 Phase 4 フリーハンド描画 (session 28 完了)
- 成功状態: SP-073 done/100%。RDP簡略化+ベジェ近似。E2E 27件全通過。残 partial は SP-005 のみ
- 前提: SP-073/SP-076 全完了。次は WP-001 再訪 or 新しい体験スライス

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

- 現在の主レーン: Advance + Bugfix
- 現在のスライス: SP-073 Phase 4 + WYSIWYG バグ修正 (session 28 完了)
- 今回 (session 28) の変更:
  - SP-073 Phase 4 フリーハンド描画: RDP簡略化 + ベジェ近似、E2E 27件
  - WYSIWYG バグ5件修正: formatBlock/insertList/ツールバー折り返し/textarea復帰/ルビカーソル
  - dock-preset.spec.js: focus モード対応
  - Visual Audit 50枚: docs/verification/2026-03-27/
  - バグパターン記録: docs/verification/session28-bug-patterns.md
- 次回最初に確認すべきファイル:
  - ブラウザで手動確認 (ESC→normal→見出し/ルビ/ソース復帰の動作)
  - docs/verification/session28-bug-patterns.md (BP-5 未修正: 構造アコーディオンループ)
- 未確定の設計論点:
  - WP-001 方向性 (HUMAN_AUTHORITY)
  - BP-5 構造アコーディオンループの根本原因 (sidebar-manager.js)
  - Google Keep連携の是非 (以前スコープ外に除外、ユーザーが再要望)
  - 保存状態スナップショットの仕様
- 今は触らない範囲: 追加クリーンアップ
- 次回推奨:
  - [Audit] Visual Audit — フォーカスモードの見え方確認 (visual_evidence_status: stale)
  - [Advance] ファイルドロップでの.zwp.jsonインポート
  - [Unlock] WP-001 再訪 (トリガー成立)
