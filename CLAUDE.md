# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態 (2026-03-23 session 19):

- Session 19: ガジェット大整理 + レガシー仕様クリーンアップ
  - ガジェット33→27: Clock/Samples/NodeGraph/GraphicNovel削除、UIDesign/SceneGradient無効化
  - ロードアウト再構成: graphic-novelプリセット削除、全プリセットにMarkdownReference追加
  - gadgets-help.js刷新: ヘルプからリファレンス分離、アイコン除去、Wiki手順更新、セクション9→6
  - legacy仕様7件→全てremoved化 (SP-003/006/014/015/021/031/032/047)
- E2E: 要確認 (ガジェット削除後)
- Lint: 要確認
- 残 partial: SP-073(90%), SP-076(75%)
- 設計課題: Q1-Q4全解決。WP-002ガジェット整理完了

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
| 2026-03-23 | SP-079: chapterModeをデフォルトに変更 | デフォルト化 / オプトイン維持 | Legacy/chapterMode二重管理の混乱を解消。新規ドキュメントは全て章ごと独立保存 |
| 2026-03-23 | SP-079: 文字数カウントをcountPlainChars()に統一 | プレーンテキスト / ソース全体 | DSL構文・見出し記号・装飾記法を除外し、実際に書いた文字数を表示 |
| 2026-03-23 | Q1: 全DSL型にツールバー挿入UIを追加 | 全型UI / 主要型のみ / コマンドパレット統合 | DSL記法を知らなくても全演出が使える。装飾工程の最大摩擦を解消 |
| 2026-03-23 | Q2: ルビWYSIWYG双方向統合 | インラインポップアップ / モーダル / Markdown維持 | 選択→挿入/既存クリック→編集/削除。双方向性が核心要件 |
| 2026-03-23 | Q3: WYSIWYG演出静的プレビュー — 型バッジ+実スタイル | バッジ+実スタイル / 最小限インジケータ / Reader専用維持 | 執筆中に演出の見た目を確認でき、Reader往復が不要になる |
| 2026-03-23 | EPUB/DOCXをスコープ外に除外 | 除外 / 維持 | ブロッカーになっていた。HTML/TXT/MD/PDF(印刷)で出力は十分。いつ紛れ込んだか不明の投機的要件 |
| 2026-03-23 | 投機的要件16件をスコープ外に一括整理 | 除外 | 画像管理/Canvas/Google Keep/プラグイン正式化/サイドバーP2-3/WYSIWYGアニメ/長期ビジョン7件 |
| 2026-03-23 | Q4: サンプルは検証モック(B) | B:検証モック / A:テンプレート / C:チュートリアル / D:複合 | samples/は開発専用。アプリにバンドルしない。WP-003クローズ |
| 2026-03-23 | WP-002ガジェット整理実行: 33→27 | 段階削除 / 全削除 / 維持 | Clock(OS時計で十分)/Samples(dev)/NodeGraph(ニッチ)/GraphicNovel(ニッチ+6モジュール)を削除、UIDesign/SceneGradient(グラデーション)を無効化。graphic-novelロードアウト削除 |
| 2026-03-23 | MarkdownReferenceを全ロードアウトのassistに配置 | 配置 / 未配置維持 | 実装済みなのにどのロードアウトにも未配置で到達不能だった |
| 2026-03-23 | gadgets-help.jsからリファレンス機能を分離 | 分離 / 混在維持 | リファレンスはMarkdownReferenceガジェットが担当。ヘルプモーダルは操作ガイドに特化。Lucideアイコンも除去しシンプル化 |
| 2026-03-23 | legacy仕様7件を全てremovedに変更 | removed / legacy維持 | 全件「削除済み、他ドキュメントに統合」。legacy状態で放置する意味なし |

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
