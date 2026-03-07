# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態:
  - CDNバンドル化完了 (JSライブラリをvendor/ローカル化、Electronオフライン対応)
  - ドキュメント整合性修正・レガシー一掃完了
  - ROADMAP再編成済み (UI/UX磨き上げ → Priority A)
  - 次: UI/UX改善に着手 or E2E flaky修正
  - 未確認: Electron動作確認 (cmd.exeから npm run electron:dev)

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-08 | ROADMAP Priority A を UI/UX磨き上げに変更 | エクスポート / UI/UX / ガジェット整理 | ユーザーが実際の執筆ツールとして使用。エクスポートは重視しないと明言。操作感・未完成機能が優先 |
| 2026-03-08 | エクスポートは Priority D に格下げ | A→D | ブラウザ印刷で最低限のPDF出力は可能。実運用で不足を感じていない |
| 2026-03-08 | JSライブラリは常にローカル (CDN廃止) | CDN維持 / ローカルのみ / ハイブリッド | Electronオフライン対応が必須。ブラウザでもCDN障害リスクを排除 |
| 2026-03-08 | vendor/fonts/ はgitignore (JSはコミット) | 全コミット / fonts除外 / 全除外 | フォントは ~11MB で大きすぎる。npm postinstall で自動生成 |
| 2026-03-08 | shared-workflows完全除去 | 参照残す / 完全除去 | サブモジュール削除済み。残存参照は死リンクとなるため全除去 |

## Key Paths

- JS Source: `js/` (モジュール: `js/modules/`)
- CSS: `css/style.css`
- Entry: `index.html`
- E2E Tests: `e2e/` (helpers: `e2e/helpers.js`)
- Docs: `docs/`

## Rules

- Respond in Japanese
- No emoji
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked
- Use Serena's symbolic tools (find_symbol, get_symbols_overview) instead of reading entire .ts files
- When exploring code, start with get_symbols_overview, then read only the specific symbols needed
- Keep responses concise — avoid repeating file contents back to the user
