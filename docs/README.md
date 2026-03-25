# docs/ -- Zen Writer ドキュメント目次

v0.3.29 / 2026-03-16

---

## 文書役割の定義

### 分類

| 分類 | 役割 | SSOT（唯一の真の情報源） | 書くべきもの | 書かないもの |
|------|------|:--:|------|------|
| **現行仕様** | 今のアプリが何であるかの記述 | 実装コード | 実装済み機能の正確な記述 | 将来予定、設計探索 |
| **将来計画** | 何を作る予定かの記述 | ROADMAP.md | 優先度付きの開発計画 | 実装済み機能の詳細 |
| **個別仕様** | 1機能の設計と受入条件 | docs/specs/spec-*.md | 設計判断・受入基準・実装メモ | 他機能の仕様、一般ガイド |
| **実装ガイド** | 開発作業の進め方 | 各ガイド文書 | 手順・規約・制約 | 現行機能の網羅的説明 |
| **設計探索** | 実装前の設計ドラフト | docs/design/*.md | 代替案・トレードオフ | 確定仕様（specに昇格すること） |

### 実装変更時の更新対象

| 変更の種類 | 必ず更新 | 必要に応じて更新 |
|-----------|---------|----------------|
| 新機能追加 | APP_SPECIFICATION.md, spec-index.json | ROADMAP.md（ステータス更新）, GADGETS.md（ガジェット追加時） |
| UI構成変更 | APP_SPECIFICATION.md | README.md（キーボードショートカット等） |
| ガジェット追加/削除 | GADGETS.md, APP_SPECIFICATION.md（数値） | spec-index.json |
| テーマ変更 | THEMES.md | — |
| テスト追加 | — | TESTING.md（方針変更時のみ） |
| バグ修正 | — | ISSUES.md（該当issueがあれば） |
| 仕様策定 | docs/specs/spec-*.md, spec-index.json | ROADMAP.md |

### 原則

1. **実装コードが唯一の真**: ドキュメント同士の相互参照だけで整合性を判断しない
2. **将来予定は ROADMAP.md に集約**: APP_SPECIFICATION.md に「今後の予定」を書かない
3. **設計と仕様を分離**: `docs/design/` は探索的。確定したら `docs/specs/` に昇格する
4. **文書を増やすより重複を減らす**: 同じ情報を複数箇所に書かない

---

## はじめに

| ドキュメント | 内容 |
|-------------|------|
| [APP_SPECIFICATION](APP_SPECIFICATION.md) | アプリ仕様書（機能一覧・技術仕様・制限事項） |
| [APP_LAUNCH_GUIDE](APP_LAUNCH_GUIDE.md) | 起動手順書（Web/Electron/PWA） |

## アーキテクチャ・設計

| ドキュメント | 内容 |
|-------------|------|
| [ARCHITECTURE](ARCHITECTURE.md) | 技術アーキテクチャ（ファイル構成・設計原則・概念モデル） |
| [GADGETS](GADGETS.md) | ガジェットシステム仕様（28個の登録ガジェット一覧） |
| [THEMES](THEMES.md) | テーマ仕様（CSS変数・プリセット・UI/Editor配色分離） |
| [VISUAL_PROFILE](VISUAL_PROFILE.md) | ビジュアルプロファイル仕様（見た目プリセット） |
| [EDITOR_EXTENSIONS](EDITOR_EXTENSIONS.md) | 装飾/挿入UI・選択ツールチップ仕様 |
| [EMBED_SDK](EMBED_SDK.md) | 埋め込みSDK仕様（クロスオリジン対応） |
| [EDITOR_HELP](EDITOR_HELP.md) | エディタヘルプコンテンツ（アプリ内ヘルプ定義） |

## 開発ガイド

| ドキュメント | 内容 |
|-------------|------|
| [CODING_STANDARDS](CODING_STANDARDS.md) | コーディング規約 |
| [TESTING](TESTING.md) | テスト方針・E2Eテストガイド |
| [PLUGIN_GUIDE](PLUGIN_GUIDE.md) | プラグイン開発ガイド（API・manifest形式） |
| [TROUBLESHOOTING](TROUBLESHOOTING.md) | トラブルシューティング集 |
| [BRANCHING](BRANCHING.md) | ブランチ運用ルール |
| [RELEASE](RELEASE.md) | リリース手順 |
| [DEPLOY](DEPLOY.md) | デプロイ手順（GitHub Pages等） |
| [LABELS](LABELS.md) | Issue/PRラベル定義 |

## プロジェクト管理

| ドキュメント | 内容 |
|-------------|------|
| [ROADMAP](ROADMAP.md) | ロードマップ（Priority A-E の開発計画） |
| [ISSUES](ISSUES.md) | 検証棚卸しからのアクションリスト |
| [spec-index.json](spec-index.json) | 仕様インデックス（全エントリのステータス・実装率） |

## アーカイブ (archive/)

過去のドキュメントは `archive/` 配下に保管:

- BACKLOG.md, ISSUES.md -- 旧管理系
- choices-driven-development.md -- 旧開発方針メモ
- LIVE_PREVIEW_DIFF_DESIGN.md, PALETTE_DESIGN.md, MISSION12_GADGETS.md -- 旧設計ドラフト
- screenshots/ -- 過去のスクリーンショット
