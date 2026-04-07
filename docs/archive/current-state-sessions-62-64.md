# Current State — セッション変更ログ退避 (62–64)

正本は [`docs/CURRENT_STATE.md`](../CURRENT_STATE.md)。本ファイルは履歴参照用。

## Session 62

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 Undo 粒度 | WYSIWYG カスタム Undo のバッチを Space/Enter/blur/IME compositionend でフラッシュ | `js/editor-wysiwyg.js` |
| 仕様・台帳 | Phase 4 一部、FR-007、自動化境界（手動） | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 62 スナップショット | `docs/CURRENT_STATE.md` |

## Session 63

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| P1 短文カーソル | タイプライター ON 時 `paddingTop` 対称 + `_scrollCursorToAnchor` の scroll クランプ | `js/editor-wysiwyg.js` |
| E2E | タイプライター ON で WYSIWYG に `paddingTop` が付くこと | `e2e/wysiwyg-editor.spec.js` |
| 仕様・台帳 | Phase 4、FR-008、自動化境界 | `docs/specs/spec-richtext-enhancement.md`, `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行 | `docs/USER_REQUEST_LEDGER.md` |
| CURRENT_STATE | セッション 63 スナップショット | `docs/CURRENT_STATE.md` |

## Session 64

| 項目 | 変更内容 | 影響ファイル |
| ---- | -------- | ----------- |
| WP-004 監査サイクル | `reader-wysiwyg-distinction`・`reader-chapter-nav`・`reader-wikilink-popover`・`reader-genre-preset` を一括実行（16 件通過）。パイプライン差分なし — `WP004_PHASE3_PARITY_AUDIT` 更新履歴に記録 | `docs/WP004_PHASE3_PARITY_AUDIT.md`, `docs/USER_REQUEST_LEDGER.md` |
| FR-007 | `wysiwyg-editor.spec.js` に Space 境界・blur 境界の Undo E2E。`_undoAction` の二重 `pop` を単一 `pop` に修正 | `e2e/wysiwyg-editor.spec.js`, `js/editor-wysiwyg.js` |
| 台帳・境界 | FR-007 のテスト列、`AUTOMATION_BOUNDARY` の手動/E2E 分担を更新 | `docs/FEATURE_REGISTRY.md`, `docs/AUTOMATION_BOUNDARY.md` |
| Phase 5（表） | 実装はせず、`spec-richtext-enhancement.md` に段階導入表行 + スライス境界節。台帳に候補 1 行 | `docs/specs/spec-richtext-enhancement.md`, `docs/USER_REQUEST_LEDGER.md` |
| WP-001 | deferred **新規再現なし** → スキップ一行（台帳） | `docs/USER_REQUEST_LEDGER.md` |
