# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WP-001 UI 磨き上げ・摩擦軽減の継続 (session 34 で着手、方向はユーザー判断)
- デッドコード寄りのリソースは積極的に削除する (session 39 ユーザー指示)
- 意思決定・手動確認地点で区切りを設け、プランを提示する

## 未反映の是正要求

- 手動確認と次アクション選択を分離する (INTERACTION_NOTES に明記済み)

## Backlog Delta

### 既存 Backlog

- ~~`docs/FEATURE_REGISTRY.md` 作成~~ → session 45 でテンプレート追加済み（随時行を追加）
- ~~`docs/AUTOMATION_BOUNDARY.md` 作成~~ → session 45 でテンプレート追加済み

### 次スライス候補（WP-004 / WP-001、1 トピックずつ選定）

| 軸 | 候補 | 備考 |
|----|------|------|
| WP-004 | ~~Reader と MD プレビューの HTML パイプライン差分の監査~~ | session 46 で E2E 拡張 + `convertForExport` 修復済み。継続は差分発見時に追記 |
| WP-004 | ~~WYSIWYG 既定オフ時の Reader 導線の文言・`aria-*` の統一~~ | `index.html` / `reader-preview.js` / コマンドパレット説明文で統一（本セッション） |
| WP-001 | ~~コマンドパレットからのモード切替後のフォーカス遷移~~ | session 46 で実装・E2E 済み |
| WP-001 | 狭幅時ツールバー折り返し後の余白（`--toolbar-height` 同期は既存） | geometry E2E で監視中 |

### deferred 手動確認 (user actor)

- BL-002 改行効果切断の体感確認
- BL-004 Focus 半透明 hover の体感確認
- Reader ボタンのスタイル一貫性
- Focus 左パネル間隔の体感確認

## 解決済み (session 42-44)

- BL-001 Wiki 基準開発サイクル: wikilink → Reader 表示パス実装済み (reader-preview.js, e2e/wikilinks.spec.js)
- BL-002 改行効果切断: effectBreakAtNewline デフォルト true 実装済み (storage.js, editor-wysiwyg.js)
- BL-003 適用中エフェクト表示: _syncFormatState / _updateFormatIndicator 実装済み (editor-wysiwyg.js)
- BL-004 Focus 上部ヘッダー hover: 二段階 opacity (0.35→1.0) 実装済み (style.css). エッジグローフラッシュ追加 (session 44)
- BL-005 ドキュメント一括操作: チェックボックス選択 + 一括削除ボタン実装済み (gadgets-documents-hierarchy.js, gadgets-documents-tree.js)
- BL-006 サイドバーアコーディオン伸縮: _scheduleWritingFocusRender ガード追加 (sidebar-manager.js)

## 解決済み (session 37-40)

- Visual Audit スクリーンショットが重複して回帰シグナルにならない問題 → session 37 で実 UI フロー + 重複検出に改修
- Reader empty-state mismatch → session 37 で修正 (editor/document content fallback)
- Focus toolbar gap / left-panel overlap → session 37 で修正
- Reader return overlay → session 37 で修正
- E2Eテスト 42件の失敗 → session 39 で修正 (slim モード + viewport 外追従)
- Reader ボタンスタイル / Focus 左パネル間隔 → 手動確認 deferred (ユーザー選択)
- 装飾グループ + Canvas Mode hidden HTML 削除 → session 40 で完了 (-355行)
- WYSIWYG TB 最適化 (13→11ボタン + overflow) → session 40 で完了

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する
