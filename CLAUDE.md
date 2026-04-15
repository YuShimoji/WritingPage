# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.32)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.32)
用途: 実用の小説執筆ツール
直近の状態:
  - 事実関係の起点は `docs/CURRENT_STATE.md`（Snapshot・**ドキュメント地図**・検証結果）。不変条件は `docs/INVARIANTS.md`
  - UI モード切替は `window.ZenWriterApp.setUIMode/getUIMode` を優先
  - カウンター `docs/runtime-state.md`、背景メモ `docs/project-context.md`

## DECISION LOG

> 2026-03-16以前の決定事項は `docs/archive/decision-log-archive.md` に退避済み。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-30 | 執筆集中サイドバーは `focus` モード時のみ有効 | 常時既定 / focus 限定 | partial 実装が通常 UI を壊していたため、既存 UX を守りつつ機能を継続するため |
| 2026-03-30 | UI モード切替は `ZenWriterApp` API を優先する | hidden `select` 直接操作 / API 集約 | コマンドパレットと周辺導線の状態不整合を減らすため |
| 2026-03-30 | Reader モード統合後も handoff の正本は `docs/CURRENT_STATE.md` に集約 | 会話依存 / repo 内正本 | 次セッションで再質問を減らすため |
| 2026-03-30 | WP-001最初のスライス: Readerモードスイッチ統合 | Reader統合 / hidden要素削除 / 両方 | Normal/Focus/Reader の一貫したモード導線を作るため |
| 2026-03-30 | WP-001方向性: UI磨き上げ・摩擦軽減 | UI磨き上げ / 実用上の不足補完 / ユーザー指定 | パイプライン成熟後は日常利用時の摩擦削減が主価値になるため |
| 2026-03-29 | SP-081: chapterModeを唯一の章管理方式に一本化 | chapterMode一本化 / 二重管理維持 | 章管理の二重系統がバグ源だったため |
| 2026-03-29 | SP-081: フローティングツールバーの状態管理を `data-visible` 属性に統一 | data-visible属性のみ / JSプロパティ併用 | モード切替時の不整合を減らすため |
| 2026-04-01 | E2Eテストの beforeEach で `ensureNormalMode` を標準化 | 個別対応 / ヘルパー統一 | slim モード + viewport 外問題で42件が一斉に落ちたため、全テストで Normal モード保証を共通化 |
| 2026-04-01 | `page.click('#toggle-sidebar')` を `openSidebar()` (evaluate経由) に統一 | page.click / evaluate / force:true | viewport 外要素への Playwright click がエラーになるため |
| 2026-04-02 | WYSIWYG TB: 縦書き/テキストエディタ切替をオーバーフローメニューに移動 | 全ボタン維持 / overflow移動 / 完全削除 | 使用頻度が低く折り返しの原因。既存 wysiwyg-dropdown パターンを再利用 |
| 2026-04-01 | `enableAllGadgets` / `disableWritingFocus` で `data-sidebar-slim` を解除 | slim 維持 / テスト時解除 | slim モードではガジェット chrome が非表示で detach ボタン等のテストが不可能なため |
| 2026-04-15 | WP-005: 分割ビュー edit-preview モードを廃止し MD プレビューをリッチプレビュー化 | edit-preview 維持 / リッチプレビュー化 / 両方廃止 | edit-preview は MD プレビューと重複。分割ビューの名称から「プレビュー」を切り離し、比較ツールとして隔離する |
| 2026-04-15 | WP-005: 比較ツール (chapter-compare / snapshot-diff) を独立導線に | 分割ビュー統合維持 / 隔離 | 「分割ビュー」の名前がファイル比較を想起させ、プレビューと混同しやすいため。将来的に別ファイル比較も可能にする |
| 2026-04-15 | E2E テスト増加抑制: 廃止機能テスト 52 件削除で 0 failed 回復 | 書き直して維持 / 積極削除 | テスト過剰によるメンテコストが高く、廃止機能のテストは信頼性を下げるだけ |

## Key Paths

- JS Source: `js/` (モジュール: `js/modules/`)
- CSS: `css/style.css`
- Entry: `index.html`
- E2E Tests: `e2e/` (helpers: `e2e/helpers.js`)
- Docs: `docs/`
- Current state: `docs/CURRENT_STATE.md`
- Health snapshot: `docs/PROJECT_HEALTH.md`

## Rules

- Respond in Japanese
- No emoji
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked
- Keep responses concise
