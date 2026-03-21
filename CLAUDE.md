# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態 (2026-03-21 session 11):
  - SP-074 Phase 4-6 実装完了 → done/100%
    - Phase 4: スクロール連動演出 (:::zw-scroll, 5エフェクト, IntersectionObserver)
    - Phase 5: SE基盤 (Web Audio API合成音5種, タイピング/スクロール連動)
    - Phase 6: ジャンルプリセット (ADV/Web小説/ホラー/ポエム, CSSテーマクラス)
  - SP-012 Visual Profile uiMode統合 → done/100%
  - 新規ファイル: ScrollTriggerController.js, SoundEffectController.js, GenrePresetRegistry.js
  - SP-061/SP-073 は別Workerに移譲済み
  - E2E: 未実行 (別Worker担当前提)
  - Lint: JS 0 errors (新規/変更ファイル全て)
  - 残 partial: SP-050(95%), SP-005(75%)

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-18 | DSL退避方式: markdown-it前にextract→処理後restore | unwrap方式 / DSL退避方式 / markdown-it-containerプラグイン | markdown-itが:::をpタグで囲みDSLパーサーが壊れる。プラグイン追加は依存増、unwrapは内容のpタグを救えない。退避が最も安全 |
| 2026-03-18 | reader-preview装飾パイプライン統合 | 素テキストのみ / editor-preview同等パイプライン追加 | SP-078 done/100%だが装飾が全て消えていた。テキストボックス/テクスチャ/wikilink/傍点/ルビの6段パイプラインをeditor-preview.jsと同等に追加 |
| 2026-03-18 | exportHtml()にテクスチャ@keyframes embed | 静止画縮退 / @keyframes embed | アニメーションを出力HTMLでも再現。prefers-reduced-motion対応あり |
| 2026-03-18 | SP-074 DslParserブロック型ディスパッチ: BLOCK_RE拡張方式 | BLOCK_RE拡張 / 型別パーサー新設 / レジストリ方式 | 小工数で後方互換。BLOCK_TYPES配列に型追加するだけで拡張可能。属性記法は既存key:"value"を維持 |
| 2026-03-18 | SP-050 AI生成はハイブリッド方式 (テンプレート+OpenAI) | テンプレートのみ / APIキー必須 / ハイブリッド / 保留 | オフライン対応 (Electron制約) を維持しつつ、APIキー設定時は高品質生成。コストはユーザー負担 |
| 2026-03-18 | SP-050 LLMプロバイダーはOpenAI (GPT-4o-mini) | OpenAI / Anthropic / Gemini / マルチプロバイダー | 安価 ($0.15/1M input)、日本語品質、広く使われている |
| 2026-03-17 | SP-078 読者プレビューを第4モード(reader)として新設 | 既存プレビュー拡張 / 別ウィンドウ / 第4モード | 執筆ワークフローの「出力/共有」空白を埋める基盤能力。既存SP-070モード拡張機構に乗る。Capability-first観点で最大の空白だった |
| 2026-03-17 | UI設計はマウス操作主体、ショートカットはフォールバック | マウス主体 / キーボード主体 / 両方均等 | ユーザーフィードバック。ショートカットは覚えてもらえない前提。操作に応じたUIフェードインが理想 |
| 2026-03-09 | Spec Wiki (spec-wiki.html) 導入 | Wiki.js / Markdown / Standalone HTML | 1ファイルで完結し、ブラウザで即座に仕様を確認・管理できる軽量な仕組みを採用 |
| 2026-03-09 | 作業中断・端末引き継ぎ | N/A | 別環境での作業継続のため、CLAUDE.md を更新しリモートへ同期 |
| 2026-03-08 | ROADMAP Priority A を UI/UX磨き上げに変更 | エクスポート / UI/UX / ガジェット整理 | ユーザーが実際の執筆ツールとして使用。エクスポートは重視しないと明言。操作感・未完成機能が優先 |
| 2026-03-08 | エクスポートは Priority D に格下げ | A→D | ブラウザ印刷で最低限のPDF出力は可能。実運用で不足を感じていない |
| 2026-03-08 | JSライブラリは常にローカル (CDN廃止) | CDN維持 / ローカルのみ / ハイブリッド | Electronオフライン対応が必須。ブラウザでもCDN障害リスクを排除 |
| 2026-03-08 | vendor/fonts/ はgitignore (JSはコミット) | 全コミット / fonts除外 / 全除外 | フォントは ~11MB で大きすぎる。npm postinstall で自動生成 |
| 2026-03-08 | shared-workflows完全除去 | 参照残す / 完全除去 | サブモジュール削除済み。残存参照は死リンクとなるため全除去 |
| 2026-03-09 | 執筆時の左サイドバーは常時「執筆集中IA」を既定にする | ON/OFFトグル常駐 / 既定集中IA | トグル重複と情報ノイズを減らし、執筆時の認知負荷を下げるため |
| 2026-03-09 | `+ 追加` は自然レベル挿入 (`新しい章` / `新しいシーン`) | 固定 `新しいセクション` / 文脈判定挿入 | 既存の部・章・節運用と整合し、手戻りを減らすため |
| 2026-03-09 | 章/シーン移動ショートカットを標準搭載 | ボタン操作のみ / キーボード併用 | 長編執筆での遷移コストを下げるため |
| 2026-03-09 | 下部ナビ同期はイベント連携を先行実装 | DOM直結 / イベント契約 | 下部ナビ実装段階の差を吸収しつつ双方向同期を成立させるため |
| 2026-03-10 | 文字表現は `RichText` / `TextEffect` / `Animation` / `Ornament` / `Preset` / `VisualProfile` に責務分離する方針を採用 | DOM/CSS中心管理 / preset中心管理 / 宣言的モデル分離 | WYSIWYG・テキストモード・印刷/エクスポート・reduced motion の全方位互換を保つため |
| 2026-03-10 | 文字表現は全面AST即移行ではなく、既存 `[tag]` / `:::zw-textbox` の上に parser/serializer 正規化層を置く段階移行を優先 | 即JSON AST保存 / 現行文字列維持 / 正規化層追加 | LocalStorage互換と既存E2Eを崩さず SSOT を導入するため |
| 2026-03-10 | Tier 1 の textbox preset は lower layer (`TextEffect` / `Animation` / `Ornament`) へ展開して投影する | presetを直接DOMへ焼き込む / lower layer展開 | 競合ルールと将来拡張を単純化し、preset を sugar として扱うため |
| 2026-03-10 | reduced motion の Tier 1 実装は animation drop と static styling 維持を優先 | 代替animation / 全停止 / drop | 実装コストを抑えつつ、可読性と安全な縮退を両立するため |
| 2026-03-11 | Canvas Mode (SP-056) を betaEnabled:false でデフォルトOFF | 4問題すべて修正 / Canvas OFFのみ / 調査のみ | Phase 1 (30%) 未完了で「PRIMARY NODE」等が意図せず表示される。完成度が上がるまで非公開が妥当 |
| 2026-03-12 | SP-052 Phase 2 は軽量コラプス方式を採用 | フル部分ロード(14-19日) / 軽量コラプス(1-2日) / 保留 / 仕様先行 | editor core改修不要で即効性がある。見出しツリーからセクション選択時に他セクションを折りたたむUI |
| 2026-03-12 | SP-052 Phase 2 コラプスUX: WYSIWYG主軸、先頭2段落+省略マーカー、ツリー選択で自動 | WYSIWYGのみ/両モード/textareaのみ, 見出し1行/2段落/3行/FocusDim風, 自動/手動/自動+手動 | WYSIWYGが実用モード。2段落でコンテキスト維持。ツリーが自然な起点 |
| 2026-03-12 | WYSIWYG を主軸、textarea はデバッグ用途と明確化 | WYSIWYG主軸 / 両立 / textarea主軸 | ユーザーが実際に使うのはWYSIWYGのみ。textareaはソース確認用 |
| 2026-03-13 | 下部ナビをステータスバーとしてeditor外に移動 | ステータスバー統合 / サイドバー内 / フローティング / 削除 | Editor内の表示を最小化しつつ機能を維持。コンパクトな下部固定が最適 |
| 2026-03-16 | ContentGuard共通モジュール導入 | 個別修正 / 共通化 / 保存アーキテクチャ再設計 | editor.value直参照がWYSIWYG時データ消失の原因。全ライフサイクル操作を統一APIに集約 |
| 2026-03-16 | ドラッグをpointer eventsに移行 | mousedown維持 / pointer events / 両方 | タッチデバイス対応+3px閾値で誤操作防止。setPointerCapture+documentフォールバックの二重方式 |
| 2026-03-18 | SP-072 Phase 5: data-style属性方式でゲームブック分岐スタイル指定 | data属性 / Markdown拡張構文 / クラス名直書き | WYSIWYG互換が最も高く、既存parseLinkStyle()をそのまま活用可能。URLフラグメント(#style=card)でMarkdown往復を保持 |
| 2026-03-18 | SP-072 Phase 5: 自動グループ化+区切り線方式 | 自動グループ+区切り線 / 自動グループ+背景 / グループ化しない | 読者に「ここは選択肢」と明示しつつ、テキスト小説の流れを壊さない最小限の視覚区切り |
| 2026-03-18 | SP-072 Phase 5: SP-062エフェクト転用は将来拡張に送る | 今は転用しない / data-effect属性で接続 | 3層CSSスタイルだけで十分な表現力。エフェクト統合はSP-062との結合度が上がるため、不足を感じてから再訪 |
| 2026-03-19 | SP-074 Phase 2 タイピング演出デフォルト速度: 30ms/字 | 30ms(速め) / 50ms(標準) / 80ms(遅め) / ユーザー必須指定 | テンポ良く読ませる。:::zw-typing の speed 属性で個別調整可能 |
| 2026-03-19 | SP-074 Phase 2 クリックモードUI: カーソル変化のみ | 下部バー+矢印 / カーソル変化のみ / 点滅テキストカーソル | 小説の流れを壊さない最小限のUI介入。cursor:pointer で「クリック可能」を示す |

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
