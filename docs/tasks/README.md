# タスク管理インデックス

このディレクトリには個別タスク定義ファイル（`TASK_***.md`）が格納されています。

## タスクステータス定義

| ステータス | 意味 |
|-----------|------|
| OPEN | 未着手・着手可能 |
| IN_PROGRESS | 作業中 |
| BLOCKED | 外部依存等で停止中 |
| DONE / COMPLETED | 完了 |
| CLOSED | 完了または対応不要として終了 |

## オープンタスク一覧

| 優先度 | タスク | 内容 |
|--------|--------|------|
| P1 | TASK_053 | エディタスクロール不能の修正 |
| P1 | TASK_054 | フローティングパネルのドラッグ不可修正 |
| P1 | TASK_055 | WYSIWYG 即時プレビュー改善 |
| P1 | TASK_057 | サイドバー設計の見直し・簡素化 |
| P2 | TASK_056 | テキストアニメーション再生機能の修正 |
| Low | TASK_051 | プラグインシステム設計 |
| Low | TASK_052 | ガジェット API 型安全性 |

## 完了タスク

57件の完了済みタスクは `docs/archive/completed-tasks/` に格納。

## ロードマップ

-> `docs/ROADMAP.md`

## タスクの探し方

```bash
# OPEN タスクを検索
grep -rl "Status: OPEN" docs/tasks/

# 特定キーワードのタスクを検索
grep -rl "refactor" docs/tasks/

# 全タスクのステータス一覧
grep -rh "^Status:" docs/tasks/TASK_*.md
```

## タスクテンプレート

新規タスク作成時は以下のフォーマットを使用してください:

```markdown
# TASK_NNN: タスクタイトル

Status: OPEN
Priority: P1
Created: YYYY-MM-DD
Branch: feat/task-nnn-description

## 概要

タスクの目的と背景を簡潔に記述。

## 受け入れ条件（DoD）

- [ ] 条件1
- [ ] 条件2
- [ ] テストが通ること

## 影響範囲

- 変更対象ファイル
- 関連タスク/Issue

## テスト観点

- smoke テスト
- E2E テスト
- 手動確認項目
```

## ベストプラクティス

- **1タスク1ブランチ**: `feat/task-nnn-description` の命名規則
- **小さく分割**: 1タスクは1-2日で完了できる粒度に
- **DoD 明確化**: 受け入れ条件を事前に定義
- **テスト必須**: smoke / E2E で検証可能な条件を含める
- **ドキュメント同期**: タスク完了時に関連ドキュメントも更新

## 参照

- `docs/PROJECT_HEALTH.md` -- プロジェクト健全性レポート
- `docs/ROADMAP.md` -- 機能強化ロードマップ
- `docs/BACKLOG.md` -- バックログ
