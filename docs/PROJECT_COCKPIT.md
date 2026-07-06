# Project Cockpit

Zen Writer の現行レビュー入口を、実装・検証・手動判断が混ざらない形でまとめるローカル cockpit。

## 現在の確認面

| 面 | 目的 | 現在の状態 | 次に見ること |
| --- | --- | --- | --- |
| Full showcase capture | 広い GUI 状態を一括で review する | `node scripts/capture-full-showcase.js` が sidebar categories / current settings route / Design Cockpit / themes / focus compat / normal shell / Editor parity / mobile / Reader parity を生成する | `output/showcase/full-*` の `manifest.json` / `readback.json` / PNG を確認する |
| UI capture verification | 現行 UI の evidence を screenshot と readback で残す | `npm run test:ui:capture` が main / advanced settings sidebar / Design Cockpit / help / edit sidebar / command palette / mobile sidebar を生成する | `output/playwright/manual-verification-*` の `manifest.json` / `readback.json` / PNG を確認する |
| First Writing Comfort | fresh/reset launch から書き始め、保存、reload 復帰までを読む | 空の Rich editing は本文に入らない短い自動保存 hint を表示し、`e2e/first-writing-comfort.spec.js` が launch-to-writing path を確認する | ヒントが邪魔にならず、入力後に消え、保存状態と Design Cockpit が本文漏れなく読めるかを見る |
| Daily Document Lifecycle | Documents panel を日常の原稿棚として使えるか読む | `e2e/daily-document-lifecycle.spec.js` が current document marker、2 文書の書き分け、文書切替、selection-to-editor focus return、reload 復帰、`TXT/JSON` 外部退避 route を確認する | Documents tree の `現在` marker が狭幅でも邪魔にならず、文書選択後にすぐ書き続けられるかを見る |
| Design Cockpit | 執筆前に保存状態、文字数、文書 identity、編集面、UI shell、レビュー用要約を同時に読む | `Design Cockpit` command または `?designCockpit=1` で開く app-local dashboard | 実使用サイズで「保存状態が見つけやすいか」「書き始める導線が邪魔をしないか」を見る |
| Writing status chip | 通常執筆中の保存/文字数 status | 非操作型 status のまま維持。Reader / memo lab 中は隠れる | 新しい保存失敗 evidence が出た時だけ扱う |
| Reader / replay surface | 読者視点の一時確認 | 編集面とは別 surface として維持。`dialogue` / upright `monologue` / explicit `tilted-monologue` と取り消し線は Editor parity readback と並べて確認する | 新しい表示差分が出た時だけ扱う |
| Text expression preset catalog | 特殊テキスト表示のID・意味・surface・status・risk noteを確認する | `docs/TEXT_EXPRESSION_PRESETS.md` が review-facing catalog。runtime authority は `TextboxPresetRegistry` / `TextEffectDictionary` / `TextAnimationDictionary` / `TextOrnamentDictionary` | 新しいpreset / ruby / kenten / typing / dialog / scroll / pathtextを足す時、default tilt/animationの意味をここで先に分類する |

## Design Cockpit の境界

- Dashboard は app-local / non-public のレビュー面。公開 upload、account、cloud sync、外部共有、保存モデル変更は含まない。
- 本文内容は表示・コピーしない。レビュー要約は `manuscript_content=copied_never` を含み、document id / selected type / shell 状態までに留める。
- `保存` は既存 `ZenWriterEditor.saveContent()` を呼ぶ dashboard-scoped 導線で、writing status chip の意味を変えない。
- `書き始める` は dashboard を閉じて editor focus へ戻すだけで、Reader / left nav / mode model を増やさない。

## 最新の検証入口

- Full showcase parity route: `node scripts/capture-full-showcase.js`
- Latest cross-terminal handoff note: `docs/verification/2026-07-06/cross-terminal-handoff-after-text-expression-preset-governance.md`
- Latest full showcase / preset governance note: `docs/verification/2026-07-06/text-expression-preset-governance.md`
- Previous reader parity note: `docs/verification/2026-07-06/reader-preview-preset-parity-audit.md`
- Previous route-alignment note: `docs/verification/2026-07-06/full-showcase-capture-alignment.md`
- Capture route: `npm run test:ui:capture`
- Latest capture recovery note: `docs/verification/2026-07-06/capture-verification-recovery.md`
- Latest Documents selection focus note: `docs/verification/2026-07-07/documents-selection-focus-return.md`
- Latest daily document lifecycle note: `docs/verification/2026-07-07/daily-document-lifecycle-comfort.md`
- Latest first-writing comfort note: `docs/verification/2026-07-06/first-writing-comfort-checkpoint.md`
- Verification note: `docs/verification/2026-07-06/design-cockpit-writing-trust.md`
- Focused E2E: `e2e/design-cockpit.spec.js`
- Access: `F2` -> `Design Cockpit`, or `http://127.0.0.1:9080/index.html?designCockpit=1`
