# Project Context

## RECENT NOTE (2026-03-30, session 32)

- 章増殖バグ根絶: sidebar-manager.js の直接テキスト挿入経路を封殺 → ZWChapterList.addChapter() 委譲
- Blank モード完全除去: command-palette.js / dock-panel.css / コメント
- setUIMode 全経路統一: E2E 12ファイル 30+箇所を setUIMode 経由に統一、helpers.js に setUIMode ヘルパー追加
- visual-profile.js を setUIMode 経由に修正
- E2E: 108 passed / 1 failed (既知B-1) / 1 skipped（変更箇所直結テスト）

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: session 32 — SP-081 Phase 3: 章増殖バグ根絶 + Blank完全除去 + setUIMode全経路統一

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 483 passed / 0 failed / 3 skipped (session 31-33)
- spec-index: 56エントリ (done 43, partial 1, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 27: JSONプロジェクト保存、フォーカスモードデフォルト化、SP-080追加
- session 28: SP-073 Phase 4 フリーハンド描画 + WYSIWYG バグ5件修正
- session 29: 傍点GUI + .zwp.jsonドロップインポート + BP-5アコーディオン再入防止
- session 30: SP-081 エディタ体験再構築 — レガシー章管理削除(-254行)、モード切替安定化、ツールバー整理、エッジホバーヒント
- session 31: SP-081 Phase 3 — Blank廃止、エッジグロー、Reader導線整備、縦書き入力、E2E 483pass
- session 32: SP-081 Phase 3 — 章増殖バグ根絶、Blank完全除去、setUIMode全経路統一
- session 33: SP-081 Phase 4 — setUIMode force パラメータ、サイドバー永続化、minimal→setUIMode統一、Reader aria-pressed/return-bar修正。SP-081 done/100%
- session 34: コミット整理、S4/persist切り分け(テストスクリプトのキーパス誤り、実装は正常)

---

## CURRENT DEVELOPMENT AXIS

- 主軸: SP-081 done/100%。次の frontier 未定 (WP-001 トリガー成立済み、HUMAN_AUTHORITY)
- この軸を優先する理由: 基盤安定。モード切替・章管理・ツールバーの状態管理が完成。次は執筆ワークフロー統合 or 既存機能の磨き上げ
- 今ここで避けるべき脱線: 新規大型機能、コンテンツ生成系機能、OAuth/Electron配布

---

## CURRENT LANE

- 主レーン: (SP-081 完了、次レーン未定)
- 候補: WP-001 執筆ワークフロー統合 (HUMAN_AUTHORITY) / 既存成果物の直接改善
- いまは深入りしないレーン: 追加テスト、新規ガジェット

---

## CURRENT SLICE

- スライス名: (SP-081 done/100%、次スライス未定)
- SP-081 成功条件: 全9件達成済み
- 次スライス候補: WP-001 方向性決定待ち

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
| WP-001 | 執筆ワークフロー統合仕様 → **UI磨き上げ・摩擦軽減** | **着手中** (session 34~) | Experience Slice | Reader モードスイッチ統合 done。次: hidden要素削除/ツールバー整理 |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: (SP-081 done/100%、次 frontier 未定)
- 現在のスライス: 次スライス選定待ち
- 今回 (session 33-34) の変更:
  - session 33: SP-081 Phase 4 — setUIMode force パラメータ、サイドバー永続化、minimal→setUIMode統一、Reader aria-pressed/return-bar修正。done/100%
  - session 34: 2コミット(実装+docs)、S4/persist切り分け完了(テストスクリプト側バグ)、docs乖離修正
- 次回最初に確認すべきファイル:
  - WP-001 方向性の決定 (HUMAN_AUTHORITY)
  - 装飾グループ/Canvas Mode のHTML要素削除判断
- 未確定の設計論点:
  - WP-001 執筆ワークフロー統合の方向性 (HUMAN_AUTHORITY)
  - 装飾グループ/Canvas Mode のHTML要素自体を削除してよいか (現在hidden)
  - WYSIWYGフローティングツールバーのボタン数 (~15個。最小限に絞る方向?)
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
  - setUIMode が全モード切替の単一入口。直接 setAttribute は禁止
  - サイドバー開閉は toggleSidebar() → s.sidebarOpen に永続化。setUIMode Normal復帰時に復元
  - エッジグローはFocusモードのみ
  - フローティングツールバーはreaderモードでも非表示
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - [Unlock] WP-001 方向性決定 (HUMAN_AUTHORITY)
  - [Advance] 既存成果物の直接改善 (ボタン数最適化、装飾グループ整理)
  - [Excise] 一時検証スクリプト削除 (scripts/t.js, scripts/visual-audit-test.js)
