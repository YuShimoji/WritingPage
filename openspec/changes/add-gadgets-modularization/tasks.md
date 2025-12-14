## 1. Implementation
- [x] 1.1 OpenSpec 変更提案・tasks・specs作成
- [x] 1.2 レンダリングキュー抽出（モジュール分割によりDOM更新責務を分離）
- [x] 1.3 設定管理抽出（prefs/settings API を分離）
- [x] 1.4 ロードアウト管理抽出（gadgets-loadouts.js）
- [x] 1.5 ZWGadgets.js リファクタ（_legacy へ退避し、core/utils/loadouts/init/builtin に分割）
- [x] 1.6 HTML script タグ更新（新規モジュール読み込み）
- [x] 1.7 テスト実行（Lint, スモーク, 機能確認）
- [x] 1.8 AI_CONTEXT.md 更新（進捗・次の中断可能点）

## 2. Verification
- [x] 全ガジェット機能が正常動作
- [x] レンダリングパフォーマンス維持
- [x] 設定永続化・ロードアウト切替正常
- [x] バンドルサイズ増加最小限

## 3. Follow-ups
- [ ] 各モジュールのユニットテスト追加
- [ ] 拡張APIのドキュメント化
