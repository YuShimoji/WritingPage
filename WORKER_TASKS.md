# Worker Tasks -- Zen Writer 並行作業シート

> 生成日: 2026-03-08 / v0.3.29
> 各Workerはこのファイルの該当セクション + CLAUDE.md + ROADMAP.md を読み込んで作業開始

---

## Worker 1: UI/UX 磨き上げ + 機能完成 (Priority A/B)

### スコープ

ROADMAP.md の Priority A (UI/UX) と Priority B (機能完成) を担当。

### コンテキスト

- Zen Writer: ブラウザベースの小説執筆エディタ (v0.3.29)
- 技術: Vanilla JS / CSS変数 / contenteditable (WYSIWYG) / LocalStorage
- テスト: Playwright E2E (203 cases, 30 spec files)
- HUMAN_AUTHORITY: UI/UX系の変更は方針承認が必要。実装の細部は自律実行OK

### 重要ファイル

- `index.html` -- メインHTML
- `css/style.css` -- メインCSS (テーマ・レイアウト)
- `js/modules/editor-core.js` -- エディタコア
- `js/modules/editor-wysiwyg.js` -- WYSIWYGエディタ
- `js/modules/sidebar-manager.js` -- サイドバー管理
- `js/gadgets-*.js` -- 各ガジェット
- `docs/spec-context-toolbar.md` -- ツールバー仕様
- `docs/VISUAL_PROFILE.md` -- Visual Profile仕様

### Priority A タスク

1. **`[BUG/P0]` エディタスクロールバグ**
   - 原因: `.editor-container` の `align-items: center` + `min-height: 100vh`
   - 最下行付近でスクロールが強制的に戻される
   - css/style.css の `.editor-container` を修正

2. **フローティングパネルのドラッグ対応**
   - `makeDraggable()` 共通関数で統一
   - js/modules/floating-panel.js 周辺

3. **テーマ間の一貫性**
   - 6テーマ (light/dark/sepia/obsidian/forest/ocean) の視覚的統一
   - css/style.css の `[data-theme="*"]` セクション

4. **アニメーション/トランジション改善**
   - サイドバー開閉、テーマ切り替え、モード遷移の滑らかさ

### Priority B タスク

1. **Wiki/グラフビュー** -- バックリンクUI統合、`[[wikilink]]`自動パース
2. **WYSIWYGテキストアニメーション** -- リアルタイムプレビュー、タイムライン制御
3. **ルビテキスト** -- 形態素解析による自動ルビ
4. **サイドバー Phase 2-3** -- ガジェットDnD並び替え、通信基盤

### テスト

```bash
npm run lint          # ESLint (0 errors を維持)
npx playwright test   # E2E (197+ passed を維持)
```

### 注意事項

- ESLint: eslint:recommended は使用しない。明示的5ルールのみ (.eslintrc.js)
- sourceType: 'script' (ES modulesではない)
- ツールバー非表示は transform 方式 (display:none ではない)
- エッジホバー: data-edge-hover-top/left 属性で制御
- ガジェット登録: `ZWGadgets.register()` API

---

## Worker 2: ガジェット整理 (Priority C)

### スコープ

ROADMAP.md の Priority C を担当。28個のガジェットの分析・統合。

### コンテキスト

- 28個のガジェットが `ZWGadgets.register()` で登録
- ロードアウト (プリセット): gadgets-loadout.js で管理
- SidebarManager: 5カテゴリ (structure/edit/theme/assist/advanced)
- HUMAN_AUTHORITY: ガジェット統合・削除の方針は承認が必要

### 重要ファイル

- `js/gadgets-core.js` -- ガジェットフレームワーク
- `js/gadgets-utils.js` -- ユーティリティ (GADGET_GROUPS等)
- `js/gadgets-init.js` -- 初期化・ロードアウト適用
- `js/gadgets-builtin.js` -- 組み込みガジェット登録
- `js/gadgets-loadout.js` -- ロードアウト管理
- `js/gadgets-*.js` -- 個別ガジェットファイル (約15ファイル)
- `docs/GADGETS.md` -- ガジェットリファレンス (SSOT)

### タスク

1. **利用状況分析**
   - 全28ガジェットの役割・重複を整理
   - 使用頻度の低いガジェットを特定
   - 統合候補: Typography + FontDecoration、UISettings + UIDesign 等

2. **統合計画の策定**
   - 統合後のガジェット数目標を提案
   - 後方互換性 (設定の移行パス) を設計
   - ロードアウトプリセットへの影響を評価

3. **実装** (承認後)
   - ガジェット統合の実装
   - GADGETS.md の更新
   - E2Eテストの修正

### ガジェット一覧の取得方法

```bash
# 登録されている全ガジェットを検索
grep -rn "ZWGadgets.register" js/ --include="*.js"
```

### テスト

```bash
npm run lint
npx playwright test
```

---

## Worker 3: ストレージ基盤刷新 (Priority E)

### スコープ

ROADMAP.md の Priority E を担当。LocalStorage → IndexedDB の移行。

### コンテキスト

- 現在: 全データが localStorage に保存 (ドキュメント、設定、スナップショット)
- 問題: 容量制限 (5-10MB)、大量ドキュメントでパフォーマンス低下
- 目標: IndexedDB への段階的移行
- HUMAN_AUTHORITY: API設計・データモデルは承認が必要。移行スクリプトは自律実行OK

### 重要ファイル

- `js/modules/storage.js` -- ストレージ抽象層
- `js/modules/editor-core.js` -- ドキュメント保存/読み込み
- `js/gadgets-snapshot.js` -- スナップショット管理
- `docs/SNAPSHOT_DESIGN.md` -- スナップショットv2設計 (IndexedDB移行を含む)

### タスク

1. **現在のストレージ使用箇所の調査**
   - localStorage への読み書き箇所を全て特定
   - データキー・形式・サイズの一覧作成

2. **IndexedDB API設計**
   - storage.js の抽象層を設計 (localStorage/IndexedDB切り替え可能に)
   - async/await ベースのAPI
   - データモデル (stores: documents, settings, snapshots, gadgetPrefs)

3. **段階的移行**
   - Phase 1: IndexedDB wrapper + 既存localStorage互換
   - Phase 2: 新規データをIndexedDBに書き込み
   - Phase 3: 既存データの自動移行スクリプト
   - Phase 4: localStorage依存の完全除去

4. **テスト**
   - IndexedDB のモック/polyfill によるユニットテスト
   - E2Eテストの更新

### localStorage使用箇所の調査方法

```bash
# localStorageの使用箇所を全て検索
grep -rn "localStorage" js/ --include="*.js"
grep -rn "getItem\|setItem\|removeItem" js/ --include="*.js"
```

### テスト

```bash
npm run lint
npx playwright test
```

---

## 共通ルール

- **CLAUDE.md** を必ず読んでから作業開始
- **日本語** で応答
- **ESLint 0 errors** を維持
- **E2E テスト** の既存パス数を減らさない
- コミットメッセージ: `feat:/fix:/docs:/chore:/refactor: 概要`
- trunk-based: main ブランチに直接コミット
