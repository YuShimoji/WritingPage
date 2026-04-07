# Automation Boundary（自動化の境界）

Playwright E2E・単体テスト・手動検証の**責務分界**を明示する。ここに書かない暗黙知を減らし、CI と手動の二重稼働を避ける。

## 原則

| レイヤ | 役割 | ツール |
|--------|------|--------|
| E2E | 主要ユーザーフロー・回帰・レイアウトの安定性（ヘッドレス可能な範囲） | Playwright (`e2e/`) |
| 単体 | 純粋関数・モジュール境界の振る舞い | `node --test` (`test/`) |
| 手動 | タイポグラフィ体感、テーマの細部、複雑なマルチウィンドウ、オフライン前提 | チェックリストまたは `docs/VERIFICATION_CHECKLIST.md` |

## E2E でカバーする（例）

- モード切替・サイドバー開閉（`ensureNormalMode` / `openSidebar` パターン）
- エディタ入力・章操作・Reader 遷移のスモーク
- 幾何・レイアウトの回帰（`toolbar-editor-geometry.spec.js`）
- エディタ／UI 設定ガジェットの永続化（`editor-settings.spec.js`。session 60 以降、`effectPersistDecorAcrossNewline` と `effectBreakAtNewline` の UI トグルを含む）
- Reader と WYSIWYG の混同防止、`ZWPostMarkdownHtmlPipeline` の preview/reader 差分（`reader-wysiwyg-distinction.spec.js`）。中に **複数見出し+chapter://（パイプライン層）/ 存在しない Wiki の wikilink（`is-broken`）/ zw-textbox（最小および preset+tilt+anim+italic 複合）/ zw-typing / zw-dialog + ルビ / P2 の `data-zw-align`（パイプライン残存と MD プレビュー・Reader 本文の `text-align` 投影）** 等の監査シナリオを順次追加。WP-004 Phase 3 もこの spec をガードレールとし、差分修正は **1 件ずつ** マージする運用とする。手動で追うシナリオ一覧は [`docs/WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md)
- Reader ジャンルプリセットの **クラス付与**（`GenrePresetRegistry`）の浅い回帰は [`e2e/reader-genre-preset.spec.js`](e2e/reader-genre-preset.spec.js)（見た目のピクセル比較は手動）
- Reader 内 **壊れ wikilink** クリック時の **Story Wiki 未登録ポップオーバー**（表示・外クリックで閉じる）は [`e2e/reader-wikilink-popover.spec.js`](e2e/reader-wikilink-popover.spec.js)
- **章末ナビ**の **Reader 本文への注入**（`chapterNav.enabled`・複数章 chapterMode・`.chapter-nav-bar`）の結合 smoke は [`e2e/reader-chapter-nav.spec.js`](e2e/reader-chapter-nav.spec.js)（ナビクリックの手応え・長大原稿は手動）
- リッチテキスト P2 の段落揃え（アダプタ・sanitize・Turndown の最小回帰）は [`e2e/rich-text-block-align.spec.js`](e2e/rich-text-block-align.spec.js)
- コマンドパレットからの UI モード切替後フォーカス（`command-palette.spec.js`）

## 手動に残す（例）

- 初回体験の「好み」に依存する視認性
- OS / GPU / フォントレンダリング差に敏感な見た目
- 長時間執筆の疲労・快適性
- WYSIWYG カスタム Undo の境界（Space / Enter / blur / IME 確定での区切り、連続入力バッチとのバランス）は **手動確認**（session 62。E2E は `none`、[`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) FR-007）
- タイプライター ON 時の **上余白付与**（短文でアンカーに寄せるため）は [`e2e/wysiwyg-editor.spec.js`](e2e/wysiwyg-editor.spec.js) でインライン `paddingTop` の有無を検証（session 63）。**実際のアンカー位置の体感**は手動（[`docs/FEATURE_REGISTRY.md`](FEATURE_REGISTRY.md) FR-008）

## CI とローカル

- `playwright.config.js` の `webServer` と `reuseExistingServer` の差により、ローカルでは既存サーバを再利用することがある。失敗時は `npx playwright test` をクリーンな状態で再実行する。

## 関連

- `docs/FEATURE_REGISTRY.md`
- `docs/CURRENT_STATE.md`（検証結果セクション）
- `e2e/helpers.js`（共通ヘルパー）
