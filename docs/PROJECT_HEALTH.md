# PROJECT_HEALTH — プロジェクト健全性レポート

最終更新: 2026-02-09

## 総合ステータス

| 指標 | 値 |
|------|-----|
| バージョン | 0.3.24 |
| 実装完了率 | 93%（54タスク中48完了） |
| OPEN タスク | 7件 |
| Smoke テスト | ✅ PASSED |
| E2E テスト | ✅ 46 passed |
| Lint | ⚠️ エラー残存 |
| 技術的負債 | 中（app.js 1981行が最大課題） |

## 未解決課題（優先度別）

### P0: セキュリティ

| ID | 内容 | 状態 |
|----|------|------|
| P0-1 | Embed SDK の origin 検証正規化 | ✅ DONE（TASK_039, TASK_001_embed_sdk） |

- `sameOrigin` は `computedOrigin` から自動判定済み（手動設定依存を解消）
- `child-bridge.js` は `embed_origin` パラメータ + `document.referrer` フォールバックで origin 検証
- `targetOrigin` 必須化により cross-origin 時の検証も強化済み

### P1: ドキュメント整合性

| ID | 内容 | 状態 |
|----|------|------|
| P1-1 | 設定ハブ（DESIGN_HUB）の扱い明確化 | ✅ DONE（既に「提案・未実装」と明記済み） |
| P1-2 | Wiki 制限事項の SSOT 化 | ✅ DONE（GADGETS.md で SSOT 参照に整理済み） |
| P1-3 | KNOWN_ISSUES.md バージョン表記整合 | ✅ DONE（0.3.24 との対応を明確化） |
| P1-4 | GADGETS.md 現行/提案混在解消 | DONE（TASK_040） |
| P1-5 | smoke/dev-check 期待値整合 | DONE（TASK_049） |

### P2: 技術的負債

| ID | 内容 | 状態 |
|----|------|------|
| P2-1 | app.js リファクタリング（2072→462行） | ✅ DONE（TASK_047 Phase 3 完了、77.7% 削減） |
| P2-2 | プラグインシステム設計 | OPEN（TASK_051） |
| P2-3 | OpenSpec 未完了 change のトリアージ | 一部完了（TASK_050） |
| P2-4 | ガジェット API 型安全性 | OPEN（TASK_052） |

## 伸びしろ（将来機能）

### アーキテクチャ改善

- **app.js リファクタリング**（TASK_047）: HUD/ショートカット/初期化の分離。1981行 → 500行以下目標
- **editor.js**: 分割済み（189行）。EditorCore/EditorUI/EditorSearch を `js/modules/editor/` に抽出完了

### UI/UX 拡張

- **柔軟なタブ配置**（TASK_045）: 上下左右への配置
- **汎用フローティングパネル**（TASK_048）: 任意ガジェットの切り離し
- **グラフィックノベル ルビテキスト**（TASK_054）

### 長期ビジョン

- プラグインシステム（TASK_051）: ユーザー定義ガジェット
- ガジェット API 型安全性（TASK_052）

## 品質指標

### テストカバレッジ

| テスト種別 | 状態 | カバー範囲 |
|-----------|------|-----------|
| Smoke（dev-check.js） | ✅ | UI構造、API存在、ドキュメント200、バージョン整合 |
| E2E（Playwright） | ✅ 46件 | ガジェット操作、HUD、テーマ、スナップショット |
| Lint（ESLint） | ⚠️ | JS コード品質 |
| Markdown Lint | ⚠️ | ドキュメント品質 |

### コード品質メトリクス

| ファイル | 行数 | 状態 |
|----------|------|------|
| `js/app.js` | 462 | ✅ Phase 3 分割完了（2072→462行、77.7% 削減） |
| `js/gadgets-core.js` | 584 | ⚠️ やや大きい |
| `js/gadgets-builtin.js` | 528 | ⚠️ やや大きい |
| `index.html` | 526 | ✅ 適正 |
| `js/panels.js` | 490 | ✅ 適正 |
| `js/embed/zen-writer-embed.js` | 308 | ✅ 適正 |
| `js/editor.js` | 189 | ✅ 分割済み |

## 推奨アクション

### 即座に着手可能（高優先度）

1. **TASK_047: app.js リファクタリング** — 1981行の巨大ファイルを分割。HUD管理、ショートカット、初期化ロジックを個別モジュールに抽出
2. **P0-1: Embed SDK origin 検証** — セキュリティ課題。`sameOrigin` の自動判定実装
3. **P1 ドキュメント整合** — DESIGN_HUB/Wiki制限/KNOWN_ISSUES の整理

### 中期（計画的に）

4. **TASK_045: 柔軟なタブ配置** — UI拡張
5. **TASK_048: 汎用フローティングパネル** — ガジェット切り離し
6. **TASK_054: グラフィックノベル ルビテキスト**

### 長期

7. **TASK_051: プラグインシステム設計**
8. **TASK_052: ガジェット API 型安全性**

## 参照

- `docs/tasks/README.md` — タスク管理インデックス
- `docs/AUDIT_TASK_BREAKDOWN.md` — 監査SSOT（詳細分析）
- `docs/BACKLOG.md` — バックログ
- `docs/KNOWN_ISSUES.md` — 既知の問題
- `HANDOVER.md` — 作業申し送り
- `AI_CONTEXT.md` — AI再開用コンテキスト
