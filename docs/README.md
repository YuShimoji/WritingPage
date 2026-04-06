# docs/ -- Zen Writer ドキュメント目次

v0.3.32 / 2026-04-06

## はじめに

| ドキュメント | 内容 |
|-------------|------|
| [CURRENT_STATE](CURRENT_STATE.md) | 現在地の正本。直近修正・検証結果・次の優先課題 |
| [PROJECT_HEALTH](PROJECT_HEALTH.md) | 健全性サマリ。主要リスクと次の確認ポイント |
| [APP_SPECIFICATION](APP_SPECIFICATION.md) | アプリ仕様書（機能一覧・技術仕様・制限事項） |
| [APP_LAUNCH_GUIDE](APP_LAUNCH_GUIDE.md) | 起動手順書（Web/Electron/PWA） |

注記:

- `docs/spec-index.json` は historical entry を含む。missing file があっても直ちに異常ではない
- 最新の再開文脈は `CURRENT_STATE.md` と `../HANDOVER.md` を優先する

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
| [USER_REQUEST_LEDGER](USER_REQUEST_LEDGER.md) | 次スライス候補・deferred・**スライス完了時チェックリスト** |
| [WP004_PHASE3_PARITY_AUDIT](WP004_PHASE3_PARITY_AUDIT.md) | WP-004: MD プレビューと Reader の整合監査 |
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
| [ROADMAP](ROADMAP.md) | ロードマップ（Priority A-D の開発計画） |
| [../HANDOVER](../HANDOVER.md) | 再開手順・参照順 |
| [../CLAUDE](../CLAUDE.md) | AI向け再開コンテキスト |

## インフラ

| ドキュメント | 内容 |
|-------------|------|
| [docfx_overview](docfx_overview.md) | DocFX ドキュメントサイト構成 |

## 仕様インデックス

- [spec-index.json](spec-index.json) -- 仕様書の status / pct / path の一覧
- 実在しないファイルを指す entry は、過去の運用履歴が残っている可能性がある
