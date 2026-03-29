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
- E2E: 483 passed / 0 failed / 3 skipped (session 31-32)
- spec-index: 56エントリ (done 42, partial 2, removed 11, superseded 1)
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

- 現在の主レーン: Advance (SP-081 エディタ体験再構築 Phase 3)
- 現在のスライス: SP-081 Phase 3 進行中 (session 32)
- 今回 (session 31-32) の変更:
  - session 31: Blank廃止→3モード体制、エッジグロー（ヒント→グラデーション）、Reader導線整備（復帰バー+ボタン常時表示）、縦書き入力、E2E 483 pass
  - session 32: 章増殖バグ根絶（sidebar-manager経路B封殺→ZWChapterList.addChapter委譲）、Blank完全除去（command-palette/dock-panel.css）、setUIMode全経路統一（E2E 12ファイル 30+箇所）、visual-profile.js setUIMode経由化
  - sidebar-layout.spec.js: setUIMode副作用によるサイドバー復元対応
  - E2E: 108 passed / 1 failed (既知B-1) / 1 skipped（変更箇所直結テスト）
- 次回最初に確認すべきファイル:
  - ブラウザで章追加→モード切替→章が増殖しないか手動確認
  - js/sidebar-manager.js: _insertQuickSection (委譲に書換済み)
  - js/chapter-list.js: addChapter 公開API
- 未確定の設計論点:
  - 装飾グループ/Canvas Mode のHTML要素自体を削除してよいか (現在hidden)
  - WYSIWYGフローティングツールバーのボタン数 (~15個。最小限に絞る方向?)
  - WP-001 方向性 (HUMAN_AUTHORITY)
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
  - setUIMode が全モード切替の単一入口。直接 setAttribute は禁止（フォールバック用 else のみ許可）
  - エッジグローはFocusモードのみ（テキストヒントは廃止→グラデーションに変更）
  - フローティングツールバーはreaderモードでも非表示
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - [Audit] 実ブラウザで章追加+モード切替の手動確認（visual evidence stale）
  - [Advance] 残りのGUI連携バグ修正（ユーザー報告の「基盤がガタガタ」の残存確認）
  - [Advance] Reader導線の最終磨き上げ
  - [Excise] 既知失敗テスト(B-1)の整理
