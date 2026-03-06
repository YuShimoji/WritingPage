# REPORT_TASK_055_followup_tracking_20260226

## 概要
- 作成日: 2026-02-26
- 対象ブランチ: `refactor/editor-js`
- 目的: 直近セッションで報告された懸念点の「解消有無」を追跡可能にし、再開者が同じ手順で確認できるようにする

## 変更コミット（時系列）
- `ad75267`: `dist` ビルド導線（サーバー不要確認）を追加
- `02b93f8`: Documents gadget の `printCurrent` 参照エラー修正、スタートメニュー導線追加
- `e6f2f50`: リッチテキストUX改善・ヘッダー整理（この時点で表示崩れ副作用あり）
- `48cf0da`: 表示崩れ/パネル見切れ/ドラッグ不可/リッチテキスト連携不整合を修正

## 懸念点トラッカー
| ID | ユーザー報告 | 原因 | 対応 | 参照 |
|---|---|---|---|---|
| C-01 | Index 起動しかできず、スタートメニュー登録できない | 配布導線が `index.html` 直接起動のみ | `app:install` で `dist` 生成 + Start Menu ショートカット生成を導入 | `ad75267`, `02b93f8` |
| C-02 | Documents gadget failed: `printCurrent is not defined` | `printCurrent` のスコープ不整合 | `gadgets-builtin.js` 側の参照不整合を解消 | `02b93f8` |
| C-03 | ヘッダー表示が `??` になる、機能群が判別しづらい | 置換時の文言破損（`????` 混入） | ヘッダー文言を復旧し、機能群を固定ラベル化 | `48cf0da`, `index.html` |
| C-04 | フォント装飾/クイックツールが見切れる、ドラッグ不可 | `floating-panel` が右下固定のみでドラッグ実装なし | 共通ドラッグ・画面内補正・前面化を追加 | `48cf0da`, `js/app-ui-events.js`, `css/style.css` |
| C-05 | リッチテキストで装飾が効かない/挙動が不一致 | `manager.richTextEditor` 未接続でWYSIWYG分岐が機能不全 | 接続復旧し、WYSIWYG装飾処理へ正しく分岐 | `48cf0da`, `js/editor-wysiwyg.js` |
| C-06 | `[underline]` 等が `\[underline]` になりプレビュー不整合 | HTML→Markdown 変換でカスタムタグがエスケープ | カスタムタグの逆エスケープ正規化を追加 | `48cf0da`, `js/editor-wysiwyg.js`, `js/modules/editor/EditorCore.js` |

## 確認手順（再開者向け）
1. 依存確認
   - `npm ci`
2. 静的検証
   - `npm run lint:js:check`
3. スモーク
   - `npm run test:smoke`
4. 実機確認（サーバー不要）
   - `npm run app:install`
   - スタートメニューの `Zen Writer` を起動
5. 画面確認チェック
   - ヘッダーに `??` が表示されない
   - フォント装飾パネルが画面外に逃げず、ヘッダー部分ドラッグで移動できる
   - 右下歯車のクイックツールも同様にドラッグ移動できる
   - WYSIWYGで選択文字への太字/斜体/下線が反映される
   - `[bold]...[/bold]` 等が `\[bold]` に化けない

## 実行ログ（2026-02-26）
- `npm run lint:js:check`: PASS
- `npm run test:smoke`: PASS
- `npm run app:install`: PASS（`dist` 再生成、Start Menu ショートカット更新）

## 残リスク
- WYSIWYG E2E は `e2e/wysiwyg-editor.spec.js` が `describe.skip` のため、CI自動回帰検知は未整備
- 本追跡は手動確認を含むため、将来は最小E2E（ヘッダー表示破損/パネルドラッグ/WYSIWYGタグ正規化）を追加推奨
