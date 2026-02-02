Status: DONE
Tier: 3
Branch: feature/task-031-verification
Owner: Worker
Created: 2026-01-19
Report: docs/reports/REPORT_TASK_031.md
Updated: 2026-01-19

## Objective
- 現行のサイト状態をスクリーンショットで記録し、`docs/GADGETS.md` 等の仕様と詳細に突合する。
- 視覚的な崩れや仕様不整合がないか確認し、エビデンスを残す。

## Context
- ユーザーより「現在のWebサイトの状態をスクリーンショットなどで取得して、本当に当初の仕様通りになっているか詳細に確認してください」との要望あり。
- `docs/GADGETS.md` (現行リファレンス) 等が仕様の正となる。

## Focus Area
- `docs/archive/screenshots/verification_20260119/` (新規ディレクトリ)
- `docs/reports/`

## Forbidden Area
- `src/` (実装変更は行わない)

## Constraints
- ローカルサーバー (`npm run dev`) を使用して検証すること。
- ブラウザ操作は `browser_subagent` ツールを使用すること。

## DoD
- [ ] 以下のスクリーンショットが `docs/archive/screenshots/verification_20260119/` に保存されている:
  - 1. `initial_load.png`: 初期表示（サイドバー閉）
  - 2. `sidebar_structure.png`: Structure タブ展開
  - 3. `sidebar_typography.png`: Typography タブ展開
  - 4. `sidebar_assist.png`: Assist タブ展開
  - 5. `sidebar_wiki.png`: Wiki タブ展開
  - 6. `hud_visible.png`: HUD が表示されている状態 (文字数カウントや通知など)
  - 7. `loadout_menu.png`: ロードアウト切り替えメニュー展開時
- [ ] `docs/reports/REPORT_TASK_031.md` に検証結果が記載されている:
  - 各スクリーンショットに対する仕様 (`docs/GADGETS.md`) との合致/乖離判定
  - 検出された問題点（もしあれば）
- [ ] 本チケットの Report 欄にパスが追記されている
