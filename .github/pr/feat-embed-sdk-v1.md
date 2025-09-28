# PR: Embed SDK v1 + CI Smoke + Issues Sync 改善

## 概要 / Summary
- Embed SDK v1（同一オリジン優先 + 将来postMessage対応の枠組み）
- indexの埋め込みモード（`?embed=1`）で最小UI化、`ZenWriterAPI` を公開してSDKから安定利用
- 埋め込みデモ（`embed-demo.html`）のfavicon 404解消（`/favicon.ico -> /favicon.svg` フォールバック）
- `docs/EMBED_TESTING.md` 追加（手順・失敗時対処・回帰観点）／`docs/TESTING.md` から参照
- GitHub Actions: `sync-issues.yml` を拡張（`docs/ISSUES.md`→Issue 作成/更新/再オープン/不要クローズ、ラベルのフォールバック処理）
- CI Smoke（`ci-smoke.yml`）を追加。`dev-server` 起動→`dev-check` 実行でスモーク検証

## 変更点 / Changes
- `index.html`: `?embed=1` 検出→`<html data-embed="true" data-toolbar-hidden>`。子ブリッジ `js/embed/child-bridge.js` を読み込み
- `css/style.css`: `html[data-embed="true"]` でサイドバー/ツールバー等を非表示、エディタ全画面
- `js/app.js`: `window.ZenWriterAPI`（`getContent/setContent/focus/takeSnapshot`）を公開
- `js/embed/zen-writer-embed.js`: `ZenWriterAPI` 優先で同一オリジン高速化、postMessage（READY/RPC）実装
- `js/embed/child-bridge.js`: 子側postMessage受信、READY通知／RPC応答
- `embed-demo.html`: `<link rel="icon" href="favicon.svg">` 追加
- `scripts/dev-server.js`: `/favicon.ico` を `/favicon.svg` にフォールバック
- `scripts/dev-check.js`: embed-demo と favicon のチェックを追加
- `.github/workflows/sync-issues.yml`: `docs/ISSUES.md` 解析＋堅牢化、`feat/**` でもトリガー
- `.github/workflows/ci-smoke.yml`: 新規追加
- `docs/EMBED_TESTING.md`: 新規追加。`docs/TESTING.md` から参照
- `docs/ISSUES.md`: 26〜28（postMessage・軽量化・CI）を追記

## テスト / Testing
- ローカル: `node scripts/dev-check.js` → ALL TESTS PASSED
- 手動: `/index.html` 通常起動、`/index.html?embed=1` 最小UI、`/embed-demo.html` から `set/get/focus/takeSnapshot`
- HTTP: `/embed-demo.html -> 200`、`/favicon.ico -> 200 image/svg+xml`（dev-server再起動後）
- CI: CI Smoke 追加（このPR/Pushでも走る設定）

## 今後 / Next
- PRマージ後:
  - postMessage セキュリティ強化（`origin` 厳格化、allowlist、`EMBED_SDK.md` 追記）
  - 埋め込みモードの軽量化（defer/skip最適化、preconnect、DOM削減）
  - 選択ツールチップや画像挿入などの新機能に着手

## レビューの観点
- Embed SDK の外部API（`ZenWriterAPI`）のシグネチャの妥当性
- 同一オリジン時の回帰有無（通常起動と最小UIでの差分）
- CI/Actions の発火条件と失敗時のログ収集（artifact）

Assignees/Reviewers: あなたをレビュワーにアサイン希望です。よろしくお願いします。
