# Project Context

## RECENT NOTE (2026-04-03, session 42)

- BL-001〜BL-006 実装完了 + デグレ修正
- BL-002: 改行で書式効果切断 (effectBreakAtNewline, デフォルトON)
- BL-003: 適用中エフェクト表示 (書式インジケータ + aria-pressed 同期)
- BL-004: Focus hover を半透明スライドイン (opacity 0.35→hover 1.0)
- BL-005: ドキュメント一括選択・削除 (チェックボックス + overflow メニュー)
- BL-006: Wiki ハイライト DOM 変更による input 再発火ループ防止
- fix: ロードアウトプリセットの仮想グループ名修正 (StoryWiki 表示問題解消)
- fix: Wiki 自動検出の保存時トリガー完全無効化
- E2E: 508 passed / 0 failed / 5 skipped

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: session 42 — BL-001〜BL-006 完了 + デグレ修正

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 508 passed / 0 failed / 5 skipped (session 42)
- spec-index: 55エントリ (done 44, partial 0, removed 11, superseded 1)
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

- 主レーン: Advance (WP-001 UI磨き上げ・摩擦軽減)
- 候補: ユーザー要望待ち (session 40 で hidden要素削除 + TB整理が完了)
- いまは深入りしないレーン: 追加テスト、新規ガジェット

---

## CURRENT SLICE

- スライス名: 次スライス選定中 (session 40 で WYSIWYG TB最適化 + 装飾グループ/Canvas Mode 削除が完了)
- 次スライス候補: ユーザー要望に基づく方向決定待ち

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - WP-001 の次スライス方向 (ユーザー要望待ち)

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 → **UI磨き上げ・摩擦軽減** | **着手中** (session 34~) | Experience Slice | session 42 で BL-001〜BL-006 完了。次スライス: ユーザー要望待ち |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance (WP-001 UI磨き上げ・摩擦軽減)
- 現在のスライス: BL-001〜BL-006 完了。次スライス選定中
- 今回 (session 40) の変更:
  - WYSIWYG フローティングツールバー: 13→11ボタン + overflow メニュー
  - 縦書きトグル + テキストエディタ切替を `[...]` オーバーフローメニューに移動
  - E2E 6ファイルの switchToTextarea を共通ヘルパーに統一
  - Visual Audit スクリーンショット 11枚更新
- 解決済みの設計論点:
  - 装飾グループ + Canvas Mode: session 40 で完全削除済み
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
  - setUIMode が全モード切替の単一入口。直接 setAttribute は禁止
  - hidden ui-mode-select は完全削除済み。コマンドパレットは mode-switch-btn.click() 経由
  - サイドバー開閉は toggleSidebar() → s.sidebarOpen に永続化。setUIMode Normal復帰時に復元
  - エッジグローはFocusモードのみ
  - フローティングツールバーはreaderモードでも非表示
  - WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー経由
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - ユーザー要望に基づく次スライス選定
  - [Docs] canonical docs 補完 (FEATURE_REGISTRY / AUTOMATION_BOUNDARY)

## DECISION LOG ADDENDUM (2026-04-02)

- WYSIWYG フローティングツールバーのボタン数削減方針: 使用頻度の低い縦書き/テキストエディタ切替をオーバーフローメニューに移動。B/I/U/S/Link/Ruby/Kenten/Heading/List/Quote は常時表示を維持
- 既存の wysiwyg-dropdown パターンを再利用し、Documents ガジェットの独自 overflow 実装ではなくツールバー内統一パターンを採用
