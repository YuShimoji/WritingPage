# DEVELOPMENT_PROTOCOL — 開発プロトコル（中央ワークフロー運用）

本ドキュメントは、開発の流れと自律的再開プロトコルを明文化します。

## 1. ブランチ/コミット/PR
- ブランチ命名: `feat/*`, `fix/*`, `chore/*`, `docs/*`
- 作業単位を小さく、こまめなコミット（Husky/lint-staged 推奨）
- PR は GitHub CLI(gh) で作成し、基本 Squash Merge

## 2. CI/Sync の中央化
- 共有リポジトリ: `YuShimoji/shared-workflows`
## 3. ローカルワークフロー

- 開発サーバー: `node scripts/dev-server.js`（PORT 可変: `--port` / `-p` / `PORT`）
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
- 設定: `playwright.config.js`（`scripts/dev-server.js` を自動起動）
- テスト: `tests/e2e/gadgets.spec.js`

## 5. ドキュメント連携
- `AI_CONTEXT.md` に前提・参照先を集約
- `docs/EMBED_TESTING.md` にクロスオリジン検証手順（v1.1）
- `docs/USAGE.md` / `docs/TESTING.md` は随時更新
