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
- Reader と WYSIWYG の混同防止、`ZWPostMarkdownHtmlPipeline` の preview/reader 差分（`reader-wysiwyg-distinction.spec.js`）。WP-004 Phase 3 もこの spec をガードレールとし、差分修正は **1 件ずつ** マージする運用とする
- コマンドパレットからの UI モード切替後フォーカス（`command-palette.spec.js`）

## 手動に残す（例）

- 初回体験の「好み」に依存する視認性
- OS / GPU / フォントレンダリング差に敏感な見た目
- 長時間執筆の疲労・快適性

## CI とローカル

- `playwright.config.js` の `webServer` と `reuseExistingServer` の差により、ローカルでは既存サーバを再利用することがある。失敗時は `npx playwright test` をクリーンな状態で再実行する。

## 関連

- `docs/FEATURE_REGISTRY.md`
- `docs/CURRENT_STATE.md`（検証結果セクション）
- `e2e/helpers.js`（共通ヘルパー）
