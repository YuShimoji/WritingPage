# DEVELOPMENT_PROTOCOL — 開発プロトコル（中央ワークフロー運用）

本ドキュメントは、開発の流れと自律的再開プロトコルを明文化します。

## 1. ブランチ/コミット/PR

- ブランチ命名: `feat/*`, `fix/*`, `chore/*`, `docs/*`
- 作業単位を小さく、こまめなコミット（Husky/lint-staged 推奨）
- PR は GitHub CLI(gh) で作成し、基本 Squash Merge

## 2. CI/Sync の中央化

- 共有リポジトリ: `YuShimoji/shared-workflows`
  - 参照タグ: `v0.1.0`
  - `.github/workflows/ci-smoke.yml` / `.github/workflows/sync-issues.yml` を `uses: ...@v0.1.0` で呼び出し
- 本リポジトリのトリガー
  - CI Smoke: push(main/develop/feat/\*\*), pull_request, workflow_dispatch
  - Sync Issues: `docs/ISSUES.md` 変更または workflow_dispatch

### E2E テスト（Playwright）

- 目的: ブラウザ上の実操作（クリック/ドラッグ/ダウンロード/ファイル選択）を自動検証
- セットアップ: `npm install` → `npx playwright install`
- 実行: `npm run test:e2e:ci`（ヘッドレス）/ `npx playwright test --headed`（画面表示）
- 設定: `playwright.config.js`（`scripts/dev-server.js` を自動起動、既定ポート 8099）
- レポート: 失敗時の `trace`/`screenshot`/`video` を `playwright-report/` / `test-results/` に保持

## 3. ローカルワークフロー

- 開発サーバー: `node scripts/dev-server.js`（PORT 可変: `--port`/`-p`/`PORT`）
- 2ポート起動: `node scripts/run-two-servers.js`（8080/8081）
- スモーク: `node scripts/dev-check.js` → ALL TESTS PASSED が合格
- クロスオリジン検証: `docs/EMBED_TESTING.md`（v1.1 付録参照）

## 4. 自律的再開プロトコル

1. 状況把握
   - `git status -sb` / `gh run list` / ワークフロー参照先を確認
2. 計画
   - 完了済みをスキップし、未完のみ実行
3. 実行
   - 変更はツールで直接編集、コマンドは必ず実行
4. セーフガード
   - 手動解決が必要な衝突時は停止し、Issue/PR に状況と推奨を記載

## 5. ドキュメント連携

- `AI_CONTEXT.md` に前提・参照先を集約
- `docs/EMBED_TESTING.md` にクロスオリジン検証手順（v1.1）
- `docs/USAGE.md` / `docs/TESTING.md` は随時更新
