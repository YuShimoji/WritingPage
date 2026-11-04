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

## 未確認・未対応

- sepia / solarized など明るいテーマでの光彩・影の見え方、Electron 通常起動での見え方。
- 1280px 幅でプレビューが編集面の右隣ではなく画面左下（編集面の下）に開く配置は今回変更していない。`#editor-classic-layer` が縦並びなのに `.editor-preview` が横並び前提（`flex: 0 0 38%`）であることが関係する可能性がある。配置の判断は別途。
- 保存・再読込後に下線が残ることの画面確認（round-trip は Markdown 文字列と preview まで確認）。
