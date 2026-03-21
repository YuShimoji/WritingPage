# SP-061 Visual Profile Typography Pack 仕様

## 目的
`Visual Profile` にタイポグラフィ設定パックを接続し、「執筆」「校正」「演出確認」など作業文脈ごとに一括切替できるようにする。

## ステータス
- Phase 1: done (コアロジック + 4パック定義)
- Phase 2: done (ガジェットUI / パック選択ドロップダウン / リロード復元)

## 実装内容 (Phase 1)

### Typography Pack 定義

| パックID | ラベル | 本文サイズ | 行間 | 字間 | 見出し | ルビ | 字下げ |
|----------|--------|-----------|------|------|--------|------|--------|
| silent-writing | 執筆集中 | 18px | 2.0 | 0.04em | novel | 非表示 | あり |
| reference-reading | 資料読解 | 15px | 1.5 | 0em | default | 表示 | なし |
| proofreading | 校正 | 17px | 2.2 | 0.06em | default | 表示 | あり |
| staging-check | 演出確認 | 16px | 1.8 | 0.02em | novel | 表示 | あり |

### API

```javascript
// パック一覧取得
ZenWriterVisualProfile.getTypographyPacks()

// パック適用
ZenWriterVisualProfile.applyTypographyPack('silent-writing')

// 現在のパックID取得
ZenWriterVisualProfile.getCurrentTypographyPackId()

// パッククリア
ZenWriterVisualProfile.clearTypographyPack()
```

### 適用される設定

- `--font-size`: 本文フォントサイズ
- `--line-height`: 行間
- `--body-letter-spacing`: 字間
- `data-paragraph-indent`: 段落字下げ
- `data-ruby-hidden`: ルビ可視性
- `--heading-h{1-6}-*`: 見出しプリセット (HeadingPresetRegistry 経由)

### Visual Profile 連携

- `VisualProfile.typographyPack` フィールドで、プロファイル適用時にパックも一括適用
- `focus-dark` プロファイルにはデフォルトで `silent-writing` パックを設定

### 保存

- 適用中パックIDは `localStorage('zenWriter_typographyPack')` に保存
- リロード後の復元はガジェットUI (Phase 2) で実装予定

## 実装内容 (Phase 2)

### ガジェットUI
- Typography ガジェット内に「タイポグラフィパック」セクションを追加
- ドロップダウンで4パック + 「なし」を選択可能
- パック説明文をドロップダウン下部に表示
- パック適用後、個別設定スライダーも同期更新
- `ZenWriterTypographyPackApplied` イベントでUI同期

### リロード復元
- `app.js` 初期化時に `localStorage('zenWriter_typographyPack')` から復元
- Visual Profile 適用時の `profile.typographyPack` 経由の復元と併存

## 受け入れ基準

1. [x] パック選択で複数タイポ値が一括適用される
2. [x] 適用後に個別調整してもプロファイルが破壊されず、差分として保存される (Phase 2)
3. [x] リロード後に最後のパック状態が再現される (Phase 2)
4. [x] 既存の theme/font 設定のみ利用ユーザーに後方互換影響を与えない

## 依存関係

- 前提: SP-012 (Visual Profile), SP-057 (Micro Typography), SP-058 (Heading Typography)
- 連携: SP-059 (Ruby), SP-060 (Decoration Presets)

## 影響範囲

- `js/visual-profile.js`: TYPOGRAPHY_PACKS 定義 + applyTypographyPack() + API公開
- `js/gadgets-typography.js`: パック選択ドロップダウンUI + イベント同期
- `js/app.js`: リロード時パック復元
