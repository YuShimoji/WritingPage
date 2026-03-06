# SNAPSHOT_DESIGN — スナップショット詳細設計（v1→v2）

## 目的

- 文章の安全性（誤操作/ブラウザ障害/誤上書き）を高める
- 復元/比較/整理をしやすくする

## 現状（v1）

- API: `loadSnapshots()`, `addSnapshot(content, maxKeep=10)`, `deleteSnapshot(id)`
- 保存先: LocalStorage（キー `zenWriter_snapshots`）
- 1リストで最新順に保持、`{ id, ts, len, content }`
- 自動保存: 2分かつ300文字以上の差分で作成（`editor.js`）

## v2 要件

- 保持数・間隔・差分閾値を設定可能（`settings.snapshots = { maxKeep, minIntervalMs, minDeltaChars }`）
- ドキュメントID紐付け（複数ドキュメント対応）
- タグ/メモ（任意）
- 手動/自動の区別（`type: 'manual' | 'auto'`）
- 復元前プレビュー/差分（段落単位）
- エクスポート/インポート（JSON）
- 将来: IndexedDB への移行（長文/大容量の安定化）

## データモデル（v2）

```ts
// LocalStorage or IndexedDB へ保存
interface Snapshot {
  id: string; // 'snap_<ts>_<rand>'
  ts: number; // epoch ms
  docId?: string; // 紐づくドキュメントID（未設定ならカレント）
  len: number; // 文字数
  type: 'auto' | 'manual';
  tags?: string[]; // ['checkpoint','before-print'] など
  note?: string; // 任意メモ
  content: string; // 本文
}
```

- ストレージは `[{...}]` の配列を最新順に保持
- 表示時は docId でフィルタリング可能

## UI/UX

- サイドバー「バックアップ」に以下を追加
  - 保持数/間隔/閾値を調整する「詳細設定」リンク（将来: 設定ハブへ）
  - 各行に「復元」「プレビュー」「削除」「タグ」
  - 追加ダイアログでメモ/タグ入力（手動保存時）
- プレビュー: モーダルで本文を表示、差分タブで段落比較

## 差分（段落単位）

- 分割: `\n{2,}` で段落配列化
- アルゴリズム: LCS もしくは単純な行ごとの差分（v2は簡易版から）
- 強調: 追加/削除部分を `<ins>`/`<del>` で表示（印刷は未対象）

## API 拡張（`storage.js`）

- `saveSnapshots(list)` は内部利用
- 新規:
  - `exportSnapshots(): string`（JSON文字列）
  - `importSnapshots(json: string): boolean`（マージし重複はIDで排除）

## 設定（`DEFAULT_SETTINGS`）

```js
snapshots: {
  maxKeep: 20,
  minIntervalMs: 120000,
  minDeltaChars: 300
}
```

## マイグレーション

- 旧スキーマ配列を読み込んだら `type: 'auto'`, `docId: currentDocId` として埋める
- データサイズが大きくなった場合は IndexedDB へ自動移行（将来）

## テスト（抜粋）

- 設定値変更が保存/反映される
- 自動・手動を混在させて maxKeep 超過時に新しい順上位のみ残る
- 復元前プレビューで段落差分が正しく表示
- JSON エクスポート/インポートの往復でデータが一致
