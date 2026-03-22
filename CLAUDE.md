# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態 (2026-03-23 session 15 nightshift):

- Session 15: docs債務解消 + 健全性確認
  - ROADMAP.md E2E数値修正 (418→430)
  - CLAUDE.md E2E数値不整合修正
  - spec-index.json 整合性監査: 54エントリ全て整合
  - project-context.md HANDOFF SNAPSHOT 更新
- E2E: 430 passed / 1 failed (Canvas Mode既知) -- 実測確認済み
- Lint: ALL PASSED
- 残 partial: SP-073(40%), SP-076(25%)
- origin/mainより15コミットahead (未push)。未コミット変更あり (session 14-15)
- 未解決設計課題: Q1(DSL挿入UI範囲) / Q2(ルビ挿入UI形態) / Q3(WYSIWYG演出プレビュー) / Q4(サンプル位置づけ)

## DECISION LOG

> 2026-03-16以前の決定事項は `docs/archive/decision-log-archive.md` に退避済み。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-17 | SP-078 読者プレビューを第4モード(reader)として新設 | 既存プレビュー拡張 / 別ウィンドウ / 第4モード | 執筆ワークフローの「出力/共有」空白を埋める基盤能力。既存SP-070モード拡張機構に乗る。Capability-first観点で最大の空白だった |
| 2026-03-17 | UI設計はマウス操作主体、ショートカットはフォールバック | マウス主体 / キーボード主体 / 両方均等 | ユーザーフィードバック。ショートカットは覚えてもらえない前提。操作に応じたUIフェードインが理想 |
| 2026-03-18 | DSL退避方式: markdown-it前にextract→処理後restore | unwrap方式 / DSL退避方式 / markdown-it-containerプラグイン | markdown-itが:::をpタグで囲みDSLパーサーが壊れる。退避が最も安全 |
| 2026-03-18 | reader-preview装飾パイプライン統合 | 素テキストのみ / editor-preview同等パイプライン追加 | SP-078 done/100%だが装飾が全て消えていた。6段パイプラインをeditor-preview.jsと同等に追加 |
| 2026-03-18 | exportHtml()にテクスチャ@keyframes embed | 静止画縮退 / @keyframes embed | アニメーションを出力HTMLでも再現。prefers-reduced-motion対応あり |
| 2026-03-18 | SP-074 DslParserブロック型ディスパッチ: BLOCK_RE拡張方式 | BLOCK_RE拡張 / 型別パーサー新設 / レジストリ方式 | 小工数で後方互換。BLOCK_TYPES配列に型追加するだけで拡張可能 |
| 2026-03-18 | SP-050 AI生成はハイブリッド方式 (テンプレート+OpenAI) | テンプレートのみ / APIキー必須 / ハイブリッド / 保留 | オフライン対応を維持しつつ、APIキー設定時は高品質生成 |
| 2026-03-18 | SP-050 LLMプロバイダーはOpenAI (GPT-4o-mini) | OpenAI / Anthropic / Gemini / マルチプロバイダー | 安価、日本語品質、広く使われている |
| 2026-03-18 | SP-072 Phase 5: data-style属性方式でゲームブック分岐スタイル指定 | data属性 / Markdown拡張構文 / クラス名直書き | WYSIWYG互換が最も高い。URLフラグメント(#style=card)でMarkdown往復を保持 |
| 2026-03-18 | SP-072 Phase 5: 自動グループ化+区切り線方式 | 自動グループ+区切り線 / 自動グループ+背景 / グループ化しない | テキスト小説の流れを壊さない最小限の視覚区切り |
| 2026-03-18 | SP-072 Phase 5: SP-062エフェクト転用は将来拡張に送る | 今は転用しない / data-effect属性で接続 | 3層CSSスタイルだけで十分。不足を感じてから再訪 |
| 2026-03-19 | SP-074 Phase 2 タイピング演出デフォルト速度: 30ms/字 | 30ms / 50ms / 80ms / ユーザー必須指定 | テンポ良く読ませる。speed属性で個別調整可能 |
| 2026-03-19 | SP-074 Phase 2 クリックモードUI: カーソル変化のみ | 下部バー+矢印 / カーソル変化のみ / 点滅テキストカーソル | 小説の流れを壊さない最小限のUI介入 |

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
