# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.30)
- 直近の状態: session 30 — SP-081 エディタ体験再構築 Phase 1-2

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 478 passed / 0 failed / 3 skipped (session 30 で 80 failed → 0 failed に改善)
- spec-index: 56エントリ (done 42, partial 2, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 27: JSONプロジェクト保存、フォーカスモードデフォルト化、SP-080追加
- session 28: SP-073 Phase 4 フリーハンド描画 + WYSIWYG バグ5件修正
- session 29: 傍点GUI + .zwp.jsonドロップインポート + BP-5アコーディオン再入防止
- session 30: SP-081 エディタ体験再構築 — レガシー章管理削除(-254行)、モード切替安定化、ツールバー整理、エッジホバーヒント

---

## CURRENT DEVELOPMENT AXIS

- 主軸: SP-081 エディタ体験再構築 (執筆の最小ループの完成)
- この軸を優先する理由: 基本機能は揃っているが、モード切替・章管理・ツールバーの状態管理に多数の粗がある。「執筆エディタとして最小限のループが完成していない」状態の解消が最優先
- 今ここで避けるべき脱線: 新規大型機能、コンテンツ生成系機能、OAuth/Electron配布

---

## CURRENT LANE

- 主レーン: Advance (SP-081 エディタ体験再構築)
- 副レーン: Excise (レガシー除去は SP-081 に内包)
- 今このレーンを優先する理由: ユーザーが11件のUX摩擦を特定。Phase 1-2 でレガシー削除+モード切替+ツールバー整理を完了。Phase 3 以降で執筆フローの洗練を継続
- いまは深入りしないレーン: 追加テスト、新規ガジェット

---

## CURRENT SLICE

- スライス名: SP-081 エディタ体験再構築 (session 30 で Phase 1-2 完了)
- 成功条件: モード切替でUI破綻しない / 章作成が増殖しない / ツールバーが整理されている / エッジホバーにヒントがある / E2E回帰なし
- Phase 1-2 達成済み。Phase 3 以降: WYSIWYGツールバー整理、Blankモードの再検討、章パネルピン留め

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - Blankモードの存在意義 (Focusとの視覚差が小さい。削除 or 差異化)
  - WYSIWYGフローティングツールバーのボタン数削減方針
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

- 現在の主レーン: Advance (SP-081 エディタ体験再構築)
- 現在のスライス: SP-081 Phase 1-2 完了 (session 30)
- 今回 (session 30) の変更:
  - SP-081 Phase 1: chapter-list.js からPhase 1 heading-based章管理を全削除(-254行)、chapterMode一本化
  - chapter-store.js: migrateToChapterMode/revertChapterMode削除、ensureChapterMode追加
  - app.js: setUIModeにエッジホバーリセット+サイドバー自動閉/復元+フローティングツールバー非表示
  - editor-wysiwyg.js: フローティングツールバーの状態をdata-visible属性のみで管理
  - edge-hover.js: Focusモードでエッジホバーヒントテキスト表示(2回表示で自動消去)
  - SP-081 Phase 2: Canvas Mode+装飾グループをメインツールバーからhidden
  - session 29追加: BP-5アコーディオン再入防止、ガジェットcleanup API、reader縦書きトグル
  - Visual Audit 8枚: docs/verification/2026-03-29/
  - E2E: 478 passed / 0 failed / 3 skipped (修正前80 failed)
- 次回最初に確認すべきファイル:
  - ブラウザで Focus モードの初期表示+エッジホバー+章パネル+モード切替を手動確認
  - docs/spec-editor-rebuild.md (SP-081 仕様書)
- 未確定の設計論点:
  - Blankモードの存在意義 (Focusとの視覚差が小さい。削除 or 差異化)
  - 装飾グループ/Canvas Mode のHTML要素自体を削除してよいか (現在hidden)
  - WYSIWYGフローティングツールバーのボタン数 (~15個。最小限に絞る方向?)
  - WP-001 方向性 (HUMAN_AUTHORITY)
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - エッジホバーヒントはFocusモードのみ、localStorage記録で2回表示後自動消去
  - フローティングツールバーはreaderモードでも非表示
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - [Advance] SP-081 Phase 3: WYSIWYGフローティングツールバーのボタン整理
  - [Audit] 実機手動確認 — Focus モードの実使用フロー検証
  - [Advance] 新規章の初期フォーカス改善
  - [Unlock] 章パネルの常時表示オプション (ピン留め)
