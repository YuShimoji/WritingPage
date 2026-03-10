# MANUAL TEST GUIDE

## 目的

- 自動テストで拾いづらい UX 品質（見やすさ・操作しやすさ・導線の自然さ）を、短時間で再現性高く確認する。
- Playwright で画面証跡を自動収集し、レビューしやすい状態で共有する。
- 関連仕様: `docs/spec-index.json` の `SP-041` / `SP-048` / `SP-050`

## 推奨選択肢（実行順）

| 選択肢 | 使うタイミング | 所要時間目安 | 実行内容 |
|---|---|---:|---|
| A. クイック確認（推奨） | 仕様調整直後、毎日 | 10-15分 | 主要導線の手動確認 + UIキャプチャ |
| B. 回帰確認 | UI関連変更の PR 前 | 20-30分 | A + モバイル/アクセシビリティ重点確認 |
| C. リリース前確認 | リリース前日/当日 | 45-60分 | B + 長文・印刷・保存復元の最終確認 |

## 手動テストチェックリスト（表形式）

| ID | 観点 | 手順 | 期待結果 | 優先度 |
|---|---|---|---|---|
| MT-01 | 初期表示 | `index.html?reset=1` を開く | エディタ領域が表示され、致命的エラーなし | 高 |
| MT-02 | 設定モーダル | 設定を開閉する | モーダル開閉が正常、背景操作が抑止される | 高 |
| MT-03 | ヘルプモーダル | ヘルプを開閉する | モーダル開閉が正常、内容が読める | 中 |
| MT-04 | サイドバー導線 | サイドバー切替、アコーディオン切替 | 主要カテゴリへ遷移でき、表示崩れがない | 高 |
| MT-05 | コマンドパレット | コマンドパレットを開く | パレット表示、入力フォーカスが有効 | 高 |
| MT-06 | モバイル表示 | 390x844 相当でサイドバーを開く | サイドバーがモバイルレイアウトで表示される | 高 |
| MT-07 | 保存復元 | 文章入力後に再読込 | 内容が保持される（ローカル保存） | 高 |
| MT-08 | 執筆モード差分 | textarea/WYSIWYG を切替 | どちらでも編集可能、UIの破綻なし | 中 |

## Playwright 画面確認（証跡取得）

最短導線:

```bash
cd /home/planner007/code/WritingPage
npm run test:ui:capture:build
```

- ビルド済み `dist/` を対象に確認するため、リリース前の見え方に近い
- 生成された `manifest.json` にモード (`dist`) と取得画像一覧が残る

```bash
cd /home/planner007/code/WritingPage
OUT="output/playwright/manual-verification-$(date +%Y%m%d-%H%M%S)"
node scripts/capture-ui-verification.js --build --dist --port 19080 --out "$OUT"
```

出力内容（例）:

- `01-main-desktop.png`
- `02-settings-modal.png`
- `03-help-modal.png`
- `04-sidebar-desktop-open.png`
- `05-command-palette.png`
- `06-mobile-sidebar-open.png`
- `manifest.json`

## 現行UIとの対応

- 現行サイドバーはアコーディオンUIを採用している。
- 旧 `wiki` グループは `edit` へ統合済みのため、画面証跡では専用の `Wiki tab` ではなく `edit` アコーディオンを確認対象にする。
- 執筆集中IAが既定のため、実際の証跡では `edit` 単独面よりも「現行サイドバーを開いた状態」を代表画面として残す。

## 判定ルール（簡易）

- `PASS`: 期待結果を満たし、再現手順が明確。
- `FAIL`: 期待結果未達、または操作不能。
- `HOLD`: 仕様未確定/要判断で保留（仕様整理へ回す）。

## 改善提案（今回の反映済み）

1. `scripts/capture-ui-verification.js` を textarea/WYSIWYG 両対応に改善。
2. 最小ツールバー時でも設定/ヘルプの確認ができるよう DOM クリック方式に改善。
3. 証跡出力先を `output/playwright/` に統一し、レビュー時の探索コストを削減。
4. ビルド済み `dist/` を直接確認できる `npm run test:ui:capture:build` を追加。
5. ヘッドレス環境でも日本語UIが読めるよう、証跡取得時のフォント安定化を追加。
