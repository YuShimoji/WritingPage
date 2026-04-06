# Project Context

## RECENT NOTE (2026-04-06, session 52)

- 開発プランの実装: `WP004_PHASE3_PARITY_AUDIT.md`（preview/Reader 監査）、`spec-textbox-render-targets.md`（`target` は現状未分岐）、`USER_REQUEST_LEDGER` に deferred コード確認メモとスライス完了チェックリスト、段落揃え P2 の推奨スライス順（`spec-rich-text-paragraph-alignment`）と richtext へのポインタ
- E2E: `reader-wysiwyg-distinction` に最小 `:::zw-textbox` の preview=reader 同一 HTML を追加（8 本）
- 正本: `docs/CURRENT_STATE.md` session 52、用語・WP-004 は `docs/INTERACTION_NOTES.md`
- E2E spec ファイル数: 64（`e2e/*.spec.js` 集計）

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: session 52 — WP-004 監査台帳・運用チェックリスト・P2 スライス順の文書化 + E2E 1 本

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: spec ファイル 64 本（`e2e/*.spec.js` 集計、session 52）
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

- スライス名: 次着手候補の実行準備（session 51）。直前の実装スライスは geometry / パイプライン / a11y 等（session 45〜50）
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
- 現在のスライス: session 51 で台帳・ROADMAP を次トピック選定向けに更新済み。実装の最新は `CURRENT_STATE` の session 45〜50 表を参照
- session 51 の主なドキュメント変更:
  - `USER_REQUEST_LEDGER`: deferred 項目の簡易再現手順
  - `ROADMAP`: 次スライス候補の表記整備
- 参照資産（コミット済み）: geometry E2E、reader-wysiwyg-distinction、コマンドパレットフォーカス分岐、Reader a11y、パイプライン（ルビ等）、FEATURE_REGISTRY / AUTOMATION_BOUNDARY、Wiki ワークフロー、WP-004 Phase 1 等
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
