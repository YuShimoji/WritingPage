# Feature Registry（機能台帳）

Zen Writer の**ユーザー向け機能**を一覧し、仕様の正本・実装の所在・テストの有無を追跡する。詳細仕様は各 `docs/specs/*.md` を正とする。

## 運用

- 新規ユーザー機能・ガジェット・モードを追加したら、下表に 1 行追加する
- 「テスト」列は E2E spec ファイル名（`e2e/*.spec.js`）または `manual` / `none`
- 大きな変更が入ったら「最終確認日」を更新する

## レジストリ

| ID | 機能名 | 概要 | 仕様 / 正本 | 主な実装 | テスト | 最終確認日 |
|----|--------|------|-------------|----------|--------|------------|
| FR-001 | UI モード | Normal / Focus / Reader の切替と状態 | `docs/specs/spec-mode-architecture.md` | `js/app.js` (`setUIMode`) | `ui-mode-consistency.spec.js` | 2026-04-06 |
| FR-002 | コマンドパレット | 横断コマンド実行・UI モード切替 | — | `js/command-palette.js` | `command-palette.spec.js` | 2026-04-06 |
| FR-003 | MD→HTML 後処理パイプライン | プレビューと Reader で同一順序の装飾・章リンク変換。markdown-it 前段は `ZWMdItBody` で共有。WP-004 Phase 3 は差分を単発で潰し本 spec で境界監視 | `docs/INTERACTION_NOTES.md`（WP-004） | `js/zw-markdown-it-body.js`, `js/zw-postmarkdown-html-pipeline.js`, `js/zw-inline-html-postmarkdown.js` | `reader-wysiwyg-distinction.spec.js` | 2026-04-06 |
| FR-004 | 章リンク変換 | `chapter://` → `.chapter-link`、Reader/エクスポート用 `#` 化 | SP-072 系 | `js/chapter-nav.js` | `reader-wysiwyg-distinction.spec.js` | 2026-04-06 |
| FR-005 | ツールバー／執筆域幾何 | `--toolbar-height` 同期、Focus 上端ホバー時の余白 | — | `js/app.js`, `css/style.css` | `toolbar-editor-geometry.spec.js` | 2026-04-06 |

## 未登録の既存機能

既存コードベースの機能は随時この表へ移行する。当面は `docs/spec-index.json` および `docs/FEATURE_REGISTRY.md` の両方を参照し、重複記述を減らす方向で統合する。

## 関連

- `docs/AUTOMATION_BOUNDARY.md` — E2E と手動検証の境界
- `docs/ROADMAP.md` — 優先度とロードマップ
- `docs/CURRENT_STATE.md` — セッション単位のスナップショット
