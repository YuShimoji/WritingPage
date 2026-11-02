# Story Wiki タイトル一意性・カスタムカテゴリ追加

## 目的と範囲

仕様に記載されながらUIで満たしていなかった、記事タイトルの一意性とカスタムカテゴリの追加導線を、既存Story Wiki UI・localStorage/IndexedDBのデータ形式を保って補う。過去の重複記事を自動変更せず、作成・改名の保存時だけ競合を拒否する。

## 変更と判定規則

- 新規記事作成と記事改名は、前後空白をtrimしたタイトルの完全一致で既存記事を調べる。大文字小文字やUnicode正規化の新ルールは導入していない。
- 編集対象自身は競合比較から除外するため、同じタイトルの保存は通る。競合時は記事を開く案内をフォーム内に表示し、変更を保存しない。
- 記事の編集フォームからカスタムカテゴリ名を入力して、`saveStoryWikiCustomCategories` を呼び出す。成功時、新カテゴリをセレクトへ加えてその記事に選択し、通常の「保存」で割り当てる。カテゴリ追加または記事保存後に再読込して両方の維持を確認する。
- 既存WikiEntry/WikiCategory形式とstorage schemaは変更していない。既存重複データを削除・統合する移行処理もない。

## 検証結果

| 確認 | 結果 | 証拠 |
|---|---|---|
| 新規作成の重複拒否 | PASS | `e2e/wiki.spec.js` focused case。重複案内が見え、作成dialogが残る |
| 改名の重複拒否 | PASS | 同ケース。別タイトルへ改名しようとした競合を拒否し、同じ記事の既存タイトル保存は通過 |
| 既存重複データの保持 | PASS | 同ケース。以前のデータに同名が2件ある場合も自動削除されず、記事単位の改名だけが拒否される |
| カスタムカテゴリ追加・記事割当 | PASS | `e2e/wiki.spec.js` focused case。UI追加後にそのカテゴリを選択し保存 |
| reload後のカテゴリ・割当維持 | PASS | 同ケース。`loadStoryWikiCategories()` と `getStoryWikiEntry()` の読戻し、および詳細badgeを確認 |
| Syntax / smoke | PASS | `node --check js/story-wiki.js`、`node --check e2e/wiki.spec.js`、`npm run test:smoke` |
| focused E2E | PASS | `npx playwright test e2e/wiki.spec.js --grep "prevents duplicate titles|adds a custom category" --workers=1` — 2 passed |
| 既存Wiki E2E全体 | PASS | `npx playwright test e2e/wiki.spec.js --workers=1` — 25 passed (1.6m) |
| Electron native | NOT RUN | Electron候補はWiki変更前のsource `33dd238a...`。このWiki変更を含むnative evidenceではないため、実施済み扱いにしない |

## Source / package位置づけ

- Wiki作業開始時 source: `0d80b82649aa4ae882b200811b13655f45e3cdc2`（CI/Electron担当がclean状態で占有終了後）
- CI/Electron担当候補 source: `33dd238a321fa0c8cc06c4aca6ab085629e380f6`。成功CI `41395033055`、隔離profileの保存・再起動確認はこのWiki変更より前のsourceに対する証拠であり、Wikiの実装・native合格へ流用しない。
- Visual evidence: `output/playwright/wiki-requirements-2026-11-02/edit-category-390x844-viewport.png` (viewport screenshot)、`detail-390x844.png` (full-page capture)。遮蔽確認はviewport screenshotを基準とした。local outputはignored。`node scripts/dev-server.js 19082` によるlocal HTTP上でE2E helperを再利用し、読み取り専用のgeometryを計測した。`output/playwright/wiki-requirements-2026-11-02/edit-category-390x844.png` はfull-page captureのため他gadgetが続けて見える。
