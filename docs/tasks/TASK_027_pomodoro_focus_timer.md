# Task: Pomodoro/集中タイマー機能実装

Status: OPEN
Tier: 3
Branch: main
Owner: Worker
Created: 2026-01-05T00:00:00+09:00
Report: docs/reports/REPORT_TASK_027_pomodoro_focus_timer.md
## Objective

- Pomodoro/集中タイマー機能（HUD連携のセッション管理）を実装する
- 執筆セッションを管理し、集中力を維持できるようにする

## Context

- `README.md` の「記載漏れの将来拡張アイデア」に「Pomodoro/集中タイマー: HUD連携のセッション管理」が記載されている
- Pomodoro/集中タイマー機能は未実装
- 既存のHUD機能（`js/hud.js`）と連携する

## Focus Area

- `js/pomodoro-timer.js`（新規作成）
- `js/hud.js`（HUD機能の拡張）
- `js/gadgets-pomodoro.js`（新規作成）
- `index.html`（タイマーUI）
- `css/style.css`（タイマースタイル）

## Forbidden Area

- `.shared-workflows/**`（submodule内の変更は禁止）
- 既存のHUD機能の破壊的変更

## Constraints

- テスト: E2EテストでPomodoro/集中タイマー機能を検証
- フォールバック: タイマーが無効な場合、通常のHUD表示にフォールバック
- 外部通信: 不要（クライアントサイドのみ）

## DoD

- [x] Pomodoroタイマー機能を実装（25分作業、5分休憩）
- [x] 集中タイマー機能を実装（カスタム時間設定）
- [x] HUD連携機能を実装（タイマー表示、通知）
- [x] セッション管理機能を実装（セッション履歴、統計）
- [x] タイマーUIを実装
- [x] E2Eテストを追加
- [x] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 既存のHUD機能（`js/hud.js`）との統合を考慮
- タイマーデータの保存形式を検討（LocalStorage）
- アクセシビリティを考慮（音声通知オプション）
