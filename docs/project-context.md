# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 21 — 仕様整理 + SP-076 Phase 4 仕様策定

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 514 passed / 1 failed (canvas-mode既知) / 5 skipped + 検証spec 13 passed
- spec-index: 54エントリ (done 41, partial 2, removed 10, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録 (session 19で33→28整理、session 21でGADGETS.mdにSectionsNavigator追加)
- EPUB: スコープ外 (2026-03-23 除外決定)

---

## CURRENT DEVELOPMENT AXIS

- 主軸: 仕様整理 + SP-076 Phase 4 仕様策定 + 残 partial 完了
- この軸を優先する理由: 機能は95%揃っている。仕様書間の不整合解消後、SP-076 Phase 4 (上下ドック+プリセット) の体験ゴール確定が残り最大の仕様課題
- 今ここで避けるべき脱線: スコープ外項目の復活、新規大型機能の追加

---

## CURRENT LANE

- 主レーン: Authoring / Experience Slice
- 副レーン: Acceptance / E2E
- 今このレーンを優先する理由: パイプライン定義完了 (WRITING_PIPELINE.md)。Q1-Q3解決済み。残りはQ4決定+partial2件+ガジェット整理
- いまは深入りしないレーン: Runtime Core (ストレージ/モード基盤は安定)

---

## CURRENT SLICE

- スライス名: 仕様整理 + SP-076 Phase 4 仕様策定 (session 21)
- ユーザー操作列: RESUME → 仕様不整合I-1〜I-8修正 → SP-076 Phase 4 体験ゴール確定 → 仕様書更新
- 成功状態: 仕様書間の不整合が解消され、SP-076 Phase 4 の仕様が策定済み (実装は別Worker)
- 次スライス候補: SP-076 Phase 4 実装 / SP-073 Phase 4 (フリーハンド) 仕様+実装

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

- 現在の主レーン: Authoring / Spec
- 現在のスライス: session 21 仕様整理 + SP-076 Phase 4 仕様策定
- 今回 (session 21) の変更:
  - 仕様不整合 I-1〜I-8 一括修正 (ROADMAP/GADGETS/spec-index/WRITING_PIPELINE/project-context)
  - SectionsNavigator を GADGETS.md テーブルに追加 (27→28件統一)
  - SP-076 Phase 4 仕様策定 (進行中)
  - runtime-state.md 新規作成
- 次回最初に確認すべきファイル:
  - docs/specs/spec-dock-panel.md (SP-076 Phase 4 仕様)
  - docs/ROADMAP.md (更新済み)
- 未確定の設計論点: V-1 サイドバーアコーディオン非表示 (T-2 KNOWN_GROUPS問題が原因候補)
- 今は触らない範囲: SP-073 Phase 4 実装
- 次回優先調査:
  - V-1: サイドバーアコーディオン5/6カテゴリが display:none (gadgets-utils.js KNOWN_GROUPS に sections 未定義が根本原因候補)
  - T-1: 削除済みガジェット (Clock/Samples/GraphicNovel/NodeGraph) の JS ファイルと register() 残存
  - T-3: screenplay プリセットに sections グループキーがない
