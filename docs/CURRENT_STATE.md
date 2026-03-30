# Current State

最終更新: 2026-03-30

## Snapshot

| 項目 | 状態 |
|------|------|
| プロジェクト | Zen Writer (WritingPage) |
| バージョン | v0.3.32 |
| 想定ブランチ | `main` |
| 現在の主軸 | UI/UX の磨き上げと未完了機能の安全な局所化 |
| 直近の重点仕様 | `SP-053` 執筆集中サイドバー, `SP-062` テキスト表現アーキテクチャ |

## この時点で信頼できること

- UI モードは `normal / focus / reader` の 3 種を `setUIMode` で切り替える
- 執筆集中サイドバーは未完了のため、`focus` モード時だけ有効
- `normal` モードでは従来のサイドバーアコーディオンを維持する
- `blank` 指定は互換のため `focus` にフォールバックする
- Electron の「超ミニマル」は `setUIMode` 経由で `focus` 系へ正規化して扱う
- コマンドパレットの UI モード切替は hidden `select` を使わず、`ZenWriterApp.setUIMode()` と可視モードボタン経由に統一
- hidden `ui-mode-select` 要素は HTML から完全削除済み (session 36)

## 2026-03-30 に修正したこと

| 項目 | 変更内容 | 影響ファイル |
|------|----------|-------------|
| 執筆集中サイドバーの暴走停止 | 常時有効だった執筆集中 sidebar を `focus` モード限定に変更 | `js/sidebar-manager.js`, `css/style.css` |
| 通常 UI の復旧 | `normal` で `edit/theme/assist/advanced` が見えなくなる不具合を解消 | `js/sidebar-manager.js`, `css/style.css` |
| UI モード経路の一本化 | `window.ZenWriterApp.setUIMode/getUIMode` を公開し、周辺機能がそれを使用 | `js/app.js`, `js/command-palette.js`, `js/electron-bridge.js` |
| Electron / 互換導線の整理 | UI モード系統を `setUIMode` 優先に寄せた | `js/app.js`, `js/command-palette.js`, `js/electron-bridge.js` |
| ドキュメント同期 | 執筆集中サイドバーの発動条件を仕様へ明文化 | `docs/specs/spec-writing-focus-sidebar.md` |
| 回帰テスト更新 | sidebar-writing-focus の期待値を現仕様に同期 | `e2e/sidebar-writing-focus.spec.js` |

## 検証結果

実行済み (session 36):

- `npm run lint:js:check` → 0 errors / 0 warnings
- `npx playwright test --reporter=line` → 526 passed / 0 failed / 3 skipped

未実施:

- Electron 実機でのメニュー経由確認

## 現在の優先課題

| 優先 | テーマ | 内容 |
|------|--------|------|
| A | UI/UX磨き上げ | 古い hidden UI 要素、互換レイヤ、重複導線の整理 |
| A | 完了扱いの再監査 | 「partial / in-progress / 実装済みだが境界未整理」の再棚卸し |
| B | テキスト表現 Tier 1 | `SP-062` の仕様追記と実装整合 |
| B | サイドバー UX | tabs/accordion/loadout 周辺の導線整理 |

## 既知の注意点

- `docs/spec-index.json` には、現ワークツリーにファイルが存在しない historical entry も含まれる
- `HANDOVER.md` と `CLAUDE.md` は再開導線として使うが、現在地の正本はこのファイルと各仕様書を優先する
- `docs/README.md` は「今使うドキュメント」と「履歴上の参照」を分けて読む

## Canonical Gaps

今回の handoff 指示で同期対象になっていたが、この repo には存在しなかったもの:

- `docs/ai/*.md`
- `docs/INVARIANTS.md`
- `docs/USER_REQUEST_LEDGER.md`
- `docs/OPERATOR_WORKFLOW.md`
- `docs/INTERACTION_NOTES.md`
- `docs/runtime-state.md`
- `docs/project-context.md`
- `docs/FEATURE_REGISTRY.md`
- `docs/AUTOMATION_BOUNDARY.md`

今回の再開文脈・制約・痛点は、代替として `docs/CURRENT_STATE.md`, `docs/PROJECT_HEALTH.md`, `HANDOVER.md`, `CLAUDE.md` に同期している。

## 再開時の最短ルート

1. `docs/CURRENT_STATE.md` を読む
2. `HANDOVER.md` の再開手順を実行する
3. 今回の UI/状態管理の文脈が必要なら `docs/specs/spec-writing-focus-sidebar.md` を読む
4. 中長期の優先順位は `docs/ROADMAP.md` を見る
