# Replay Surface / Reader Preview

> **Status: superseded / current pointer**

現行の正本は `docs/INTERACTION_NOTES.md` の「Zen Writer UI 状態モデル」と `docs/UI_SURFACE_AND_CONTROLS.md`。

読者視点確認は UI mode ではなく、`data-reader-overlay-open` で開閉する再生オーバーレイとして扱う。

## 現行の責務

- visible 章を結合して読者向け本文を表示する
- wikilink / 傍点 / ルビ / textbox DSL / chapter navigation を preview pipeline と整合させる
- 編集面とは同時操作しない
- close 後は直前の編集 surface へ戻る

## 更新先

- UI 用語: `docs/INTERACTION_NOTES.md`
- DOM / 操作入口: `docs/UI_SURFACE_AND_CONTROLS.md`
- parity audit: `docs/WP004_PHASE3_PARITY_AUDIT.md`
