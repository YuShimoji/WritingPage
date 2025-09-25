# Zen Writer — 小説執筆用シンプルWebページ

Zen Writer は、ブラウザで開くだけで使える、Zenライクな小説執筆ページです。余計なUIを排し、必要時にだけ現れるサイドバー・ツールバーで設定を調整できます。サーバー不要・オフライン可で、すぐに書き始められます。

## 特徴

- シンプルなエディタ（`textarea`ベース）
- 自動保存（ブラウザの LocalStorage）
- 文字数・語数カウンタ
- 折りたたみ可能なサイドバー、最小限のツールバー
- プリセット（ライト/ダーク/セピア） + カラーピッカー（背景/文字色）
- フォント（種類/サイズ/行間）調整
- テキスト/Markdown エクスポート
- フルスクリーン切替
- テキスト/Markdown インポート（読み込み）
- フローティングツール（⚙️）でページ全体のフォントサイズをスライダー/数値で調整
- アウトライン（部/章/節 等）のプリセット作成・切替・見出し挿入、色変更
- 高度なテーマプリセット（フォント/サイズ/行間/色の組合せ保存・適用）
- 執筆目標（目標文字数・任意の締切）と進捗バー（ツールバー表示）
- 複数ドキュメント管理（作成/一覧/切替/改名/削除）

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
│  └─ hud.js
└─ favicon.svg
```

## 設計概要

- 関心毎の分離（SoC）
  - `storage.js`: LocalStorage とエクスポート
  - `theme.js`: CSS変数によるテーマ・配色・フォント適用
  - `editor.js`: 入力、保存、カウンタ、通知
  - `app.js`: UIの初期化とイベント配線
- CSSカスタムプロパティにより配色・タイポグラフィを一元管理

詳しくは `docs/DESIGN.md` を参照してください。

## 開発の進め方

- 選択肢駆動（Choices-Driven Development）で意思決定をドキュメント化
- タスクは小さく分割してこまめにコミット
- 詳細は `docs/choices-driven-development.md` を参照

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
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `VERSION`
- `LICENSE`

## ライセンス

内部利用想定。外部公開時に適切なライセンスを設定してください。
