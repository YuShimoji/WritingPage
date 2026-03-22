# IndexedDB ストレージ移行仕様書 (SP-077)

## 概要

localStorage (5-10MB制限) から IndexedDB へ大容量データを移行し、
大規模文書・多数の画像アセット・長期スナップショット履歴に対応する。

---

## 背景課題

- `zenWriter_docs` が全ドキュメントの本文をインラインで保持 → 大規模文書で5MB制限に到達
- `zenWriter_assets` が画像をBase64丸ごと保持 → 数枚で数MB消費
- `zenWriter_snapshots` が最大10個の全文コピー → 内容量×10の乗算
- localStorage は同期APIのため、大量データの読み書きでUIがブロックされる
- `QuotaExceededError` 発生時のリカバリ手段がない（現状はconsole.logのみ）

---

## 目的

- ドキュメント本文・画像アセット・スナップショットを IndexedDB に移行する
- 小さな設定・UIステートは localStorage に残す（高速アクセス）
- 移行はアプリ起動時に自動実行（ユーザー操作不要）
- 既存の `window.ZenWriterStorage` API を維持し、呼び出し元の変更を最小化する

---

## データ分類

### IndexedDB に移行するデータ（大容量・低頻度更新）

| localStorage キー | IndexedDB Store | 理由 |
|---|---|---|
| `zenWriter_docs` | `documents` | 全文書インライン。最大のサイズリスク |
| `zenWriter_content` | `documents` (currentDoc) | 現在文書の本文。docs と連動 |
| `zenWriter_assets` | `assets` | Base64画像。1件で数百KB |
| `zenWriter_snapshots` | `snapshots` | 全文コピー×最大10。内容量依存 |
| `zenWriter_story_wiki` | `wiki` | 大量のWikiエントリ |
| `zw_nodegraph:*` | `nodegraph` | ドキュメントごとのノードグラフ |

### localStorage に残すデータ（小容量・高頻度参照）

| キー | 理由 |
|---|---|
| `zenWriter_settings` | 起動時即座に参照。数KB |
| `zenWriter_currentDocId` | 単一文字列 |
| `zenWriter_gadgets:*` | ガジェット設定。小容量 |
| `zenwriter-*` (各種UIステート) | フラグ値。数十バイト |
| `zenWriter_colorPresets` | 小容量JSON |
| `zenWriter_keybinds` | 小容量JSON |
| `zenWriter_searchHistory` | 小配列 |

---

## IndexedDB スキーマ

### データベース名: `ZenWriterDB`

### バージョン: 1

```
ObjectStore: documents
  keyPath: id
  indexes: [parentId, updatedAt]
  // 各ドキュメントを個別レコードとして保存
  // { id, type, name, content, parentId, createdAt, updatedAt }

ObjectStore: assets
  keyPath: id
  // { id, dataUrl, name, type, size, createdAt }

ObjectStore: snapshots
  keyPath: id
  indexes: [ts]
  // { id, ts, len, content }

ObjectStore: wiki
  keyPath: id
  indexes: [title, category]
  // { id, title, category, aliases, content, tags, relatedIds, ... }

ObjectStore: nodegraph
  keyPath: docId
  // { docId, nodes, edges }
```

---

## 移行戦略

### Phase 1: コア文書移行

1. `js/storage-idb.js` を新規作成（IndexedDB ラッパー）
2. `js/storage.js` の `saveDocuments` / `loadDocuments` / `updateDocumentContent` を IndexedDB 対応に改修
3. 起動時に localStorage の `zenWriter_docs` が存在すれば IndexedDB に移行し、localStorage から削除
4. `zenWriter_content` は `zenWriter_currentDocId` と連動して IndexedDB から読み書き
5. 移行中のフォールバック: IndexedDB が使えない環境では localStorage を継続使用

### Phase 2: アセット + スナップショット移行

1. `zenWriter_assets` → `assets` store
2. `zenWriter_snapshots` → `snapshots` store
3. 起動時自動移行 + localStorage 削除

### Phase 3: Wiki + ノードグラフ移行

1. `zenWriter_story_wiki` → `wiki` store
2. `zw_nodegraph:*` → `nodegraph` store
3. 起動時自動移行

---

## API 設計

### `window.ZenWriterIDB` (storage-idb.js)

```javascript
// 初期化（起動時に1回）
await ZenWriterIDB.open()

// ドキュメント操作
await ZenWriterIDB.getDoc(id)           // → doc object
await ZenWriterIDB.putDoc(doc)          // → void
await ZenWriterIDB.deleteDoc(id)        // → void
await ZenWriterIDB.getAllDocs()          // → doc[]
await ZenWriterIDB.getDocsByParent(pid) // → doc[]

// アセット操作
await ZenWriterIDB.getAsset(id)         // → asset object
await ZenWriterIDB.putAsset(asset)      // → void
await ZenWriterIDB.deleteAsset(id)      // → void
await ZenWriterIDB.getAllAssets()        // → asset[]

// スナップショット操作
await ZenWriterIDB.getSnapshots()       // → snapshot[]
await ZenWriterIDB.addSnapshot(snap)    // → void
await ZenWriterIDB.clearSnapshots()     // → void

// 移行
await ZenWriterIDB.migrateFromLocalStorage() // → { migrated: boolean, counts: {} }
```

### `window.ZenWriterStorage` 互換レイヤー

既存の同期API (`loadDocuments()` / `saveDocuments()` 等) は、
初回ロード時にIndexedDBから全データをメモリキャッシュに読み込み、
書き込みはメモリ更新 + 非同期IndexedDB書き込みで同期API互換を維持する。

```
起動フロー:
1. ZenWriterIDB.open()
2. ZenWriterIDB.migrateFromLocalStorage() // 初回のみ
3. メモリキャッシュに全docs/assets/snapshotsをロード
4. ZenWriterStorage の同期APIが使用可能に
5. 書き込み時: メモリ更新 → requestIdleCallback で IDB flush
```

---

## 受け入れ基準

1. 既存のlocalStorageデータがIndexedDBに自動移行される
2. 移行後、localStorage の大容量キーが削除される
3. `ZenWriterStorage` の既存APIが変更なく動作する
4. 10MB超のドキュメントセットでもエラーなく保存・読込できる
5. IndexedDB 非対応環境ではlocalStorageフォールバックが機能する
6. 移行中にアプリがクラッシュしても、次回起動時にリトライされる

---

## 実装リスク

- **非同期化の波及**: 既存コードが同期APIを前提としている。メモリキャッシュで吸収するが、初回ロード待ちが必要
- **データ整合性**: 移行途中のクラッシュ → localStorage に残データがあれば再移行
- **ブラウザ互換**: IndexedDB は主要ブラウザで広くサポート。Private browsing では制限あり
- **容量制限**: IndexedDB も無制限ではない（ブラウザごとにディスクの50%等）。実用上は数百MBまで問題なし

---

## 影響範囲

- `js/storage-idb.js`: 新規。IndexedDB ラッパー
- `js/storage.js`: loadDocuments/saveDocuments/updateDocumentContent の IDB 対応
- `js/app.js`: 起動時に `ZenWriterIDB.open()` + マイグレーション呼び出し
- `index.html`: `storage-idb.js` スクリプトタグ

---

## 段階的実装

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | IDBラッパー + ドキュメント移行 + メモリキャッシュ互換レイヤー | done |
| Phase 2 | アセット + スナップショット移行 | done |
| Phase 3 | Wiki移行 (メモリキャッシュ + IDBフラッシュ) | done |
| Phase 4 | ノードグラフ移行 (`zw_nodegraph:*` → nodegraph store) | done |
