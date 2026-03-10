# WritingPage

Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)。モジュラーガジェットシステム / JavaScript / Playwright E2E。

## PROJECT CONTEXT

プロジェクト名: Zen Writer (WritingPage)
環境: Node.js v22 / Playwright E2E / Electron v35
ブランチ戦略: trunk-based (main のみ)
現フェーズ: β (v0.3.29)
用途: 実用の小説執筆ツール (ポートフォリオではなく実際に使うツール)
直近の状態:
  - spec-index.json 全仕様横断スキャン完了: 9件のpct値をコード実態と照合して再校正 (9458e89)
  - GADGETS.md 30ガジェット同期完了: 全ガジェットのメタデータ表を実コードから生成 (746e5a6)
  - Canvas Mode (SP-056) を betaEnabled:false に変更: Phase 1 (30%) 未完了のためデフォルトOFF化 (5e14f96)
  - SP-053 執筆集中サイドバー: 10/10 AC確認、pct 85→95% 更新済み
  - ライブUI調査で4件の問題を特定: (1)Canvas表示→修正済み (2)Outline途切れ→未対応 (3)FocusMode重複→未対応 (4)Canvasズーム→未対応
  - SP-054 Phase 2 (フォント切り替え) は着手前に中断
  - 次: SP-054 Phase 2 / Outline CSS修正 / FocusMode固有機能の実装検討

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
| 2026-03-09 | 執筆時の左サイドバーは常時「執筆集中IA」を既定にする | ON/OFFトグル常駐 / 既定集中IA | トグル重複と情報ノイズを減らし、執筆時の認知負荷を下げるため |
| 2026-03-09 | `+ 追加` は自然レベル挿入 (`新しい章` / `新しいシーン`) | 固定 `新しいセクション` / 文脈判定挿入 | 既存の部・章・節運用と整合し、手戻りを減らすため |
| 2026-03-09 | 章/シーン移動ショートカットを標準搭載 | ボタン操作のみ / キーボード併用 | 長編執筆での遷移コストを下げるため |
| 2026-03-09 | 下部ナビ同期はイベント連携を先行実装 | DOM直結 / イベント契約 | 下部ナビ実装段階の差を吸収しつつ双方向同期を成立させるため |
| 2026-03-10 | 文字表現は `RichText` / `TextEffect` / `Animation` / `Ornament` / `Preset` / `VisualProfile` に責務分離する方針を採用 | DOM/CSS中心管理 / preset中心管理 / 宣言的モデル分離 | WYSIWYG・テキストモード・印刷/エクスポート・reduced motion の全方位互換を保つため |
| 2026-03-10 | 文字表現は全面AST即移行ではなく、既存 `[tag]` / `:::zw-textbox` の上に parser/serializer 正規化層を置く段階移行を優先 | 即JSON AST保存 / 現行文字列維持 / 正規化層追加 | LocalStorage互換と既存E2Eを崩さず SSOT を導入するため |
| 2026-03-10 | Tier 1 の textbox preset は lower layer (`TextEffect` / `Animation` / `Ornament`) へ展開して投影する | presetを直接DOMへ焼き込む / lower layer展開 | 競合ルールと将来拡張を単純化し、preset を sugar として扱うため |
| 2026-03-10 | reduced motion の Tier 1 実装は animation drop と static styling 維持を優先 | 代替animation / 全停止 / drop | 実装コストを抑えつつ、可読性と安全な縮退を両立するため |
| 2026-03-11 | Canvas Mode (SP-056) を betaEnabled:false でデフォルトOFF | 4問題すべて修正 / Canvas OFFのみ / 調査のみ | Phase 1 (30%) 未完了で「PRIMARY NODE」等が意図せず表示される。完成度が上がるまで非公開が妥当 |

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
