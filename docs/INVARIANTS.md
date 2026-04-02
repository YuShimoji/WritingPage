# Invariants

破ってはいけない条件・責務境界・UX不変量を保持する正本。

## UX / Algorithmic Invariants

- UI モード切替の単一入口は `setUIMode`。直接 `setAttribute('data-ui-mode', ...)` は禁止
- `blank` モード指定は `focus` にフォールバックする
- chapterMode は全ドキュメントで自動適用 (`ensureChapterMode`)。章追加は `Store.createChapter()` 経路のみ
- サイドバー開閉は `toggleSidebar()` → `s.sidebarOpen` に永続化。`setUIMode` Normal 復帰時に復元
- エッジグローは Focus モードのみ
- フローティングツールバーは Reader モードでも非表示
- WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー `[...]` 経由。直接ボタンは存在しない
- 装飾グループ (toolbar-group--decorate) と Canvas Mode ボタンは HTML から完全削除済み。復活させない
- Reader exit で大きな return overlay をエディタ操作領域の上に残さない
- Focus モードでツールバーの top gap やサイドパネルの writing surface 重なりを生じさせない

## Slim Mode Invariants

- `data-sidebar-slim="true"` はアプリ起動時に `bootstrapAccordion()` で常時設定される
- slim モードではガジェット chrome (detach/help/chevron ボタン) が `display: none !important` になる
- テスト時は `enableAllGadgets` / `disableWritingFocus` で slim を解除する

## E2E Test Invariants

- テストの beforeEach では `ensureNormalMode(page)` を呼び、保存設定が Focus の場合の暴走を防ぐ
- `page.click('#toggle-sidebar')` は viewport 外エラーの原因になるため、`openSidebar(page)` (evaluate 経由) を使用する
- Visual Audit は screenshot refresh だけでは有効ではない。実 UI フローを通じた状態証明 + 重複画像検出が必要

## Responsibility Boundaries

- AI は執筆しない。制作システム整備が役割
- EPUB/DOCX 出力はスコープ外 (2026-03-23 除外決定)
- OAuth / Electron 配布は現フェーズの対象外

## Prohibited Interpretations / Shortcuts

- rejected を「工程不要」と解釈しない
- ユーザー未指定の固有名詞・方式を勝手に採用しない
- 振り子判断 (「前回 UI が多かったから次はコンテンツ」) で作業を選ばない

## 運用ルール

- ユーザーが一度説明した非交渉条件は、同一ブロック内でここへ固定する
- `project-context.md` の DECISION LOG には理由を短く残し、ここには条件そのものを残す
