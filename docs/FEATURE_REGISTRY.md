# Feature Registry（機能台帳）

Zen Writer の**ユーザー向け機能**を一覧し、仕様の正本・実装の所在・テストの有無を追跡する。詳細仕様は各 `docs/specs/*.md` を正とする。

## 運用

- 新規ユーザー機能・ガジェット・モードを追加したら、下表に 1 行追加する
- 「テスト」列は E2E spec ファイル名（`e2e/*.spec.js`）または `manual` / `none`
- 大きな変更が入ったら「最終確認日」を更新する

## レジストリ

| ID | 機能名 | 概要 | 仕様 / 正本 | 主な実装 | テスト | 最終確認日 |
|----|--------|------|-------------|----------|--------|------------|
| FR-001 | UI モード | Normal / Focus の切替と状態。Reader はモードではなく再生オーバーレイ導線（`data-reader-overlay-open`）として扱う。左サイドバー・章パネル・執筆「詳細」の残リスクは `spec-ui-mode-sidebar-residuals.md` | `docs/specs/spec-mode-architecture.md`, `docs/specs/spec-ui-mode-sidebar-residuals.md` | `js/app.js` (`setUIMode`), `js/reader-preview.js`, `js/sidebar-manager.js`, `js/edge-hover.js` | `ui-mode-consistency.spec.js`, `reader-preview.spec.js` | 2026-04-13 |
| FR-002 | コマンドパレット | 横断コマンド実行・UI モード切替。サイドバー **補助** / **詳細設定** カテゴリへのジャンプ（`gadget-assist` / `gadget-advanced`、session 88） | — | `js/command-palette.js` | `command-palette.spec.js` | 2026-04-13 |
| FR-003 | MD→HTML 後処理パイプライン | プレビューと Reader で同一順序の装飾・章リンク変換。markdown-it 前段は `ZWMdItBody` で共有。監査台帳 `docs/WP004_PHASE3_PARITY_AUDIT.md`（複数見出し+chapter://・壊れ wikilink・zw-textbox 複合・zw-typing/dialog+ルビ・ジャンルプリセット浅い E2E・Reader 壊れ wikilink ポップオーバー・Reader 章末ナビ結合 smoke・**段落 typography CSS 変数の preview/Reader 一致（session 66）** 等） | `docs/INTERACTION_NOTES.md`（WP-004）、`docs/specs/spec-textbox-render-targets.md` | `js/zw-markdown-it-body.js`, `js/zw-postmarkdown-html-pipeline.js`, `js/zw-inline-html-postmarkdown.js`, `css/style.css`（プレビュー／Reader 本文の段落・字下げ規則） | `reader-wysiwyg-distinction.spec.js`, `reader-genre-preset.spec.js`, `reader-wikilink-popover.spec.js`, `reader-chapter-nav.spec.js` | 2026-04-07 |
| FR-004 | 章リンク変換 | `chapter://` → `.chapter-link`、Reader/エクスポート用 `#` 化 | SP-072 系 | `js/chapter-nav.js` | `reader-wysiwyg-distinction.spec.js` | 2026-04-06 |
| FR-005 | ツールバー／執筆域幾何 | `--toolbar-height` 同期、Focus 上端ホバー時の余白 | — | `js/app.js`, `css/style.css` | `toolbar-editor-geometry.spec.js` | 2026-04-06 |
| FR-006 | 段落の横方向揃え（P2・部分） | WYSIWYG で `data-zw-align`、コマンドパレット・「その他」メニュー、paste、Turndown。**MD プレビュー（`#markdown-preview-panel`）と読者本文（`.reader-preview__content`）**は `css/style.css` で投影（session 57）。改行: `effectBreakAtNewline` と `effectPersistDecorAcrossNewline` はショートカット（後者のみ）に加え **UI Settings**（詳細設定）からも設定可（session 60–61） | `docs/specs/spec-rich-text-paragraph-alignment.md`, `docs/specs/spec-rich-text-newline-effect.md` | `js/modules/editor/RichTextCommandAdapter.js`, `js/editor-wysiwyg.js`, `js/command-palette.js`, `js/gadgets-editor-extras.js`, `index.html`, `css/style.css` | `rich-text-block-align.spec.js`, `reader-wysiwyg-distinction.spec.js`, `editor-settings.spec.js` | 2026-04-06 |
| FR-007 | WYSIWYG カスタム Undo 粒度 | `Ctrl+Z` / `Ctrl+Shift+Z` 用スタック。連続入力はデバウンスバッチに加え、**Space / Enter / blur / IME compositionend** で保留バッチをフラッシュし Undo 単位を区切る（session 62）。**Undo はスタックを 1 件だけ pop**（session 64）。**Redo 用スナップショットは Undo 直前の実 DOM `innerHTML`**（session 65）。E2E: Space・Enter・blur・Undo 後 Redo・**連続 Undo/Redo（Space 区切りセグメント）**・**Space 後の長い連続入力を 1 段 Undo**（別レーン session） | `docs/specs/spec-richtext-enhancement.md`（Phase 4） | `js/editor-wysiwyg.js` | `wysiwyg-editor.spec.js`（FR-007） | 2026-04-07 |
| FR-008 | WYSIWYG タイプライター短文アンカー | タイプライター ON 時、`paddingBottom` に加え **`paddingTop: calc(100vh * (1 - anchorRatio))`** で上方向スクロール域を確保。`_scrollCursorToAnchor` の `scrollTop` をクランプ（session 63）。E2E: `paddingTop` の有無に加え、**長大本文で input 後の `scrollTop` が `[0, maxScroll]` に収まる**（別レーン session） | `docs/specs/spec-richtext-enhancement.md`（Phase 4） | `js/editor-wysiwyg.js` | `wysiwyg-editor.spec.js` | 2026-04-07 |
| FR-009 | アプリ内ヘルプ資源（SSOT: EDITOR_HELP.md） | `docs/EDITOR_HELP.md` を SSOT とする UI 説明の集約先。UI 上の長文ヒント（`#sidebar-edit-hint`・Focus チップ説明）は session 101 で撤去し、情報は本 SSOT に移設。現 UI 入口はトップバー `#toggle-help-modal` とコマンドパレットのみ（詳細設定カテゴリの死体3ボタン `#sidebar-toggle-help` / `#help-button` / `#editor-help-button` は session 101 で撤去） | `docs/EDITOR_HELP.md`（SSOT）, `docs/GADGETS.md`（28ガジェット一覧） | `js/gadgets-help.js`（`#help-modal` の表示器・再設計待ち）, `index.html`（`#help-modal` / `#toggle-help-modal`） | `visual-audit.spec.js`（15-help-modal スクショのみ・assert なし） | 2026-04-16 |

## 未登録の既存機能

既存コードベースの機能は随時この表へ移行する。当面は `docs/spec-index.json` および `docs/FEATURE_REGISTRY.md` の両方を参照し、重複記述を減らす方向で統合する。

## 関連

- `docs/AUTOMATION_BOUNDARY.md` — E2E と手動検証の境界
- `docs/ROADMAP.md` — 優先度とロードマップ
- `docs/CURRENT_STATE.md` — セッション単位のスナップショット
