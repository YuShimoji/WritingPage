# 章ストア・プレビュー周りの安全リファクタリング目安

**目的**: 「表示」「プレビュー」「入力ハンドラ」が**永続データを暗黙に変える**パターンを増やさない。`session 87` のインシデント（読者プレビュー経由の一括 `splitIntoChapters`、`CURRENT_DOC_ID` と親ドキュメント ID の不一致、`ensureSaved` による `doc.content` の単一章化）を再発させない。

**正本との関係**: 不変条件の列挙は [`INVARIANTS.md`](INVARIANTS.md)。章データモデルは [`specs/spec-chapter-management.md`](specs/spec-chapter-management.md) および `js/chapter-store.js` のコメントを参照。

---

## 1. 読み取り経路でミューテーションをしない

| 臭い | 例 | 推奨 |
|------|-----|------|
| `getFoo` / `render` / `preview` / `toHtml` 内で `save*` / `split*` / `create*` | ~~`getFullContentHtml` が `splitIntoChapters` を呼ぶ~~（session 87 で削除） | **表示用の Markdown/HTML を組み立てるだけ**にする。永続化が必要なら明示的コマンド・移行処理・`ensureChapterMode` など別関数へ |
| 条件付き同期が「空配列 + 長文」で発火 | `getChaptersForDoc(id).length === 0` かつエディタ全文が長い、など | 空配列の意味を定義する（未初期化か、親 ID 誤りか）。**推測で分割しない** |

**監査用 grep（リポジトリルート）**

```bash
rg "splitIntoChapters" js/
rg "saveDocuments\(|saveContent\(" js/reader-preview.js js/editor-preview.js
```

---

## 2. `getCurrentDocId()` をそのまま章ストアのキーに使わない

`ZenWriterStorage.getCurrentDocId()` は**常に `type: 'document'` を指すとは限らない**（章レコード ID が残る経路・ツリー誤選択・将来の階層 UI 拡張）。`ZWChapterStore.getChaptersForDoc` / `createChapter` / `assembleFullText` には**親ドキュメント ID**が必要。

| 実装 | 役割 |
|------|------|
| `js/chapter-list.js` の `getDocumentIdForChapterOps()` | チャプター UI・章操作の正規化 ID |
| `js/sidebar-manager.js` の `_resolveChapterNavDocId()` | 執筆レール章ナビ用 |
| `js/reader-preview.js` の `resolveDocumentIdForChapterStore()` | 読者プレビュー結合用 |

**新規コードでは**: 上記と同じロジックを**3 か所にコピペ増殖**させず、可能なら `js/chapter-store.js` または `ZenWriterStorage` に **1 つの `resolveParentDocumentId(rawId)`** へ集約するのが望ましい（別スライスで可）。

**監査用 grep**

```bash
rg "getCurrentDocId\(\)" js/ | rg "getChaptersForDoc|createChapter|assembleFullText"
```

（ヒットしたら「正規化 ID を通しているか」を確認）

---

## 3. chapterMode と `ensureSaved` / `saveContent`

`ZWContentGuard.ensureSaved()` は `saveContent(getEditorContent())` で**現在のドキュメントレコードの `content` を更新**する。chapterMode ではエディタは**アクティブ章の本文**のみを示すことが多く、`doc.content` を**結合全文**として使う前提と混ざると不整合になる。

| 状況 | 推奨 |
|------|------|
| 章の追加・並べ替え・複製の直前 | **`flushChapterIfNeeded()` のみ**（アクティブ章をストアへ書く）。`ensureSaved` は**必須でない限り避ける** |
| 自動保存（`app-autosave-api.js`） | 既存どおり `assembleFullText` で全文を組んで `saveContent` する経路と役割を混同しない |

---

## 4. DOM イベントの二重登録・連打

動的に挿入されるボタン（執筆レールの「+ 追加」など）に `addEventListener` する場合:

- 初期化が**複数回**呼ばれる可能性に備え、`data-*` フラグで **1 回だけバインド**する、または `onclick =` で上書き、または `AbortController` で旧リスナを外す
- ユーザー操作 1 回で多重処理が走る場合は**短いリエントランシガード**（数百 ms）を検討

---

## 5. プロジェクト全体で同種の「傾向」を探すとき

次のキーワードで**副作用の塊**を見つけやすい。

| キーワード | 注意点 |
|------------|--------|
| `dispatchEvent.*Changed` | リスナが連鎖して保存・再分割を起こしていないか |
| `MutationObserver` + 保存系 | 属性変化で毎回 `saveContent` していないか |
| `innerHTML =` の直後にストア読み | タイミングで「空」や古いキャッシュを読んで補正ロジックが暴れていないか |
| `loadDocuments` の戻りを**直接 mutate** してから `saveDocuments` | 意図した 1 レコード更新か、全体コピーかを明示 |

---

## 6. 回帰テストの置き場所（参考）

- 章 UI + 執筆レール: `e2e/sidebar-writing-focus.spec.js`, `e2e/chapter-list.spec.js`
- 読者プレビュー: `e2e/reader-preview.spec.js`（変更時は Phase 3 台帳と照合）

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-04-10 | 初版（session 87 インシデント対応と横断目安の文書化） |
