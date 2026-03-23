# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 18 — スコープ整理(投機的要件16件除外) + 仕様書一括整合 + Q4決定(WP-003クローズ) + WP-002ガジェット統合計画策定

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 514 passed / 1 failed (canvas-mode既知) / 3 skipped
- spec-index: 54エントリ (active 47)
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

- スライス名: 仕様書一括整合 + スコープ整理 (session 18)
- ユーザー操作列: REFRESH → EPUB/DOCX除外 → 投機的todo全件スコープ外 → 仕様書整合
- 成功状態: 全ドキュメント間の数値・ステータスが一致。投機的要件がブロッカーでなくなる
- 次スライス候補: Q4決定(WP-003) / WP-002(ガジェット整理) / SP-076 Phase 4

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-076 Phase 4 (上下ドック+プリセット) の体験ゴール
  - WP-002 ガジェット整理方針 (33個の再編)

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold | Experience Slice | サイドバー/ドック表示品質スライス完了後 |
| WP-002 | ガジェット整理 (33個→カテゴリ再編) | hold | UI | SP-076 Phase 2 タブグループ着手時 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Experience Slice / Authoring
- 現在のスライス: 仕様書一括整合 + スコープ整理
- 今回 (session 18) の変更:
  - スコープ整理: EPUB/DOCX/画像管理/Canvas/Google Keep/プラグイン正式化/サイドバーP2-3/WYSIWYG動画アニメ/長期ビジョン7件を除外
  - spec-index.json: SP-074/059/079 summary更新(Q1/Q2/Q3反映)、SP-075/056/022→removed
  - spec-web-novel-effects.md: 未決定事項6件→全件解決済みに更新
  - sp-074-phase-plan.md: Phase 2/3にQ3実装反映
  - WRITING_PIPELINE.md: Stage 6→95%, 自動化候補Q1/Q2解決済み反映, EPUB/DOCX行削除
  - ROADMAP.md: 全投機的todo→スコープ外、ステータス語彙にremoved追加、現在の状態更新
  - project-context.md: E2E数値修正, 未確定要素整理, HANDOFF更新
  - CLAUDE.md: DECISION LOG追記(EPUB/DOCX除外), E2E数値修正
- E2E: 514 passed / 1 failed (canvas-mode) / 3 skipped
- 未確定の設計論点: Q4(サンプル位置づけ) / SP-076 Phase 4 / WP-002(ガジェット整理)
- 今は触らない範囲: SP-073 Phase 4
