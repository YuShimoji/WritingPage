# DEVELOPMENT_PROTOCOL — 開発プロトコル（中央ワークフロー運用）

本ドキュメントは、開発の流れと自律的再開プロトコルを明文化します。

- ブランチ命名: `feat/*`, `fix/*`, `chore/*`, `docs/*`
- 作業単位を小さく、こまめなコミット（Husky/lint-staged 推奨）
- PR は GitHub CLI(gh) で作成し、基本 Squash Merge

## 2. CI/Sync の中央化
- 共有リポジトリ: `YuShimoji/shared-workflows`

#### CI 連携

- `.github/workflows/e2e.yml` にて PR/push で自動実行
  - 高速化: `actions/setup-node` の npm キャッシュ + `actions/cache` による Playwright ブラウザキャッシュ（`~/.cache/ms-playwright`）
  - 可視化: PR 時は `playwright-report/` を GitHub Pages に自動公開（ログにプレビュー URL を出力）
- 中央ワークフロー（CI Smoke）は `.github/workflows/ci-smoke.yml` で呼び出し
（PORT 可変: `--port` / `-p` / `PORT`）
- 2ポート同時起動: `node scripts/run-two-servers.js`（8080/8081）
- スモークテスト: `node scripts/dev-check.js` → `ALL TESTS PASSED` を確認
- クロスオリジン検証手順: `docs/EMBED_TESTING.md`（v1.1 付録参照）

### E2E テスト（Playwright）

- 目的: ブラウザ上の実操作（クリック/ドラッグ/ダウンロード/ファイル選択）を自動検証
- セットアップ（初回のみ）
  - `npm install`
  - `npx playwright install`
- 実行
  - ヘッドレス: `npm run e2e`
  - 画面表示: `npm run e2e:headed`
  - 特定テストのみ: `npx playwright test -g "<name>"`
  - 1ワーカー・詳細: `npx playwright test --workers=1 --reporter=line`
- 設定: `playwright.config.js`（`scripts/dev-server.js` を自動起動、既定ポートは 8099）
- レポート: 失敗時の `trace`/`screenshot`/`video` を保持（`playwright-report/` / `test-results/`）
- テストファイル
  - `tests/e2e/gadgets.spec.js`（ガジェット: 折りたたみ/並び替えフォールバック/入出力）
  - `tests/e2e/ui.spec.js`（HUD/テーマ/スナップショット）
  - 備考: DnD はヘッドレス環境で不安定なため、「上へ」ボタンのフォールバックを実装

## 5. ドキュメント連携
- `AI_CONTEXT.md` に前提・参照先を集約
- `docs/EMBED_TESTING.md` にクロスオリジン検証手順（v1.1）
- `docs/USAGE.md` / `docs/TESTING.md` は随時更新
