# Project Cockpit

Zen Writer の現行レビュー入口を、実装・検証・手動判断が混ざらない形でまとめるローカル cockpit。

## 現在の確認面

| 面 | 目的 | 現在の状態 | 次に見ること |
| --- | --- | --- | --- |
| Design Cockpit | 執筆前に保存状態、文字数、文書 identity、編集面、UI shell、レビュー用要約を同時に読む | `Design Cockpit` command または `?designCockpit=1` で開く app-local dashboard | 実使用サイズで「保存状態が見つけやすいか」「書き始める導線が邪魔をしないか」を見る |
| Writing status chip | 通常執筆中の保存/文字数 status | 非操作型 status のまま維持。Reader / memo lab 中は隠れる | 新しい保存失敗 evidence が出た時だけ扱う |
| Reader / replay surface | 読者視点の一時確認 | 編集面とは別 surface として維持 | 新しい表示差分が出た時だけ扱う |

## Design Cockpit の境界

- Dashboard は app-local / non-public のレビュー面。公開 upload、account、cloud sync、外部共有、保存モデル変更は含まない。
- 本文内容は表示・コピーしない。レビュー要約は `manuscript_content=copied_never` を含み、document id / selected type / shell 状態までに留める。
- `保存` は既存 `ZenWriterEditor.saveContent()` を呼ぶ dashboard-scoped 導線で、writing status chip の意味を変えない。
- `書き始める` は dashboard を閉じて editor focus へ戻すだけで、Reader / left nav / mode model を増やさない。

## 最新の検証入口

- Verification note: `docs/verification/2026-07-06/design-cockpit-writing-trust.md`
- Focused E2E: `e2e/design-cockpit.spec.js`
- Access: `F2` -> `Design Cockpit`, or `http://127.0.0.1:9080/index.html?designCockpit=1`
