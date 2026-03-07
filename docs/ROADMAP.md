# ROADMAP — Zen Writer 機能強化ロードマップ

> 最終更新: 2026-03-07 / v0.3.29

## 現在の状態

- E2E: 203 test cases (30 spec files) -- 197 passed / 5 flaky timeout / 1 skipped
- CI: GitHub Actions green
- コア機能: 95% 成熟
- ガジェット: 31個登録済み

---

## Priority A: エクスポート刷新

小説エディタとして最も価値の高い改善。TXT/MDしかない現状は致命的。

- PDF エクスポート (中) -- ブラウザ印刷API or jsPDF。縦書き/横書き選択
- EPUB エクスポート (中) -- epub-gen等。章構造をTOCに反映
- DOCX エクスポート (低-中) -- docx.js等。基本フォーマット保持
- ワークスペース一括書き出し (低) -- 全ドキュメントをZip化

## Priority B: ガジェット整理

31個は多すぎる可能性。類似機能の統合、使用頻度の低いものの廃止を検討。

- ガジェット利用状況分析 -- 実際の使用頻度を計測する仕組みの導入
- 類似ガジェット統合 -- Typography + FontDecoration、UISettings + UIDesign 等
- ロードアウトプリセット見直し -- デフォルトロードアウトの最適化

## Priority C: 中途半端な機能の完成

### Wiki/グラフビュー

- バックリンクUI統合
- `[[wikilink]]` 構文の自動パース
- グラフビュー (link-graph.js) のUI統合

### 画像管理

- ドラッグ&ドロップでの位置調整
- 画像フィルタ/レイヤ機能

### スペルチェック

- 日本語対応 (形態素解析)
- カスタム辞書管理UI

## Priority D: ストレージ基盤刷新

- IndexedDB 移行 -- localStorage → IndexedDB。大容量対応
- データ移行スクリプト -- 既存 localStorage データの自動移行
- クラウド同期基盤 -- 将来のクラウド同期への布石

---

## 長期ビジョン

- AI連携 (要約、シーンアイデア生成)
- コラボレーション編集
- Embed SDK v2 (イベントストリーム、状態同期)
- TypeScript段階移行
