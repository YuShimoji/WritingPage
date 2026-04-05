# Project Context

## RECENT NOTE (2026-04-06, session 44)

- Focus グロー初期可視化: ベースライン opacity 0.15 (Focus進入時即表示)
- Focus グローフラッシュ: 初回2回限定で opacity 0.4 → 2秒後にベースラインへフェード (localStorage永続)
- フラッシュ中 mousemove 上書き防止ガード追加
- dismissGlows を display:none → opacity:'0' に変更 (mousemove でベースライン復帰可能に)
- エッジホバー active 中はグロー opacity:0 に抑制
- APP_SPECIFICATION.md 数値修正 (E2E 64→62, CSS 9→4, spec 54→56)
- docs/issues/ 空ディレクトリ削除
- BL-001〜BL-006 全解決確認、USER_REQUEST_LEDGER 解決済みに移動
- E2E: 531 total / 62 spec files

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: session 43 — デッドコード削除 + Canvas完全削除 + HeadingStyles登録

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 531 total / 62 spec files (session 44)
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
| WP-001 | 執筆ワークフロー統合仕様 → **UI磨き上げ・摩擦軽減** | **着手中** (session 34~) | Experience Slice | session 43 でデッドコード削除 + Canvas完全削除。次スライス: ユーザー要望待ち |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |
| WP-004 | Reader-First WYSIWYG (書く画面=読む画面) | **着手中** (session 43~) | Architecture | Phase 1: WYSIWYGエフェクト即時適用。Phase 2: デフォルトモード切替。Phase 3: Reader統合 |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance (WP-001 UI磨き上げ・摩擦軽減)
- 現在のスライス: Focus グロー初期可視化 + フラッシュヒント + docs数値同期 完了
- 今回 (session 44) の変更:
  - Focus グロー初期可視化 (ベースライン opacity 0.15)
  - Focus グローフラッシュ (初回2回限定、localStorage永続)
  - フラッシュ中 mousemove 干渉防止
  - APP_SPECIFICATION.md / ROADMAP.md 数値修正
  - docs/issues/ 空ディレクトリ削除
  - BL-001〜BL-006 全解決確認、USER_REQUEST_LEDGER 更新
- 暗黙仕様:
  - chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
  - 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
  - setUIMode が全モード切替の単一入口。直接 setAttribute は禁止
  - hidden ui-mode-select は完全削除済み。コマンドパレットは mode-switch-btn.click() 経由
  - サイドバー開閉は toggleSidebar() → s.sidebarOpen に永続化。setUIMode Normal復帰時に復元
  - エッジグローはFocusモードのみ。進入時にベースライン0.15で即表示。初回2回フラッシュ(localStorage永続)
  - フローティングツールバーはreaderモードでも非表示
  - WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー経由
- 今は触らない範囲: 新規大型機能、OAuth、Electron配布
- 次回推奨:
  - ユーザー要望に基づく次スライス選定
  - [Docs] canonical docs 補完 (FEATURE_REGISTRY / AUTOMATION_BOUNDARY)
  - deferred 手動確認 5件の消化 (BL-002/BL-004 体感, Reader/Focus 体感, グローフラッシュ体感)

## DECISION LOG ADDENDUM (2026-04-02)

- WYSIWYG フローティングツールバーのボタン数削減方針: 使用頻度の低い縦書き/テキストエディタ切替をオーバーフローメニューに移動。B/I/U/S/Link/Ruby/Kenten/Heading/List/Quote は常時表示を維持
- 既存の wysiwyg-dropdown パターンを再利用し、Documents ガジェットの独自 overflow 実装ではなくツールバー内統一パターンを採用
