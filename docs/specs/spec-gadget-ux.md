# ガジェットUX改善 仕様書

## 概要

サイドバー内のガジェット表示をコンパクト化し、個別の折りたたみ・ヘルプ表示・一括操作を追加する。
執筆時にサイドバーを開いた際の情報密度を高め、必要なガジェットだけを展開して使える状態を目指す。

## 現状の課題

- ガジェット間の余白 (gap: 12px) が大きく、1画面に少数しか表示できない
- `.accordion-category` (border+border-radius) の中に `.gadget-wrapper` が並び、二重のボックス感がある
- 個別ガジェットを折りたたむ手段がなく、使わないガジェットも常に展開されている
- ガジェットの説明/ヘルプがないため、何ができるか分かりにくい

## 変更対象

- `css/style.css` (レイアウト・余白・折りたたみスタイル)
- `js/gadgets-core.js` の `init()` メソッド (ヘッダーのクリック処理・ヘルプアイコン・折りたたみ状態管理)
- `js/gadgets-builtin.js` 等 (各ガジェットの `description` フィールド追加)
- 設定ガジェット (ヘルプ表示・一括操作ボタンのオン/オフ)

---

## 仕様

### 1. 余白のコンパクト化

#### 1.1 ガジェット間の余白削減

| セレクタ | 現在 | 変更後 |
|---------|------|--------|
| `.gadgets-panel` | `gap: 12px` | `gap: 4px` |
| `.gadget-wrapper` | `gap: 8px` | `gap: 2px` |
| `.gadget-header` | `margin-bottom: 2px` | `margin-bottom: 0` |
| `.accordion-content` | `padding: 0 12px 12px 12px` | `padding: 0 8px 8px 8px` |

#### 1.2 二重ボックス感の解消

- `.gadget-wrapper` の背景・ボーダーを除去 (暗黙的なカード感をなくす)
- `.accordion-category` のボーダーのみを外枠として残す
- ガジェット間の区切りは軽い divider (1px の border-top / border-color) で表現

### 2. 個別ガジェット折りたたみ

#### 2.1 基本動作

- `.gadget-header` をクリックすると `.gadget` (コンテンツ部分) が開閉する
- **デフォルト: 全ガジェット折りたたみ** (初回訪問時)
- 折りたたみ状態は localStorage に保存 (キー: `zenwriter-gadget-collapsed`)
- 保存形式: `{ [gadgetName]: boolean }` (true = 展開)

#### 2.2 DOM 属性

- `.gadget-wrapper` に `data-gadget-collapsed="true|false"` を付与
- `.gadget-header` に `aria-expanded="true|false"` を付与
- `.gadget-header` に `role="button"`, `tabindex="0"` を付与 (キーボードアクセシビリティ)

#### 2.3 chevron アイコン

- `.gadget-header` の右端 (`.gadget-controls` 内、切り離しボタンの左) に chevron を追加
- Lucide アイコン `chevron-down` を使用
- 展開時: 180度回転 (既存の `.accordion-icon` と同じパターン)
- サイズ: 14px

#### 2.4 折りたたみアニメーション (Phase 2)

- 初期実装: `display: none/block` による即時切り替え
- 将来: `max-height` + `overflow: hidden` による height transition
  - 展開: `max-height: 0` → `max-height: var(--gadget-max-h, 500px)`, `opacity: 0` → `1`
  - 折りたたみ: 逆方向
  - duration: `0.2s ease-out`
  - `.gadget-wrapper` に `transition: max-height 0.2s ease-out, opacity 0.15s` を設定
- Phase 2 の判定基準: 基本機能が安定してから着手

### 3. ガジェットヘルプ

#### 3.1 ヘルプアイコン

- `.gadget-title` の右隣 (タイトルとコントロールの間) に `?` アイコンを配置
- Lucide アイコン `help-circle` を使用 (サイズ: 14px, opacity: 0.5)
- ホバーで `opacity: 1` に変化

#### 3.2 ヘルプ表示

- アイコンクリックで `.gadget-help` ツールチップを表示/非表示
- ツールチップ内容: ガジェット登録時の `description` フィールド
- 表示位置: ヘッダー直下 (折りたたみコンテンツの上)
- スタイル: 小さめフォント (0.8rem), 背景を少し変えて区別

#### 3.3 ガジェット側の対応

- `ZWGadgets.register()` の引数に `description: string` を追加 (オプション)
- 既存ガジェットに順次 description を追加
- description がないガジェットはヘルプアイコンを非表示

#### 3.4 設定によるオン/オフ

- 設定項目: 「ガジェットヘルプアイコンを表示」(デフォルト: ON)
- localStorage キー: `zenwriter-gadget-help-visible`
- OFF 時: `.gadget-help-btn` に `display: none` を適用

### 4. カテゴリヘッダーの一括操作

#### 4.1 全て折りたたむ/展開するボタン

- `.accordion-header` 内 (カテゴリ名の右、chevron の左) にアイコンボタン2つ
  - `chevrons-down-up` (全折りたたみ) / `chevrons-up-down` (全展開)
  - または1ボタンでトグル: 現在の状態に応じて切り替え
- クリックで該当カテゴリ内の全ガジェットを一括開閉
- サイズ: 16px, opacity: 0.5, hover で 1

#### 4.2 設定によるオン/オフ

- 設定項目: 「カテゴリの一括折りたたみボタンを表示」(デフォルト: ON)
- localStorage キー: `zenwriter-gadget-bulk-toggle-visible`
- OFF 時: ボタンに `display: none` を適用

---

## 実装順序

| Step | 内容 | 影響範囲 |
|------|------|----------|
| 1 | 余白コンパクト化 (CSS のみ) | style.css |
| 2 | 個別折りたたみ (デフォルト折りたたみ + localStorage 保存) | gadgets-core.js, style.css |
| 3 | ヘルプアイコン + description フィールド | gadgets-core.js, gadgets-builtin.js 等 |
| 4 | カテゴリ一括操作ボタン | gadgets-core.js / sidebar-manager.js, style.css |
| 5 | 設定項目 (ヘルプ/一括操作の表示切替) | gadgets-init.js / settings |
| 6 | 折りたたみアニメーション (Phase 2) | style.css |

## 設定一覧

| 設定名 | キー | デフォルト | 説明 |
|--------|------|-----------|------|
| ガジェットヘルプ表示 | `zenwriter-gadget-help-visible` | `true` | ヘルプアイコンの表示/非表示 |
| 一括折りたたみボタン表示 | `zenwriter-gadget-bulk-toggle-visible` | `true` | カテゴリヘッダーの一括ボタン表示/非表示 |

## 非スコープ

- ガジェットの並び替え (既存のドラッグ&ドロップで対応済み)
- ガジェットの有効/無効切り替え (ロードアウトシステムで対応済み)
- サイドバー自体の幅変更
