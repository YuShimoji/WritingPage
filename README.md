# Zen Writer — ミニマル&スタイリッシュな物語スタジオ

Zen Writer は、ミニマルな操作体験で小説・ビジュアルノベル執筆を支援するローカル中心の Web / Electron アプリケーションです。サーバー不要・オフライン対応を維持しながら、Rich editing、章構造、保存・再開、Reader / Replay 確認を一つの執筆導線に繋ぎます。

## ビジョン

- グラフィックノベルを含むリッチな物語制作を、単一ページで完結できる軽量エディターへ発展させる
- 埋め込み用途（アドベンチャーゲーム向け内蔵エディター等）でも安全かつ疎結合に動作する SDK を提供する
- 左サイドバーを「ガジェット」単位で組み替え可能にし、作者ごとの作業スタイルに合わせて機能を選択できるようにする

## 現状の主要機能（2026-03）

### エディタ機能

- `textarea` / WYSIWYG (contenteditable) の切り替え可能なハイブリッドエディタ。**原稿はバックグラウンドで自動保存**（IndexedDB / LocalStorage）。**手動の即時保存**は `Ctrl+S` / `Cmd+S` またはコマンドパレットの「保存」から（常設の保存ボタンは置かない方針）
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

- built-in gadget と Local Gadget Mod（`MarkdownPreview` / `HUDSettings` / `PomodoroTimer`）の並び替え・折りたたみ・設定保存
- モジュラー設計による拡張可能なアーキテクチャ
- ベータ版 Embed SDK（`docs/EMBED_SDK.md`）による `iframe` 埋め込みサポート

## 開発ロードマップ

詳細は `docs/ROADMAP.md` を参照。現在の優先順位:

1. **執筆体験の基盤**: 章管理、保存・再開、入出力、Rich editing、Reader / Replay の主要導線は実装・focused proof 済み
2. **現在の品質目標**: release-readiness checkpoint で automated Web gates、UI capture evidence、Electron/package-only human gate の責務境界を一つの受入面にまとめる
3. **並行する deferred review**: Documents の empty Rich editing hint、`現在` marker、selection-to-writing focus return は user-owned tactile review として独立して確認する
4. **条件付き次段**: 明示承認後の MkDocs -> GitHub Pages 自動投影、別起票の cloud continuity 検討

## Setup & Run (開発・動作確認手順)

ビルドから通常のアプリを起動して実動作確認を行うための手順です。

### 1. 依存関係のインストール

プロジェクトを初めて利用する場合や、パッケージが更新された場合に実行してください。lockfile の再現には Node 22.12 以上を使い、通常は `npm ci` を推奨します。

```bash
npm ci
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
2. 入力内容はバックグラウンドで自動保存されます（IndexedDB / LocalStorage）。手動の即時保存は `Ctrl+S` / `Cmd+S` またはコマンドパレットの「保存」から。

**注意**: `file://` プロトコルによる直接アクセスでは、一部の機能（画像アセット管理や一部のクロスオリジン通信テストなど）がブラウザのセキュリティ制限により動作しない場合があります。完全な機能確認には **`npm run dev`** によるサーバー起動を推奨します。

## キーボードショートカット

- 手動保存（即時・自動保存に加えて）: `Ctrl + S` / `Cmd + S`（コマンドパレットの「保存」と同じ）
- インデント: `Tab`
- command palette 表示: `F2`
- フォントサイズ拡大: `Ctrl/Cmd + +` または `Ctrl/Cmd + =`
- フォントサイズ縮小: `Ctrl/Cmd + -`
- フォントサイズ初期化: `Ctrl/Cmd + 0`
- 再生オーバーレイを閉じる: `Escape`

## プレイ日記を書く

1. 「原稿」で日記用の文書を作ります。「新しい章」で1話ずつ追加し、章名に各話のタイトルを入れます。Markdown 原稿では、各話をレベル2の見出し（`## 第1話　渡し場へ`）にしても目次が作られます。
2. 執筆面で F2 を押し、「プレイ日記の場面を挿入」を選びます。ゲーム内の日付、台詞、和訳、スクリーンショット、本文から必要な欄だけ使えます。場面はカーソルのある段落の後に入り、そのまま次の段落を書けます。
3. 発言ごとに「登場人物」「プレイヤー」を選び、必要なら話者名を入れます。「発言を追加」で同じ場面に返答を続けられます。横書きでは登場人物は左の線、プレイヤーは右の線が目印です。各発言の下にその和訳が付きます。話者が分からないときは「指定なし」のまま書けます。
4. 画像を選んだら、画像を音声で読むときの説明と、画像の下に読者へ見せるキャプションを書けます。画像と日記本文は「筆者の記録」にまとまり、広い画面では会話の隣、狭い画面では会話の下に表示されます。Alt+Shift+R で読者表示を開くと、表示対象が2章以上の日記には目次と前後の話へのリンクが付きます。
5. 読むためのコピーは読者表示の「HTMLとして保存」、別の環境で執筆を再開するためのコピーは原稿の「JSON書き出し」で保存します。どちらも原稿で使った画像を含みます。

### 聞き込みの場面

F2 の「聞き込みの場面を挿入」から話者、場所、導入、話題名と返答、旅の手帳をまとめて入力できます。「話題を追加」で返答を増やせます。挿入後は通常の原稿と同じように本文を編集できます。
読者表示と保存した HTML では話題や手帳を選ぶと中身が開きます。章を分けると目次と前後への移動が付きます。
[七人目の渡し賃](samples/ash-ferry-inquiry.zwp.json)は、NarrativeGen の Studio で再生した一つの経路を収めた編集用見本です。「原稿 → 入出力 → JSON読み込み」で開けます。NarrativeGen では選択に応じた条件判定と手帳の更新を試せます。

### 場面字幕と伏せ書き

日記にも通常の原稿にも使えます。F2 の「場面字幕を挿入」で時間や場所を書き、副題を添えると、本文の途中に中央揃えの字幕が入ります。
「伏せ書きを挿入」には、読む前に見せる見出しと、開いた後に見せる手掛かり・攻略メモを書きます。執筆中は全文を編集できます。
MD プレビュー・読者表示・保存した HTML では、見出しをクリックするか、Tab で選んで Enter または Space で開閉できます。

```markdown
> [!SCENE] 夜明けの北門
> 霧月四日、出発の一時間前

門番が地図の裏を指さした。

> [!SPOILER] 地図の印を読む
> **二重丸**は、水門の下を通る抜け道を示す。
```

字幕はスクロール連動アニメーションに対応する読者表示・単体 HTML で画面に入るときに、伏せ書きは開いたときに短くフェードします。
端末で動きを減らす設定を選ぶと静止表示になります。アプリからの印刷には伏せた本文も含まれます。
字幕は [Fountain の脚本記法](https://fountain.io/syntax/) と [Ren’Py の場面転換](https://www.renpy.org/doc/html/transitions.html)、
伏せ書きは [Obsidian の折りたたみ注記](https://obsidian.md/help/callouts) を参考にしています。

## データ保存

- 入力内容はバックグラウンドで自動保存されます（IndexedDB / LocalStorage）。手動の即時保存は `Ctrl+S` / `Cmd+S` またはコマンドパレットの「保存」から。
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
- 現在地と再開手順は `docs/CURRENT_STATE.md`、設計の入口は `docs/ARCHITECTURE.md` と `docs/APP_SPECIFICATION.md` を参照してください。

## 開発の進め方

- 選択肢駆動（Choices-Driven Development）で意思決定をドキュメント化し、`docs/ROADMAP.md` にフェーズを反映
- 機能はガジェット/プラグイン単位で疎結合化し、埋め込みモードとの互換性を常に検証
- タスクは小さく分割し、再開に必要な事実は `docs/CURRENT_STATE.md` に同期
- ブランチ運用は `docs/BRANCHING.md`、埋め込みは `docs/EMBED_SDK.md` を参照

## 開発プロトコル

- 作業の前提と再開手順: `docs/CURRENT_STATE.md`
- エージェント入口: `AGENTS.md`
- Review Card / 自由文レビュー / long-run autonomy: `docs/OPERATOR_REVIEW_UX.md`

## テスト手順

手順は `docs/TESTING.md` にまとめています。動作確認時はチェックリストに従って検証してください。

## 変更履歴

`CHANGELOG.md` を参照。

## 関連ドキュメント

- `docs/CURRENT_STATE.md` - 現在地の正本
- `docs/INVARIANTS.md` - 不変条件・責務境界
- `docs/INTERACTION_NOTES.md` - UI 状態モデル・手動確認形式
- `docs/OPERATOR_REVIEW_UX.md` - Review Card・自由文レビュー・long-run autonomy
- `docs/ARCHITECTURE.md`
- `docs/APP_SPECIFICATION.md`
- `docs/ROADMAP.md`
- `docs/TESTING.md`
- `docs/THEMES.md`
- `docs/EMBED_SDK.md`
- `docs/EDITOR_EXTENSIONS.md`
- `docs/BRANCHING.md`
- `docs/CODING_STANDARDS.md`
- `docs/LABELS.md`
- `docs/spec-index.json` - 仕様インデックス
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

## One-Click Update and Launch (Windows)

通常確認で「最新版を取り込む → `dist/` を作る → アプリを開く」まで進めたいときは、次のどちらかを使います。

- `ZenWriter-UpdateAndLaunch.cmd` をダブルクリック
- `npm run app:update:open`

この導線は `git pull --ff-only` だけを使います。ローカル変更がある場合、merge が必要な場合、または更新に失敗した場合は停止し、作業内容を破棄しません。`dist/index.html` を開く通常確認が目的で、localhost の開発者モード挙動を既定にしません。

Start Menu に更新起動用ショートカットを作る場合は次を実行します。

```bash
npm run app:install:update
```

作成先:

- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Zen Writer Update and Launch.lnk`

日常の執筆用には、次の手順で Windows アプリ `WritingPage` を登録できます。

## Start Menu Registration (Windows)

`npm run app:install` は Windows 版を `build/win-unpacked/` に作り、現在のユーザーのスタートメニューとデスクトップに `WritingPage` を登録します。両方から同じアプリと原稿を開けます。

作成先:

- スタートメニューの `WritingPage.lnk`
- デスクトップの `WritingPage.lnk`

`npm run app:install:open` で登録と起動を一度に実行できます。アプリを開いたら、左端の「原稿」→「入出力」→「JSON読み込み」から[編集用サンプル](samples/README.md)を読み込めます。ブラウザ版を開くコマンドは `npm run app:open:dist` です。
