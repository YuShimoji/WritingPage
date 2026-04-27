# UI Mode Architecture

> **Status: superseded / history stub**

現行の正本は `docs/INTERACTION_NOTES.md` と `docs/INVARIANTS.md`。

公開 UI は `display mode` を第一級概念にせず、次の surface で説明する。

- `top chrome`: hidden が既定の一時シェル
- `left nav`: root/category 階層
- `replay surface`: 読者視点確認の一時 surface
- `normal` / `focus`: 内部互換 API としてのみ扱う

旧 multi-mode 設計の詳細は現在判断に使わない。
