# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 17 — Q3決定 + WYSIWYG演出静的プレビュー + バグ修正2件

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 507 passed / 8 failed (既知) / 3 skipped
- spec-index: 54エントリ (active 47)
- Q1/Q2/Q3 全解決済み。残: Q4(サンプル位置づけ)

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

- スライス名: WYSIWYG演出静的プレビュー (Q3決定+実装完了)
- ユーザー操作列: WYSIWYGモードでDSLブロック(typing/dialog/scroll)が型バッジ+実スタイルで表示される。スクロールブロックもeditor-preview内で可視。
- 成功状態: 執筆中にReaderモードに切り替えなくても演出の見た目が確認できる
- このスライスで必要な基盤能力: CSS ::before 擬似要素バッジ, スクロールブロック opacity上書き
- このスライスから抽出されたバグ修正: zw-scroll-trigger→zw-scroll統一, dialog data-*属性追加
- 次スライス候補: doc debt一掃 / SP-076 Phase 4 / EPUB出力 / 全機能スクリーンショット撮影

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
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold | Experience Slice | サイドバー/ドック表示品質スライス完了後 |
| WP-002 | ガジェット整理 (33個→カテゴリ再編) | hold | UI | SP-076 Phase 2 タブグループ着手時 |
| WP-003 | デザイナーパイプライン仕様策定 | partial | Authoring | WRITING_PIPELINE.md 草案完成。Q1-Q4 のユーザー判断で完了 |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Experience Slice / Authoring
- 現在のスライス: Q3実装完了 → 次スライス選択待ち
- 今回 (session 17) の変更:
  - css/style.css: WYSIWYG DSLブロック静的プレビュー (型バッジ+スクロール可視化)
  - js/modules/editor/TextboxEffectRenderer.js: dialog data-*属性追加 (round-trip修正)
  - js/modules/editor/TextboxRichTextBridge.js: .zw-scroll-trigger→.zw-scroll
  - js/editor-wysiwyg.js: scroll block class統一
  - e2e/wysiwyg-dsl-preview.spec.js: 新規7件
  - e2e/typing-effect.spec.js: scroll class + slide-in→slide-up 修正
  - e2e/dsl-insertion-gui.spec.js: scroll class修正
  - docs/WRITING_PIPELINE.md: Q1/Q2/Q3解決反映, 機能差マトリクス更新
  - docs/specs/spec-web-novel-effects.md: scroll class修正
- E2E: 507 passed / 8 failed (既知) / 3 skipped
- 次回最初に確認すべきファイル: docs/spec-index.json (DSL GUI/Ruby/Q3のエントリ追加)
- 未確定の設計論点: Q4(サンプル位置づけ) / 左サイドバー到達点 / ガジェット整理方針
- 今は触らない範囲: SP-073 Phase 4, Export再設計, SP-075 Google Keep
