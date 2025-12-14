## 1. Implementation
- [x] 1.1 CSSに `--app-bg-gradient` を導入し `body` に適用
- [x] 1.2 `UIDesign` ガジェット実装（線形/放射、角度、2色、強度、永続化）
- [x] 1.3 `SidebarManager` に `addTab/removeTab/renameTab` を追加（未登録DOMの自動登録）
- [x] 1.4 `UI Settings` ガジェットにタブ管理UIを実装・API接続
- [x] 1.5 タブ表示方式変更時の適用先を `sidebarManager.applyTabsPresentationUI` に修正
- [x] 1.6 `app.js` でカスタムタブ復元、`tabManager` 参照先の統一
- [x] 1.7 動作確認（手動/スモーク）
- [x] 1.8 OpenSpec 変更票/仕様差分/タスク記録
- [x] 1.9 AI_CONTEXT.md 更新（申し送り）

## 2. Verification
- [x] 背景グラデーションのオン/オフ・強度・角度反映
- [x] タブの追加/名称変更/削除・復元
- [x] 既存タブ操作やロードアウトへの影響なし

## 3. Follow-ups
- [x] アイコンセット選定/導入（Lucide/Tabler/Heroicons/Material Symbols から選定）
- [x] ガジェット基盤の責務分離/モジュール化設計の実施
