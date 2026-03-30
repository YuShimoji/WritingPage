# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール
直近の状態:
  - 最新の現在地は `docs/CURRENT_STATE.md` を正本とする
  - origin/main には session 34 の handoff が取り込まれており、Reader モード統合や SP-081 の後続修正が含まれる
  - このセッションでは、partial な執筆集中 sidebar が通常 UI を壊さないよう `focus` 限定化した
  - UI モード切替の周辺導線は `window.ZenWriterApp.setUIMode/getUIMode` を優先利用する
  - handoff 指示で想定される canonical docs (`docs/runtime-state.md`, `docs/project-context.md`, `docs/INVARIANTS.md` など) はこの repo には未作成

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
