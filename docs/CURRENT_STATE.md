# Current State

最終更新: 2026-04-27（canonical doc hardening / stale plan-checklist downgraded）

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| ブランチ | `main`。既存の統合シェル UI 作業ツリー差分は保持し、本ドキュメント整理は docs cleanup として追加 |
| 現在の主軸 | **統合シェル UI**: 常設ミニレール + `root/category` 左階層ナビ、明示操作時だけ出る `top chrome`、再生オーバーレイを中心に公開 UI を整理する |
| 直近の実装スライス | session 129: Left nav category/icon mapping fix。Lucide が `<i>` を `<svg>` に置換した後も、category anchor の `label` / `icon` / `panelId` / gadget loadout が active category と一致するよう固定 |
| 最新ビルド・検証 | session 129 作業ツリーで `dist/` と `build/win-unpacked/Zen Writer.exe` を再生成済み。`lint:js:check`、`ui-mode-consistency` 29 passed、指定 3 spec 52 passed、`build`、`electron:build`、sentinel、`app:open` が green |
| 隔離サイドクエスト | 浮遊メモ実験 v2.1。dev-only / experimental overlay。既存 editor data model / autosave 契約には接続しない |
| 今回の docs cleanup | stale restart magnets の削除に加え、旧 UI / 旧 planning / 旧 checklist の正本主張を降格。実行コードには触れない |

## Latest Handoff

- Shared focus: session 127〜129 の unified shell foundation と left nav category/icon mapping を、現行判断の起点にする。
- Trusted: Story Wiki / Link Graph / Compare の shell token 寄せ、gadget collapse 契約、left nav label/icon/panel/gadget 対応、package safe launcher。
- Needs user/manual: packaged / Electron 上の top chrome hidden seam・drag lane・left nav root→category→root の体感確認。
- Do not reopen: 旧 mode button 群、常用 top toolbar、上端 hover reveal、legacy handoff/runtime/health 文書。

## Restart Route

1. このファイルの **Snapshot**、**Latest Handoff**、**Document Map** を読む。
2. 挙動の境界は `docs/INVARIANTS.md`、UI 用語と手動確認形式は `docs/INTERACTION_NOTES.md` を読む。
3. 次スライスを選ぶときだけ `docs/USER_REQUEST_LEDGER.md` と `docs/ROADMAP.md` を読む。

## Document Map

| 読みたいもの | ファイル |
|-------------|----------|
| 現在地・直近検証・再開方向 | `docs/CURRENT_STATE.md` |
| 不変条件・責務境界・テスト作法 | `docs/INVARIANTS.md` |
| UI 状態モデル・手動確認・報告形式 | `docs/INTERACTION_NOTES.md` |
| 現在有効な要求・次スライス候補 | `docs/USER_REQUEST_LEDGER.md` |
| 機能ロードマップ | `docs/ROADMAP.md` |
| ユーザー向け機能台帳 | `docs/FEATURE_REGISTRY.md` |
| 自動化責務境界 | `docs/AUTOMATION_BOUNDARY.md` |
| 起動手順 | `docs/APP_LAUNCH_GUIDE.md` |
| UI 表面・コントロール台帳 | `docs/UI_SURFACE_AND_CONTROLS.md` |
| WP-004 手動パック・監査 | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

削除済みの旧再開・健康・カウンター文書は再開判断に使わない。

## Verification Results

### session 129

- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line --grep "session 129"` → 2 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js --workers=1 --reporter=line` → 29 passed
- `npx playwright test e2e/ui-mode-consistency.spec.js e2e/accessibility.spec.js e2e/command-palette.spec.js --workers=1 --reporter=line` → 52 passed
- `npm run lint:js:check` → pass
- `npm run build` → pass
- `npm run electron:build` → pass after stopping stale packaged process that held DLL locks
- sentinel check / `npm run app:open` → green

### canonical doc cleanup

- `git diff --check` → pass
- `docs/spec-index.json` JSON parse → pass
- `docs/spec-index.json` の `status: done` かつ missing file entry → none
- active docs の stale restart refs scan → none
- active docs の stale UI wording scan → none

### docs hygiene hardening

- `RECOMMENDED_DEVELOPMENT_PLAN.md` → superseded / historical planning stub。現在の作業選定に使わない
- `VERIFICATION_CHECKLIST.md` → superseded / historical checklist stub。現在の受け入れ確認に使わない
- `MANUAL_TEST_GUIDE.md` / `EDITOR_HELP.md` / `GADGETS.md` / `ARCHITECTURE.md` / `spec-sections-navigation.md` を統合シェル UI 語彙へ同期
- `git diff --check` → pass（Git が既存 `e2e/ui-mode-consistency.spec.js` の CRLF/LF warning を表示）
- `docs/spec-index.json` JSON parse → pass
- active docs の blocking stale UI wording scan → none（superseded stub / history / explicit “復活させない” 文脈は除外）

## Current Priorities

| 優先 | テーマ | 内容 | Actor |
|------|--------|------|-------|
| A | Unified shell closeout | packaged / Electron 上の top chrome・left nav・shell menu 体感確認。FAIL 時は該当 surface のみ narrow に直す | user / shared |
| B | Docs hygiene | 正本は `CURRENT_STATE` 起点。古い再開・健康・カウンター文書を復活させない | assistant |
| C | WP-004 Phase 3 | 新規差分が出たときだけ台帳・手動パックに沿って 1 トピックで扱う | shared |
| D | Floating memo lab | 隔離 overlay のまま。editor / chapter / autosave 本流へ接続しない | assistant |

## Known Notes

- `docs/spec-index.json` の `status: removed` は、参照先ファイルが存在しないことがある。現行仕様の探索は `done` / `partial` を優先する。
- `docs/spec-index.json` の `status: done` は「現行判断の入口」と同義ではない。summary の current pointer と各 doc 冒頭の Status を確認する。
- `RECOMMENDED_DEVELOPMENT_PLAN.md` と `VERIFICATION_CHECKLIST.md` は historical stub。再開・次作業・受け入れ確認の正本に戻さない。
- セッション変更ログや古い検証ログは履歴参照に限る。現在判断へ持ち込まない。
- 仕様変更・方向転換・暗黙決定は、同一ブロックで役割に合う正本文書へ同期する。
