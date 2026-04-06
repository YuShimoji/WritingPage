# Project Context

## RECENT NOTE (2026-04-06, session 46)

- 上部ツールバー・エッジグローの挙動をユーザー確認済み（安定）
- エッジグロー: CSS クラス方式 (--near / --flash)、近接 200px、`js/edge-hover.js` + `css/style.css`
- Focus ツールバー: `position: fixed`、上端エッジ表示中は `.editor-container` に `padding-top: var(--toolbar-height)`（`app.js` の ResizeObserver 同期と整合）
- Focus 閉じたサイドバー: ビューポート左縁での影・境界の漏れ抑制（非オーバーレイ時）
- E2E: `e2e/toolbar-editor-geometry.spec.js` で Normal・狭幅・Focus+上端の幾何を検証
- canonical: `docs/FEATURE_REGISTRY.md` / `docs/AUTOMATION_BOUNDARY.md` テンプレート追加
- 段落ブロック揃え仕様: `docs/specs/spec-rich-text-paragraph-alignment.md`（実装は別スライス）
- session 46: `convertForExport` が `chapter-link--broken` を置換できない不具合を修正。パイプライン差分を E2E 化。コマンドパレットのモード切替後フォーカスを Reader/執筆面で分岐。FEATURE_REGISTRY に FR-001〜005 登録。

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: session 45 — Focus レイアウト安定化 + ツールバー/グロー確認済み

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: spec ファイル 64 本（`e2e/*.spec.js` 集計、session 45）
- spec-index: 56エントリ (done 44, removed 11, superseded 1)
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

- スライス名: Focus/ツールバー/グロー安定化 + geometry E2E（session 45）
- 次スライス候補: `docs/ROADMAP.md` の「次スライス候補 (WP-004 / WP-001)」および `USER_REQUEST_LEDGER.md`

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - WP-001 の次スライスはユーザー要望トリガー。WP-004 は ROADMAP の候補から 1 トピック選定

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 → **UI磨き上げ・摩擦軽減** | **着手中** (session 34~) | Experience Slice | session 43 でデッドコード削除 + Canvas完全削除。次スライス: ユーザー要望待ち |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |
| WP-004 | Reader-First WYSIWYG (書く画面=読む画面) | **着手中** | Architecture | Phase 1: 済。Phase 2: 復帰/フォーカス/ポリシー明文化済（INTERACTION_NOTES）。Phase 3: wikilink等HTML共通化済、typography 等は継続 |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance (WP-001 UI磨き上げ + WP-004 Reader-First WYSIWYG)
- 現在のスライス: Focus レイアウト + ツールバー/グロー安定化 + geometry E2E + canonical テンプレ
- 今回 (session 45) の変更（コミットに含める想定）:
  - Focus 閉じたサイドバーの左端漏れ抑制（影・境界）
  - Focus 上端エッジ時の `.editor-container` 上余白（`--toolbar-height`）
  - `e2e/toolbar-editor-geometry.spec.js`
  - `docs/specs/spec-rich-text-paragraph-alignment.md` / `spec-mode-architecture.md` 追記
  - `docs/FEATURE_REGISTRY.md` / `docs/AUTOMATION_BOUNDARY.md` テンプレート
  - ROADMAP / USER_REQUEST_LEDGER に次スライス候補を明記
- session 44 以前のコミット済み資産（参照）: Wiki-Editor-Reader、グローフラッシュ、WP-004 Phase 1、BL 全解決 等
- 設計経緯 (グロー刷新):
  - 当初: ベースライン opacity 0.15 + mousemove で連続的 opacity 計算
  - 問題: (1) ダークテーマ上で視認困難 (2) CSS transition 0.3s と毎フレーム style 上書きが干渉し不安定 (3) 上部/左部の検知範囲が非対称 (120px/80px) で挙動が不統一 (4) dismissGlows→hideEdge後にグロー残留
  - 最終形: CSS クラス切替 (--near/--flash) に一本化。JS は近接判定のみ。検知範囲 200px 統一
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
  - setUIMode が全モード切替の単一入口。直接 setAttribute は禁止
  - hidden ui-mode-select は完全削除済み。コマンドパレットは mode-switch-btn.click() 経由
  - サイドバー開閉は toggleSidebar() → s.sidebarOpen に永続化。setUIMode Normal復帰時に復元
  - エッジグローはFocusモードのみ。CSS クラス方式: --near (近接 0.5) / --flash (フラッシュ 0.4)。JS は style.opacity を直接操作しない
  - swiki-open-entry イベントは entryId と title の両方を受付 (title→entryId 自動変換)
  - Reader モードの wikilink クリックはポップオーバー表示 (サイドバーは開かない)
  - `[[` 入力補完は Normal モードのみ (Focus ではテキスト排除原則に準拠し非表示)
  - WYSIWYG でアニメーション/テクスチャが即時適用 (WP-004 Phase 1)
  - フローティングツールバーはreaderモードでも非表示
  - WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー経由
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - ROADMAP の次スライス候補から 1 件選び実装
  - deferred 手動確認は障害報告があれば優先
  - FEATURE_REGISTRY / AUTOMATION_BOUNDARY を機能追加時に追記

## DECISION LOG ADDENDUM (2026-04-02)

- WYSIWYG フローティングツールバーのボタン数削減方針: 使用頻度の低い縦書き/テキストエディタ切替をオーバーフローメニューに移動。B/I/U/S/Link/Ruby/Kenten/Heading/List/Quote は常時表示を維持
- 既存の wysiwyg-dropdown パターンを再利用し、Documents ガジェットの独自 overflow 実装ではなくツールバー内統一パターンを採用
