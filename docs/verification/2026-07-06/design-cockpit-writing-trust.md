# Design Cockpit writing trust dashboard

## 目的

執筆前の不安を「どこに保存されているか」「今保存済みか」「どの文書を見ているか」「どの表示条件でレビューしているか」に分解し、作家が本文を開かずに状態を確認できる app-local dashboard を追加した。

## 変更した面

| 変更 | 効果 | 境界 |
| --- | --- | --- |
| `Design Cockpit` command | command palette から保存・執筆準備・レビュー状態を一画面で確認できる | 常設 toolbar や新しい公開 surface は作らない |
| `?designCockpit=1` | ローカル確認 URL から dashboard を直接開ける | 外部公開 route ではない |
| dashboard-scoped `保存` | 既存 `ZenWriterEditor.saveContent()` を使って手動保存導線を確認できる | 保存モデル、autosave、storage schema は変更しない |
| review summary | 本文をコピーせず、document id / selected type / shell state / save state を共有できる | manuscript body text は表示・コピーしない |

## 検証結果

このメモの validation は同日 closeout 時点の実行結果を正とする。

- `npm run test:smoke`: passed (`ALL TESTS PASSED`)
- `npx playwright test e2e/design-cockpit.spec.js --workers=1`: passed (2 tests)
- `npm run lint:js:check`: passed
- `npm run build`: passed (`dist` refreshed locally)
- `npm run test:ui:capture`: failed outside the Design Cockpit surface; the existing capture script still waits for `#settings-modal` to become visible after `ZenWriterApp.openSettingsModal()`, while the current settings path is sidebar/advanced-oriented. This is recorded as capture-script residue, not cockpit acceptance failure.
- `git diff --check`: clean for this slice's tracked files; the worktree also contains a pre-existing `.serena/project.yml` line-ending warning that was not touched or staged.

## 意図的に変えていないこと

- writing status chip は非操作型 status のまま。
- Reader / replay surface、left nav hierarchy、command palette の state model は変更していない。
- 本文、章、Documents、import/export、Electron packaging、cloud/account/public sharing は対象外。
- fresh-launch observation gate の user-side visual confirmation は、この slice では閉じていない。
