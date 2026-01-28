# Task: パフォーマンスベースラインの計測と記録
Status: DONE
Tier: 2
Branch: feature/perf-baseline
Created: 2026-01-28

## Objective
現在のアプリケーションのパフォーマンス（起動速度、ペースト速度、レンダリング応答）を計測し、ベースラインとして記録する。
今後の機能追加（プラグイン等）による劣化を検知できるようにする。

## Focus Area
- `scripts/perf-paste-test.js` (既存テスト)
- `scripts/perf-load-test.js` (新規作成: ロード時間計測)
- `docs/reports/` (レポート出力先)

## Forbidden Area
- `.shared-workflows/**`
- プロダクションコードの変更（計測用フックが必要な場合は最小限に）

## Constraints
- 計測環境（Local Dev）での値を記録する。
- 3回以上の試行平均を採用する。

## DoD
- [ ] `scripts/perf-paste-test.js` の実行結果が記録されている
- [ ] `scripts/perf-load-test.js` が作成され、実行結果が記録されている
- [ ] パフォーマンスレポート `docs/reports/PERFORMANCE_BASELINE_20260128.md` が作成されている
