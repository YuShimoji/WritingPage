# Worker Prompt: SP-076 Dock Panel Phase 2-3

> 生成日: 2026-03-23 / 担当: 独立Worker (Opus推奨 / HUMAN_AUTHORITY判断あり)
> 並行実行: 条件付き可 (UIレイアウト変更はコアセッションに確認)

## 概要

ドックパネルシステムの拡張。Phase 1 (左右ドック + サイドバー幅永続化) は完了済み。
Phase 2 でタブグループ化、Phase 3 でフローティング&スナップを実装する。

## 現状

- `js/dock-manager.js` (283行): Phase 1実装済み
- `css/dock-panel.css` (217行): Phase 1スタイル
- `e2e/dock-panel.spec.js` (13件): Phase 1テスト
- 仕様: `docs/specs/spec-dock-panel.md`

## Phase 2: タブグループ

### ユーザー操作列
1. ドックパネルにガジェットをドラッグ
2. 複数ガジェットが同じドックに入ると、タブで切り替え可能になる
3. タブの並び替え (ドラッグ)
4. タブをドラッグしてドック外に出すとフローティング化 (Phase 3)

### 成功条件
- 2つ以上のガジェットを同一ドックに配置するとタブヘッダーが表示される
- タブクリックで表示切り替え
- タブの並び替えが可能
- ドック状態がリロード後も復元される

### HUMAN_AUTHORITY 判断が必要な項目
- タブUIのデザイン (上部タブ / 下部タブ / アイコンのみ)
- タブのデフォルト配置ポリシー
- ガジェットごとのドック可否設定

→ これらは実装前にコアセッション経由でユーザーに確認すること

## Phase 3: フローティング & スナップ

### ユーザー操作列
1. タブをドラッグしてドック外にドロップ → フローティングパネル化
2. フローティングパネルをドックエッジにドラッグ → スナップ (再ドック)
3. フローティングパネルのリサイズ

### 成功条件
- フローティング化/再ドック化が自然に動作する
- フローティング位置・サイズがリロード後も復元される
- 既存のフローティングパネル (floating-panel) との共存

## 技術的制約

- pointer events ベースのドラッグ (mousedownではなく)
- IndexedDB への状態永続化 (`storage.js` の既存API使用)
- CSS変数ベースのテーマ対応 (ハードコード色禁止)
- `prefers-reduced-motion` 対応

## 検証

- `npm run lint:js:check` パス
- `npx playwright test` 全パス
- e2e/dock-panel.spec.js にPhase 2-3テスト追加

## 関連ファイル

- `js/dock-manager.js` -- 主要実装
- `css/dock-panel.css` -- スタイル
- `js/gadgets-builtin.js` -- ガジェット登録
- `js/sidebar-manager.js` -- サイドバーとの連携
- `docs/specs/spec-dock-panel.md` -- 仕様書
