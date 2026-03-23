# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 16 — SP-079 Step 1-4 実装完了 + Q1決定 (全DSL型にUI) + nightshift 18コミットマージ

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 430 passed / 1 failed (Canvas既知)
- spec-index: 54エントリ (active 47, SP-079追加)
- origin/main より 15+ コミット ahead (未push、GUI nightshift変更は未コミット)

---

## CURRENT DEVELOPMENT AXIS

- 主軸: UI/UX磨き上げ (Priority A の残り + サイドバー/ドック体験設計)
- この軸を優先する理由: 機能は80%揃っているが「どう使わせるか」の体験設計が空白。デザイナー向けパイプラインも未定義
- 今ここで避けるべき脱線: 新機能追加 (SP-075 Google Keep等)、Export再設計 (Priority D)

---

## CURRENT LANE

- 主レーン: Authoring / Experience Slice
- 副レーン: Acceptance / E2E
- 今このレーンを優先する理由: パイプライン定義草案完成 (WRITING_PIPELINE.md)。Q1-Q4 の設計判断を経て DSL挿入UI or ルビUI の実装に進む段階
- いまは深入りしないレーン: Runtime Core (ストレージ/モード基盤は安定)

---

## CURRENT SLICE

- スライス名: DSL挿入GUI実装 (Q1決定済み: 全DSL型にUI)
- ユーザー操作列: WYSIWYGモードで演出ブロック挿入ボタンを使い、typing/dialog/scroll/pathtextをGUIから追加
- 成功状態: 4種のDSLブロックがツールバーUIから挿入でき、DSL記法を知らなくても演出を適用できる
- このスライスで必要な基盤能力: editor-wysiwyg.js のブロック挿入API、DSLパーサーとの往復
- このスライスから抽出されるツール要求: DSL挿入GUI (装飾工程の最大摩擦解消)
- 今回はやらないこと: SP-076 Phase 2 (タブグループ)、SP-073 Phase 2、Export再設計

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。手動/自動境界、デザイナーワークフローパス(A/B/C)、未解決設計課題(Q1-Q4)を含む
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - デザイナー向けパイプライン: WRITING_PIPELINE.md で草案定義済み。未解決設計課題 Q1-Q4 のユーザー判断が必要
  - 左サイドバーの到達点 (SP-076 Phase 2-4 の体験ゴール)
  - ガジェット整理方針 (33個をどうグループ化/優先表示するか)

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
|----|----------|------|----------|--------------|
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold | Experience Slice | サイドバー/ドック表示品質スライス完了後 |
| WP-002 | ガジェット整理 (33個→カテゴリ再編) | hold | UI | SP-076 Phase 2 タブグループ着手時 |
| WP-003 | デザイナーパイプライン仕様策定 | partial | Authoring | WRITING_PIPELINE.md 草案完成。Q1-Q4 のユーザー判断で完了 |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Experience Slice / Authoring
- 現在のスライス: SP-079 実装完了 → 次スライス選択待ち
- 今回 (session 16) の変更:
  - js/storage.js: createDocument() に chapterMode:true 追加
  - js/app-file-manager.js: chapterMode初期化 + Legacy変換バナー
  - js/chapter-store.js: revertChapterMode() 追加
  - js/chapter-list.js: countPlainChars() + 解除ボタン + 文字数統一
  - js/modules/editor/EditorUI.js: _countPlainChars() + ステータスバー統一
  - css/style.css: Legacy変換バナー + 解除ボタン CSS
  - e2e/chapter-list.spec.js, chapter-store.spec.js, chapter-ux-issues.spec.js: forceLegacyModeヘルパー + テスト修正
  - docs/worker-prompts/: 3件新設 (A-4 rem, SP-076 Phase 2-3, SP-073 Phase 2)
  - nightshift sessions 11-15 (18コミット) マージ統合
- E2E: 430 passed / 3 skipped
- 次回最初に確認すべきファイル: docs/WRITING_PIPELINE.md (Q2-Q4 未解決設計課題)
- 未確定の設計論点: Q2(ルビ挿入UI形態) / Q3(WYSIWYG演出プレビュー) / Q4(サンプル位置づけ) / 左サイドバー到達点 / ガジェット整理方針
- 今は触らない範囲: SP-076 Phase 2+, SP-073 Phase 2, Export再設計, SP-075 Google Keep
