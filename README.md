# Zen Writer — ミニマル&スタイリッシュな物語スタジオ

Zen Writer は、ミニマルな操作体験とスタイリッシュなレイアウトで小説・ビジュアルノベル執筆を支援する Web アプリケーションです。サーバー不要・オフライン対応を維持しつつ、ドラッグ&ドロップ画像やフローティング装飾ツールバーなど視覚的な編集体験を段階的に拡張していきます。

## ビジョン

- グラフィックノベルを含むリッチな物語制作を、単一ページで完結できる軽量エディターへ発展させる
- 埋め込み用途（アドベンチャーゲーム向け内蔵エディター等）でも安全かつ疎結合に動作する SDK を提供する
- 左サイドバーを「ガジェット」単位で組み替え可能にし、作者ごとの作業スタイルに合わせて機能を選択できるようにする

## 現状の主要機能（2025-10）

- シンプルな `textarea` ベースのエディタとブラウザ LocalStorage による自動保存
- 文字数・語数カウンタと折りたたみ可能なサイドバー/ツールバー
- プリセット（ライト/ダーク/セピア）とカラーピッカー、フォント種別・サイズ・行間の調整
- テキスト/Markdown のインポート・エクスポート、印刷用レイアウト（UI 非表示）
- フローティングツール（⚙️）による全体フォントサイズ調整、アウトラインテンプレート、テーマプリセット
- ガジェットパネル（時計など）の並び替え・折りたたみ・設定保存機能
- ベータ版 Embed SDK（`docs/EMBED_SDK.md`）による `iframe` 埋め込みサポート

## 開発中・優先課題

- ドラッグ&ドロップした画像の位置調整・サイズ変更・コラージュレイアウト
- 選択範囲に追従するフローティング装飾ツールバーとアニメーション対応テキストスタイル
- ガジェットのモジュール化とサイドバー構成のプリセット管理（章一覧、フォント切替、AI サマリ等）
- 埋め込み先からの双方向通信強化（クロスオリジン安全性、外部ワークフロー連携）
- インタラクティブ要素（シーン分岐、ビューワーモード切替）の設計と UI プロトタイピング

## クイックスタート

1. このフォルダの `index.html` をブラウザで開く
2. そのまま入力して執筆開始（自動保存されます）
3. 左上の「☰」で設定サイドバーを開き、テーマやフォントを調整

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
│  ├─ editor.js
│  ├─ outline.js
│  ├─ storage.js
│  ├─ theme.js
│  ├─ themes-advanced.js
│  ├─ hud.js
│  ├─ plugins/
│  │  ├─ registry.js
│  │  └─ choice.js
│  └─ embed/
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

## 開発プロトコルと中央ワークフロー

- 本リポジトリは、中央リポジトリの再利用可能ワークフローを参照します。
  - CI Smoke / Issues Sync は `uses: YuShimoji/shared-workflows/.github/workflows/*.yml@v0.1.0` を利用
- ルール/プロトコル
  - 作業の前提と再開手順: `AI_CONTEXT.md`
  - 開発プロトコル（ブランチ/PR/CI連携マージ）: `DEVELOPMENT_PROTOCOL.md`
  - ルール本文: `docs/Windsurf_AI_Collab_Rules_v1.1.md`

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
- `docs/BACKLOG.md`
- `docs/ISSUES.md`
- `docs/KNOWN_ISSUES.md`
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
