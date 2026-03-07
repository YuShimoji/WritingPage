# Zen Writer — ミニマル&スタイリッシュな物語スタジオ

Zen Writer は、ミニマルな操作体験とスタイリッシュなレイアウトで小説・ビジュアルノベル執筆を支援する Web アプリケーションです。サーバー不要・オフライン対応を維持しつつ、ドラッグ&ドロップ画像やフローティング装飾ツールバーなど視覚的な編集体験を段階的に拡張していきます。

## ビジョン

- グラフィックノベルを含むリッチな物語制作を、単一ページで完結できる軽量エディターへ発展させる
- 埋め込み用途（アドベンチャーゲーム向け内蔵エディター等）でも安全かつ疎結合に動作する SDK を提供する
- 左サイドバーを「ガジェット」単位で組み替え可能にし、作者ごとの作業スタイルに合わせて機能を選択できるようにする

## 現状の主要機能（2026-03）

### エディタ機能

- シンプルな `textarea` ベースのエディタとブラウザ LocalStorage による自動保存
- 文字数・語数カウンタと折りたたみ可能なサイドバー/ツールバー
- テキスト/Markdown のインポート・エクスポート、印刷用レイアウト（UI 非表示）
- フローティングツール（⚙️）による全体フォントサイズ調整、アウトラインテンプレート

### テーマ・UI

- **モダンダークモードがデフォルト**（VS Code/Notion風の洗練された配色）
- ワンクリックでライト/ダーク切り替え、スムーズなアニメーション効果
- カラーピッカーによるカスタマイズ、フォント種別・サイズ・行間の調整
- テーマ設定の自動保存（LocalStorage）

### ドキュメント管理

- **階層的ドキュメントツリーUI**（Scrivener/Obsidian風）
- **全文検索機能**（複数ドキュメント横断、正規表現対応、検索履歴）
- 複数ドキュメント管理、ドラッグ&ドロップで並び替え

### ガジェットシステム

- ガジェットパネル（時計、目標設定、Pomodoroタイマーなど）の並び替え・折りたたみ・設定保存
- モジュラー設計による拡張可能なアーキテクチャ
- ベータ版 Embed SDK（`docs/EMBED_SDK.md`）による `iframe` 埋め込みサポート

## 開発中・優先課題（2025-10 現在版、OpenSpec `ui-future-enhancements` 参照）

- ドラッグ&ドロップした画像の位置調整・サイズ変更・コラージュレイアウト
- 選択範囲に追従するフローティング装飾ツールバーとアニメーション対応テキストスタイル
- ガジェットのモジュール化とサイドバー構成のプリセット管理（章一覧、フォント切替、AI サマリ等）
- 埋め込み先からの双方向通信強化（クロスオリジン安全性、外部ワークフロー連携）
- インタラクティブ要素（シーン分岐、ビューワーモード切替）の設計と UI プロトタイピング

### UI将来強化計画（段階導入、詳細: `openspec/changes/ui-future-enhancements/`）

- **ツリーペイン・フォルダ構造**: ガジェットを階層化・拡張可能レジストリ連携
- **Markdown対応**: Typoraライクなライブプレビュー、ショートカット、インライン画像互換
- **タイプライターモード**: カーソル高さ固定・改行時の張り付き強度調整（最小実装済）
- **オートセーブ/スナップショット強化**: 閾値/間隔設定、復元UI（最小実装済）
- **画像インタラクティブ機能**: VN用途向けプリセット＋詳細パラメータ編集
- **自由なパネルレイアウト**: Obsidian風のドッキング/分割
- **コンテンツ間リンク**: テキスト/画像ともにリンク移動可能
- **低優先: 背景ビジュアル拡張（画像/グラデ/スクロール連動/ランダム化）** ※ダークモード基本機能は実装済み

### 記載漏れの将来拡張アイデア

- **フォーカスモード**: 現在行以外を減光/ぼかし（集中支援、タイプライターモードと併用）
- **コマンドパレット**: ショートカットと合わせて操作の可視化（検索/置換/ガジェット操作を横断）
- **Wikilinks/バックリンク/グラフ**: `[[link]]` 構文や `doc://` の可視化・相互参照グラフ
- **分割ビュー**: 編集/プレビュー、章間比較、スナップショット差分
- **タグ/スマートフォルダ**: ツリーペインにタグ軸、保存された検索、仮想フォルダ
- **Pomodoro/集中タイマー**: HUD連携のセッション管理
- **アクセシビリティ**: 高コントラスト、フォント可変、スクリーンリーダー対応
- **キーバインド編集**: ショートカットの再割当
- **ポータブル書き出し**: ワークスペース（文書＋アセット＋設定）をZip化
- **画像フィルタ/レイヤ**: ぼかし/色相/彩度/セピア/合成などの調整を数値で管理

## Setup & Run (開発・動作確認手順)

ビルドから通常のアプリを起動して実動作確認を行うための手順です。

### 1. 依存関係のインストール

プロジェクトを初めて利用する場合や、パッケージが更新された場合に実行してください。

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
# 推奨: npmスクリプトを使用
npm run dev

# または直接スクリプトを実行
node scripts/dev-server.js

# Windows環境でバッチファイルを使用する場合
start-server.bat をダブルクリック
```

サーバー起動後、ブラウザで **`http://localhost:8080`** にアクセスしてください。

### 3. テストの実行

動作確認の自動検証には以下のコマンドを使用します。

```bash
# スモークテスト（重要なUI要素の存在確認）
npm run test:smoke

# E2Eテスト（Playwrightを使用したUI操作の自動検証）
npm run test:e2e

# 特定のテストのみ実行（例: サイドバー）
npx playwright test e2e/sidebar-layout.spec.js
```

### 4. 直接ファイルアクセス（オフライン時）

1. このフォルダの `index.html` をブラウザで直接開く。
2. 入力内容は LocalStorage に保存されます。

**注意**: `file://` プロトコルによる直接アクセスでは、一部の機能（画像アセット管理や一部のクロスオリジン通信テストなど）がブラウザのセキュリティ制限により動作しない場合があります。完全な機能確認には **`npm run dev`** によるサーバー起動を推奨します。

## キーボードショートカット

- 保存: `Ctrl + S` / `Cmd + S`
- インデント: `Tab`
- フルスクリーン切替: ツールバー右端の ⛶ アイコン
- フォントサイズ拡大: `Ctrl/Cmd + +` または `Ctrl/Cmd + =`
- フォントサイズ縮小: `Ctrl/Cmd + -`
- フォントサイズ初期化: `Ctrl/Cmd + 0`
- ツールバー表示/非表示: `Alt + W`

## データ保存

- 入力内容は LocalStorage に自動保存されます。
- ブラウザや端末をまたいだ同期は行いません（設計上の単純性を優先）。

## エクスポート

- サイドバー「ドキュメント」から `.txt` / `.md` として保存可能です。
- 「印刷」ボタンで印刷ダイアログを開きます（本文のみを印刷）。

## ファイル構成

```text
WritingPage/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  ├─ app-editor-bridge.js
│  ├─ editor.js
│  ├─ editor-search.js
│  ├─ editor-preview.js
│  ├─ editor-overlays.js
│  ├─ editor-images.js
│  ├─ outline.js
│  ├─ storage.js
│  ├─ theme-registry.js
│  ├─ theme.js
│  ├─ themes-advanced.js
│  ├─ sidebar-manager.js
│  ├─ element-manager.js
│  ├─ ui-labels.js
│  ├─ icons.js
│  ├─ panels.js
│  ├─ search-manager.js
│  ├─ settings-manager.js
│  ├─ loadouts-presets.js
│  ├─ gadgets-utils.js
│  ├─ gadgets-loadouts.js
│  ├─ gadgets-core.js
│  ├─ gadgets-builtin.js
│  ├─ gadgets-init.js
│  ├─ gadgets-*.js
│  ├─ plugins/
│  │  ├─ registry.js
│  │  └─ choice.js
│  └─ embed/
│     ├─ child-bridge.js
│     └─ zen-writer-embed.js
└─ favicon.svg
```

## 設計概要

- 関心毎の分離（SoC）
  - `theme.js`: CSS変数によるテーマ・配色・フォント適用
  - `editor.js`: 入力、保存、カウンタ、通知
  - `app.js`: UIの初期化とイベント配線
- CSSカスタムプロパティにより配色・タイポグラフィを一元管理

- 詳しくは `docs/DESIGN.md` を参照してください。

## 開発の進め方

- 選択肢駆動（Choices-Driven Development）で意思決定をドキュメント化し、`docs/ROADMAP.md` にフェーズを反映
- 機能はガジェット/プラグイン単位で疎結合化し、埋め込みモードとの互換性を常に検証
- タスクは小さく分割してコミットし、`AI_CONTEXT.md` で中断可能点を共有
- ブランチ運用指針は `docs/BRANCHING.md`、埋め込み運用は `docs/EMBED_SDK.md` を参照

## 開発プロトコル

- 作業の前提と再開手順: `AI_CONTEXT.md`
- 開発プロトコル（ブランチ/PR/CI連携マージ）: `DEVELOPMENT_PROTOCOL.md`

## テスト手順

手順は `docs/TESTING.md` にまとめています。動作確認時はチェックリストに従って検証してください。

## 変更履歴

`CHANGELOG.md` を参照。

## 関連ドキュメント

- `docs/USAGE.md`
- `docs/TESTING.md`
- `docs/DESIGN.md`
- `docs/THEMES.md`
- `docs/ROADMAP.md`
- `docs/RELEASE.md`
- `docs/DEPLOY.md`
- `docs/PROJECT_HEALTH.md` - プロジェクト健全性レポート
- `docs/tasks/README.md` - タスク管理インデックス
- `docs/BACKLOG.md`
- `docs/ISSUES.md`
- `docs/KNOWN_ISSUES.md`
- `docs/PROJECT_ANALYSIS_REPORT.md` - プロジェクト徹底分析レポート
- `docs/IMPLEMENTATION_PLAN.md` - 実装計画書
- `docs/CONVENTIONS.md`
- `docs/LABELS.md`
- `docs/PALETTE_DESIGN.md`
- `docs/EMBED_SDK.md`
- `docs/SNAPSHOT_DESIGN.md`
- `docs/EDITOR_EXTENSIONS.md`
- `docs/DESIGN_HUB.md`
- `docs/BRANCHING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `VERSION`
- `LICENSE`

## ライセンス

内部利用想定。外部公開時に適切なライセンスを設定してください。

## Build (No Server)

`npm run build` で `dist/` を生成できます。
生成後は `dist/index.html` をブラウザで直接開いて、サーバーなしで動作確認できます。

## Start Menu Registration (Windows)

`npm run app:install` を実行すると、`dist/` を生成した上で、
Windows のスタートメニューに `Zen Writer` ショートカット（`.url`）を作成します。

作成先:

- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Zen Writer.url`

`npm run app:open` でビルド済みの `dist/index.html` を既定ブラウザで開きます。
`npm run app:install:open` を使うと、スタートメニュー登録と起動を一度に実行できます。
