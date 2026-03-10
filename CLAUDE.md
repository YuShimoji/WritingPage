# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態:
  - JSライブラリのvendor/ローカル化完了 (Node.js/Electronオフライン対応)
  - ドキュメント整合性修正・レガシー一掃、HANDOVER.md 整備
  - Spec Wiki (spec-wiki.html) による仕様管理の導入
  - ROADMAP 再編成 (UI/UX 磨き上げを最優先 Priority A に設定)
  - 次: エディタスクロールバグ修正、フローティングパネルのドラッグ対応、コンテキストツールバー改善

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-09 | Spec Wiki (spec-wiki.html) 導入 | Wiki.js / Markdown / Standalone HTML | 1ファイルで完結し、ブラウザで即座に仕様を確認・管理できる軽量な仕組みを採用 |
| 2026-03-09 | 作業中断・端末引き継ぎ | N/A | 別環境での作業継続のため、CLAUDE.md を更新しリモートへ同期 |
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
