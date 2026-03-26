# Zen Writer — ミニマル&スタイリッシュな物語スタジオ

Zen Writer は、ミニマルな操作体験とスタイリッシュなレイアウトで小説・ビジュアルノベル執筆を支援する Web アプリケーションです。サーバー不要・オフライン対応を維持しつつ、ドラッグ&ドロップ画像やフローティング装飾ツールバーなど視覚的な編集体験を段階的に拡張していきます。

## ビジョン

- グラフィックノベルを含むリッチな物語制作を、単一ページで完結できる軽量エディターへ発展させる
- 埋め込み用途（アドベンチャーゲーム向け内蔵エディター等）でも安全かつ疎結合に動作する SDK を提供する
- 左サイドバーを「ガジェット」単位で組み替え可能にし、作者ごとの作業スタイルに合わせて機能を選択できるようにする

## 現状の主要機能（2026-03）

### エディタ機能

- `textarea` / WYSIWYG (contenteditable) の切り替え可能なハイブリッドエディタ。ブラウザ LocalStorage による自動保存
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

## 開発ロードマップ

詳細は `docs/ROADMAP.md` を参照。現在の優先順位:

1. **執筆体験の基盤** (Priority A): モードアーキテクチャ (done)、チャプター管理再設計 (done)、セクションリンク (done)
2. **表現力拡張** (Priority B): Web小説演出、パステキスト、テキスト表現アーキテクチャ
3. **エコシステム** (Priority C): ドックパネル、Google Keep連携、プラグイン拡張

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
- フォーカスモード切替: `Ctrl/Cmd + Shift + F`
- ブランクモード切替: `Ctrl/Cmd + Shift + B`
- モード復帰(→Normal): `Escape`

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

- 詳しくは `docs/ARCHITECTURE.md` を参照してください。

## 開発の進め方

- 選択肢駆動（Choices-Driven Development）で意思決定をドキュメント化し、`docs/ROADMAP.md` にフェーズを反映
- 機能はガジェット/プラグイン単位で疎結合化し、埋め込みモードとの互換性を常に検証
- タスクは小さく分割してコミットし、`HANDOVER.md` で中断可能点を共有
- ブランチ運用は `docs/BRANCHING.md`、埋め込みは `docs/EMBED_SDK.md` を参照

## 開発プロトコル

- 作業の前提と再開手順: `HANDOVER.md`
- プロジェクトルール: `CLAUDE.md`

## テスト手順

手順は `docs/TESTING.md` にまとめています。動作確認時はチェックリストに従って検証してください。

## 変更履歴

`CHANGELOG.md` を参照。

## 関連ドキュメント

### 主要ドキュメント

- `docs/ROADMAP.md` - 機能ロードマップ（優先度別）
- `docs/APP_SPECIFICATION.md` - アプリケーション仕様
- `docs/ARCHITECTURE.md` - 設計概要
- `docs/spec-index.json` - 仕様インデックス (全54エントリのステータス・実装率)

### 開発ガイド

- `docs/TESTING.md` - テスト手順
- `docs/CODING_STANDARDS.md` - コーディング規約
- `docs/BRANCHING.md` - ブランチ運用
- `docs/EDITOR_EXTENSIONS.md` - エディタ拡張
- `docs/THEMES.md` - テーマ設計
- `docs/LABELS.md` - UIラベル管理

### 運用・デプロイ

- `docs/RELEASE.md` - リリース手順
- `docs/DEPLOY.md` - デプロイ手順
- `docs/EMBED_SDK.md` - 埋め込みSDK
- `docs/PLUGIN_GUIDE.md` - プラグイン開発ガイド
- `docs/GADGETS.md` - ガジェット仕様

### その他

- `CHANGELOG.md` - 変更履歴
- `HANDOVER.md` - 作業引き継ぎ
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
