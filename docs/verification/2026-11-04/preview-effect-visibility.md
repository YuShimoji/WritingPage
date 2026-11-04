# MD プレビューで書式の効果が分かりにくい問題

依頼（2026-11-04）: 「開いた状態のプレビューだと、リッチテキスト適用しても効果が出ているかわかりません」。

## 再現（修正前 / アプリ内ブラウザ、ダークテーマ）

| 症状 | 観察 | 原因 |
| --- | --- | --- |
| 下線が消える | WYSIWYG は `<u>beta</u>`、Markdown とプレビューは `beta` | Turndown に `<u>` のルールが無く内容だけが残る。プレビューの markdown-it は `html:false` |
| 光彩・影が見えない | `.decor-glow` は `0 0 8px rgb(85,85,85)`、`.decor-shadow` は `rgba(0,0,0,.15)`。背景は `rgb(18,18,20)` | 色が背景に埋もれる（`--focus-color` が dark で `#555`） |
| 開いても表示されない | 幅 768px 以下で `#editor-preview` が `display:none`（`aria-expanded` は開のまま） | `@media (max-width:768px)` の `display:none !important` |

更新経路（`syncToMarkdown` → `_notifyChange` → `renderMarkdownPreview`、約100ms）自体は正常。

## 修正

- `js/editor-wysiwyg.js`: Turndown に `nativeUnderline` ルールを追加（`<u>` / `text-decoration: underline` の span → `[underline]…[/underline]`）。既存の装飾タグ往復に乗る。
- `css/editor-decorations.css`: `--decor-glow-color` / `--decor-shadow-color` を追加。dark / night / high-contrast は明るい色、それ以外は濃い色。光彩は二重 shadow に。`css/style.css` の重複定義（`.decor-shadow` / `.decor-glow`）も同じ変数に揃えた。
- `css/style.css`: 768px 以下の `.editor-preview { display:none !important }` を削除。900px 以下の既存の縦積み規則（幅100%、最大高 40vh）に任せる。

## 検証

- 新規 `e2e/preview-effect-visibility.spec.js` 3件。修正前コードでは3件とも失敗、修正後は pass。
- 関連 E2E 9 spec / 97件 pass（wysiwyg-editor, decorations, wp005-md-preview-rich-preview, responsive-ui, rich-text-block-align, reader-wysiwyg-distinction, undo-pending-input, ruby-wysiwyg, 新規）。`npm run lint:js:check` pass。

## 追加: 切り替え式プレビュー（同日・本人指示）

本人指示「プレビューは並列でなく切り替え式を標準で、なるべく言文一致のようにリアルタイムプレビュー」。1280px 幅で、プレビューが編集面の右隣ではなく画面左下（編集面の下）に開く配置だったことも、この方式で解消した。

- 開いている間は `#editor` / `#wysiwyg-editor` を `visibility:hidden`（`display:none` ではない。スクロール位置を保つため）にし、`#editor-preview` が同じ位置・幅・余白・文字組み・見出し組みで入れ替わる（`.editor-classic-layer--previewing`）。`#markdown-preview-panel` の見出しは `#wysiwyg-editor` と同じ `--heading-*` を使う。
- 開く瞬間は同期描画、開いている間は `requestAnimationFrame`、閉じている間だけ従来の debounce。開閉でおおよそ同じスクロール位置へ移り、閉じたら執筆面へフォーカスを戻す。`編集に戻る`（`#editor-preview-back`）で戻れる。
- プレビュー中は読み取り専用。書く面は WYSIWYG 自体が実時間の見た目一致面という整理にした。
- 画面確認（1280px / ダーク）: 見出し・下線・光彩・影・中央揃えが執筆面と同じ位置に入れ替わって表示され、右上に `編集に戻る` が出る。
- 既存テストの前提変更: `e2e/decorations.spec.js` は「プレビューを開いたまま `#editor` に入力」していたため、書いてから開く順に変更し、プレビュー側の装飾も検証するようにした。

## 追加: リファクタリング

- Turndown のカスタムルール（約150行）を `RichTextEditor` のコンストラクタから `js/modules/editor/RichTextTurndownRules.js` へ切り出した。登録順（後勝ち）と内容は変更なし。ルールが未読込のときは `console.warn`。`index.html` の読み込みは `editor-wysiwyg.js` の前。`test/empty-heading-serialization.test.js` は新モジュールも読み込む。Turndown 生成の分岐の重複（`TurndownService` / `window.TurndownService`）も 1 本にした。
- 傍点・ルビの HTML 化は `editor-wysiwyg.js` と `zw-inline-html-postmarkdown.js` に重複していた。後者を `applyWikilinks` / `applyKentenRuby` に分割し、編集面は `applyKentenRuby` を使う。**挙動の変化**: 編集面でも `|漢字《かな》` 形式がルビになる（プレビュー・Reader と一致）。

## 検証（追加分）

- 新規 E2E 5件（`preview-effect-visibility.spec.js`）、関連 E2E 26 spec / 251件 pass、unit 56件 pass、`npm run lint:js:check` pass。

## 未確認・未対応

- sepia / solarized など明るいテーマでの光彩・影の見え方、Electron 通常起動での見え方。
- 保存・再読込後に下線が残ることの画面確認（round-trip は Markdown 文字列と preview まで確認）。
- プレビューを開いたままの入力はできない（読み取り専用）。本人指示（2026-11-04）で**読み取り専用は現状維持だが確定ではない**。開いたまま書けるようにするかは未決定のまま残す。
- `scripts/release-readiness-checkpoint.js` の source 照合一覧（`js/editor-wysiwyg.js` など）には新モジュールを足していない。
- ルビ記法 `|漢字《かな》` が編集面で変換されるようになった影響（既存原稿でパイプ文字を使う場合）の実原稿での確認。
