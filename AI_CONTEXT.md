# AI_CONTEXT — 開発プロトコルと自律的再開のための前提情報

この文書は、エージェント/開発者が作業を中断/再開する際に必要な前提情報をコンパクトに提供します。

- 最終更新: 2025-10-09T13:32:00+09:00
- 現在のミッション: Mission 9: ガジェットE2Eテスト拡張
- ブランチ: feature/m9-e2e-gadgets
- 関連: Issue なし, PR 未作成
- 進捗: 80% / ステータス: コミット準備（E2E安定化済み）
- 次の中断可能点: PR 作成 → CI 成功 を確認した時点

## 決定事項

- 全プロジェクトで「複合ミッション・ワークフロー」と「CI 連携マージ」を採用
- リポジトリ直下で AI_CONTEXT.md を維持し、作業の区切りで更新
- E2E は Playwright を採用。`scripts/run-two-servers.js` を webServer で起動し、同一/クロスオリジンを自動検証する
- Mission 9 では sidebar の開閉とアニメーションをテスト中に制御する暫定措置を採用（将来 Issue 化してユーザー操作準拠へ改善）

## リポジトリ構成（中央ワークフロー採用）
- 共有リポジトリ: `YuShimoji/shared-workflows`
  - 目的: 再利用可能な GitHub Actions ワークフローを提供
  - 参照タグ: `v0.1.0`
  - 提供ワークフロー:
    - `.github/workflows/ci-smoke.yml`（workflow_call）
    - `.github/workflows/sync-issues.yml`（workflow_call）
- 本リポジトリ: `YuShimoji/WritingPage`
  - `.github/workflows/ci-smoke.yml` → 共有版を `uses: ...@v0.1.0` で呼び出すラッパー
  - `.github/workflows/sync-issues.yml` → 同上

## ブランチ戦略
- `main`: 安定ブランチ。PRは基本 Squash Merge。
- `develop`: 統合ブランチ。`feat/**`, `chore/**`, `docs/**`, `fix/**` からの集約。
- 命名規則: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`。

## CI/Sync 運用
- CI Smoke: push（`main`, `develop`, `feat/**`）、pull_request、workflow_dispatch で起動。
- Sync Issues: `docs/ISSUES.md` 変更で起動、または手動実行。
- 共有ワークフローは `secrets: inherit` で呼び出し。

## ローカル検証
- 開発サーバー: `node scripts/dev-server.js`（PORT 可変: `--port` / `-p` / `PORT`）
- 2ポート同時起動: `node scripts/run-two-servers.js`（8080/8081）
- スモークテスト: `node scripts/dev-check.js` → `ALL TESTS PASSED` を確認
- クロスオリジン検証手順: `docs/EMBED_TESTING.md`（v1.1 付録参照）

## 自律的再開プロトコル（チェックリスト）
1) 状況把握
   - `git status -sb` で未コミット/見慣れないブランチ有無を確認
   - ワークフローが共有版を参照しているか（`uses: YuShimoji/shared-workflows/...@v0.1.0`）
   - 共有リポジトリが参照可能か（`gh repo view YuShimoji/shared-workflows`）
2) 計画
   - 完了済みの作業はスキップし、未着手/未完了のタスクのみを実行
   - 変更は Issue 起票 → ブランチ作成 → 小さくコミット → PR → CI 確認 → マージ
   - 変更は必ずファイルを直接編集し、コマンドはローカルで実行
   - PR は `gh` で作成、Squash Merge を既定
4) セーフガード
   - コンフリクトや手動解決が必要な場合は即時停止し、状況/推奨解を報告

## 参考
  - テスト方針: `docs/TESTING.md`
  - 利用手順: `docs/USAGE.md`
  - 埋め込みSDK: `docs/EMBED_TESTING.md`

## リスク/懸念
- ルール適用の浸透（コントリビュータ周知）

## Backlog（将来提案）

- Mission 10: DocFX によるドキュメントサイト構築（DocFX導入・CIでビルド・GitHub Pages公開・API/仕様の自動生成）
- CONTRIBUTING.md に v1.1 へのリンク追加
- PR テンプレートに「中断可能点」欄を標準化
- dev-check に AI_CONTEXT.md の存在と最終更新日時の妥当性チェックを追加
