# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WP-001 UI 磨き上げ・摩擦軽減の継続 (session 34 で着手、方向はユーザー判断)
- デッドコード寄りのリソースは積極的に削除する (session 39 ユーザー指示)
- 意思決定・手動確認地点で区切りを設け、プランを提示する

## 未反映の是正要求

- 手動確認と次アクション選択を分離する (INTERACTION_NOTES に明記済み)

## Backlog Delta

### ユーザー要望 (2026-04-02)

- **BL-001** Wiki 基準開発サイクル: Wiki にデータを入れ、エディタで [[wikilink]] を書き、Reader で表示確認する一巡を実施。Wiki 表示を今後の開発基準とする。仕様は spec-story-wiki.md に存在。ワークフロー proof 未実施
- **BL-002** リッチテキスト改行効果切断: 改行で効果が途切れる仕様をデフォルトでオン (改行で効果持続をデフォルトでオフ)
- **BL-003** 適用中エフェクト表示: 現在適用中のリッチテキスト効果を常時表示する機能。オン/オフ可能。混乱防止
- **BL-004** Focus モード上部ヘッダー非表示化 + hover スライドイン: 現在の見え方を要確認。ページ上部付近にマウスオーバーで半透明ディスクリプションをスライドイン → その要素をマウスオーバーで即座にツールバー操作可能にする。左サイドバーも同様の処理
- **BL-005** ドキュメント一括操作: 「ドキュメント」ファイル大量生成後のまとめ削除。チェックボックス or Ctrl/Shift 選択で操作を一括適用

- **BL-006** サイドバー「構造」アコーディオンが入力ごとに伸縮する (長期既存バグ、BL変更由来ではない)

### 既存 Backlog

- `docs/FEATURE_REGISTRY.md` 作成 (低優先: 直接 UX に影響しない canonical doc 補完)
- `docs/AUTOMATION_BOUNDARY.md` 作成 (低優先: 同上)
- deferred 手動確認: Reader ボタンスタイル一貫性 / Focus 左パネル間隔の体感確認 (ユーザー実環境)

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
